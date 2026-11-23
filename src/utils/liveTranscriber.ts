// Real-time Wispr-Flow-style voice transcription engine
// Primary: Deepgram Nova-3 Streaming WebSocket (/ws/transcribe) with Gemini Live STT fallback
// Client Fallback: Web Speech API + Valid Standalone Turn Audio Recording (/api/ai/transcribe-answer)

import { createSpeechRecognizer, isSpeechRecognitionSupported } from './speech';

export type LiveTranscriberStatus =
  | 'idle'
  | 'connecting'
  | 'live'
  | 'reconnecting'
  | 'fallback'
  | 'paused'
  | 'stopped'
  | 'unavailable';

export interface LiveTranscriberCallbacks {
  onStatusChange?: (status: LiveTranscriberStatus, providerLabel?: string) => void;
  onFinalText?: (fullFinalizedText: string, deltaText: string) => void;
  onInterimText?: (interimText: string) => void;
  onAudioLevel?: (level: number) => void;
  onSilenceStateChange?: (isSilentPause: boolean) => void;
  onBackgroundNoiseChange?: (detected: boolean, noiseScore: number, reason?: string) => void;
  onExcessiveNoiseHold?: (holdMs: number, triggeredAttempt: boolean, noiseScore: number, reason?: string) => void;
  onVoiceCommand?: (command: 'repeat' | 'clarify', utterance: string) => void;
}

const REPEAT_PHRASE_REGEX =
  /\b(repeat|say that again|didn'?t catch|did not catch|didn'?t get|did not get|didn'?t hear|did not hear|come again|pardon|once more|one more time)\b/i;

const CLARIFY_PHRASE_REGEX =
  /\b(clarify|clarification|didn'?t understand|did not understand|explain the question|what do you mean|rephrase)\b/i;

function normalizeWordToken(w: string): string {
  return w.toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '');
}

/**
 * Smart deduplicating merge for streaming STT output.
 * Handles both cumulative chunks and incremental chunks without duplicate overlapping phrases.
 */
export function mergeTranscriptSegment(
  existing: string,
  incoming: string,
  discrete = false
): { merged: string; delta: string } {
  const cleanExisting = existing.replace(/\s+/g, ' ').trim();
  const cleanIncoming = incoming.replace(/\s+/g, ' ').trim();

  if (!cleanIncoming) {
    return { merged: cleanExisting, delta: '' };
  }
  if (!cleanExisting) {
    return { merged: cleanIncoming, delta: cleanIncoming };
  }

  const existingWords = cleanExisting.split(' ');
  const incomingWords = cleanIncoming.split(' ');

  if (!discrete && cleanExisting.toLowerCase().endsWith(cleanIncoming.toLowerCase())) {
    return { merged: cleanExisting, delta: '' };
  }

  const tailWindow = existingWords.slice(-Math.min(10, existingWords.length)).map(normalizeWordToken);
  const incomingNorm = incomingWords.map(normalizeWordToken);

  if (
    tailWindow.length >= 2 &&
    incomingNorm.length >= tailWindow.length &&
    tailWindow.every((w, idx) => w === incomingNorm[idx])
  ) {
    const newTail = incomingWords.slice(tailWindow.length).join(' ');
    if (!newTail) return { merged: cleanExisting, delta: '' };
    return { merged: `${cleanExisting} ${newTail}`.trim(), delta: newTail };
  }

  const maxOverlap = Math.min(8, existingWords.length, incomingWords.length);
  const minOverlap = discrete ? 2 : 1;
  let overlapCount = 0;
  for (let k = maxOverlap; k >= minOverlap; k--) {
    let matches = true;
    for (let i = 0; i < k; i++) {
      const a = normalizeWordToken(existingWords[existingWords.length - k + i]);
      const b = normalizeWordToken(incomingWords[i]);
      if (!a || a !== b) {
        matches = false;
        break;
      }
    }
    if (matches) {
      overlapCount = k;
      break;
    }
  }

  const deltaWords = incomingWords.slice(overlapCount);
  const delta = deltaWords.join(' ').trim();
  if (!delta) {
    return { merged: cleanExisting, delta: '' };
  }

  return {
    merged: `${cleanExisting} ${delta}`.trim(),
    delta
  };
}

function downsampleTo16kPcmBase64(input: Float32Array, sourceRate: number): string {
  const targetRate = 16000;
  let samples: Float32Array;
  if (sourceRate === targetRate) {
    samples = input;
  } else {
    const ratio = sourceRate / targetRate;
    const newLength = Math.max(1, Math.round(input.length / ratio));
    samples = new Float32Array(newLength);
    for (let i = 0; i < newLength; i++) {
      const start = Math.floor(i * ratio);
      const end = Math.min(input.length, Math.floor((i + 1) * ratio));
      let acc = 0;
      let count = 0;
      for (let j = start; j < end; j++) {
        acc += input[j];
        count++;
      }
      samples[i] = count > 0 ? acc / count : input[Math.min(start, input.length - 1)] || 0;
    }
  }

  const buffer = new ArrayBuffer(samples.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export class LiveVoiceTranscriber {
  private callbacks: LiveTranscriberCallbacks;
  private stream: MediaStream | null = null;
  private ws: WebSocket | null = null;
  private audioCtx: AudioContext | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private recognizer: any = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private recordedMime = 'audio/webm';

  private status: LiveTranscriberStatus = 'idle';
  private providerLabel = 'Live Voice STT';
  private domainHint = '';
  private finalizedText = '';
  private interimText = '';
  private isPaused = false;
  private isDestroyed = false;
  private useFallbackBrowserStt = false;
  private fallbackRecognizerActive = false;
  private fallbackLastEventMs = 0;
  private wsTranscriptCount = 0;
  private firstSpokenWithAudioMs = 0;
  private reconnectAttempts = 0;
  private reconnectTimer: number | null = null;
  private fallbackRestartTimer: number | null = null;

  private lastVoiceMs = 0;
  private hasSpokenThisTurn = false;
  private silentPauseFlag = false;
  private silenceWatchdog: number | null = null;

  // Real-time Background Noise Detection state
  private recentRmsLevels: number[] = [];
  private freqBins: Uint8Array<ArrayBuffer> | null = null;
  private noiseConfirmStreak = 0;
  private noiseClearStreak = 0;
  private heavyNoiseSinceMs = 0;
  private backgroundNoiseActive = false;

  constructor(callbacks: LiveTranscriberCallbacks) {
    this.callbacks = callbacks;
  }

  public getStatus(): LiveTranscriberStatus {
    return this.status;
  }

  public getProviderLabel(): string {
    return this.providerLabel;
  }

  public getFinalizedText(): string {
    return this.finalizedText;
  }

  public getInterimText(): string {
    return this.interimText;
  }

  public setFinalizedTextManual(text: string): void {
    this.finalizedText = text;
    this.interimText = '';
  }

  private updateStatus(next: LiveTranscriberStatus, label?: string) {
    this.status = next;
    if (label) this.providerLabel = label;
    this.callbacks.onStatusChange?.(next, this.providerLabel);
  }

  public start(stream: MediaStream, options?: { domain?: string }) {
    this.isDestroyed = false;
    this.isPaused = false;
    this.stream = stream;
    this.domainHint = options?.domain || '';
    this.useFallbackBrowserStt = false;
    this.fallbackRecognizerActive = false;
    this.reconnectAttempts = 0;
    this.wsTranscriptCount = 0;
    this.firstSpokenWithAudioMs = 0;
    this.recentRmsLevels = [];
    this.noiseConfirmStreak = 0;
    this.noiseClearStreak = 0;
    this.backgroundNoiseActive = false;

    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) {
      this.updateStatus('unavailable', 'Text Input Only');
      return;
    }

    this.startAudioCapturePipeline(audioTracks);
    this.startSilenceWatchdog();
    // Start MediaRecorder cleanly only if not immediately paused
    if (!this.isPaused) {
      this.startEphemeralTurnRecorder(audioTracks);
    }
    this.connectLiveWebSocket();
  }

  public pause() {
    this.isPaused = true;
    this.interimText = '';
    this.heavyNoiseSinceMs = 0;
    this.noiseConfirmStreak = 0;
    this.noiseClearStreak = 0;
    this.callbacks.onExcessiveNoiseHold?.(0, false, 0);
    this.callbacks.onInterimText?.('');
    this.stopBrowserSpeechFallback();
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      try {
        this.mediaRecorder.pause();
      } catch {
        // ignore if pause unsupported
      }
    }
    this.updateStatus('paused', this.providerLabel);
  }

  public resume() {
    if (this.isDestroyed || !this.stream) return;
    this.isPaused = false;
    this.lastVoiceMs = Date.now();
    this.setSilentPause(false);

    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

    const audioTracks = this.stream.getAudioTracks();
    if (audioTracks.length > 0) {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        // Start a brand-new standalone turn recorder with a fresh WebM/MP4 header
        this.startEphemeralTurnRecorder(audioTracks);
      } else if (this.mediaRecorder.state === 'paused') {
        try {
          this.mediaRecorder.resume();
        } catch {
          this.startEphemeralTurnRecorder(audioTracks);
        }
      }
    }

    if (this.useFallbackBrowserStt) {
      this.startBrowserSpeechFallback();
      this.updateStatus('fallback', 'Live Speech + AI Refine');
    } else if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.updateStatus('live', this.providerLabel || 'Live Voice STT');
    } else {
      this.connectLiveWebSocket();
    }
  }

  public resetTurn(keepListening = true) {
    this.finalizedText = '';
    this.interimText = '';
    this.hasSpokenThisTurn = false;
    this.firstSpokenWithAudioMs = 0;
    this.lastVoiceMs = Date.now();
    this.setSilentPause(false);
    this.stopEphemeralRecorderDiscard();
    this.callbacks.onFinalText?.('', '');
    this.callbacks.onInterimText?.('');

    if (keepListening && this.stream && !this.isDestroyed) {
      this.isPaused = false;
      const aTracks = this.stream.getAudioTracks();
      if (aTracks.length > 0) {
        this.startEphemeralTurnRecorder(aTracks);
        if (this.useFallbackBrowserStt) {
          this.startBrowserSpeechFallback();
        }
      }
    }
  }

  public async flushTurnAudio(): Promise<{ blob: Blob | null; mimeType: string }> {
    const rec = this.mediaRecorder;
    const mimeType = this.recordedMime || 'audio/webm';
    const extractAndClear = () => {
      const chunks = this.recordedChunks;
      const blob = chunks.length > 0 ? new Blob(chunks, { type: mimeType }) : null;
      this.recordedChunks = [];
      this.mediaRecorder = null;
      return { blob, mimeType };
    };

    if (!rec || rec.state === 'inactive') {
      return extractAndClear();
    }

    return new Promise((resolve) => {
      let resolved = false;
      const done = () => {
        if (resolved) return;
        resolved = true;
        resolve(extractAndClear());
      };
      rec.addEventListener('stop', done, { once: true });
      try {
        if (rec.state === 'recording') {
          try {
            rec.requestData();
          } catch {
            // ignore
          }
        }
        rec.stop();
      } catch {
        done();
      }
      window.setTimeout(done, 850);
    });
  }

  public stop() {
    this.isDestroyed = true;
    this.isPaused = true;
    this.interimText = '';
    this.callbacks.onInterimText?.('');

    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.fallbackRestartTimer !== null) {
      window.clearTimeout(this.fallbackRestartTimer);
      this.fallbackRestartTimer = null;
    }
    if (this.silenceWatchdog !== null) {
      window.clearInterval(this.silenceWatchdog);
      this.silenceWatchdog = null;
    }

    this.stopBrowserSpeechFallback();

    if (this.ws) {
      try {
        this.ws.onclose = null;
        this.ws.onerror = null;
        this.ws.onmessage = null;
        this.ws.close();
      } catch {
        // ignore
      }
      this.ws = null;
    }

    if (this.analyserNode) {
      try {
        this.analyserNode.disconnect();
      } catch {
        // ignore
      }
      this.analyserNode = null;
    }
    if (this.processorNode) {
      try {
        this.processorNode.disconnect();
      } catch {
        // ignore
      }
      this.processorNode = null;
    }
    if (this.gainNode) {
      try {
        this.gainNode.disconnect();
      } catch {
        // ignore
      }
      this.gainNode = null;
    }
    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch {
        // ignore
      }
      this.sourceNode = null;
    }
    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }

    this.stopEphemeralRecorderDiscard();
    this.updateStatus('stopped', this.providerLabel);
  }

  private stopEphemeralRecorderDiscard() {
    if (this.mediaRecorder) {
      const oldRec = this.mediaRecorder;
      this.mediaRecorder = null;
      oldRec.ondataavailable = null;
      if (oldRec.state !== 'inactive') {
        try {
          oldRec.stop();
        } catch {
          // ignore
        }
      }
    }
    this.recordedChunks = [];
  }

  private setSilentPause(next: boolean) {
    if (this.silentPauseFlag !== next) {
      this.silentPauseFlag = next;
      this.callbacks.onSilenceStateChange?.(next);
    }
  }

  private startSilenceWatchdog() {
    if (this.silenceWatchdog !== null) {
      window.clearInterval(this.silenceWatchdog);
    }
    this.silenceWatchdog = window.setInterval(() => {
      if (this.isDestroyed || this.isPaused) return;

      // Ensure AudioContext never stays suspended after long silence/pauses
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }

      if (this.hasSpokenThisTurn && Date.now() - this.lastVoiceMs > 2600) {
        this.setSilentPause(true);
      }

      // Safety net: if user has been speaking into mic for >3.5s and Live STT WS produced 0 text,
      // automatically engage browser SpeechRecognition fallback so live words appear!
      if (
        !this.useFallbackBrowserStt &&
        this.firstSpokenWithAudioMs > 0 &&
        Date.now() - this.firstSpokenWithAudioMs > 3500 &&
        this.wsTranscriptCount === 0 &&
        !this.finalizedText &&
        !this.interimText
      ) {
        this.activateBrowserSpeechFallback();
      }

      // Continuous-listening self-healing guarantee for Browser SpeechRecognition:
      // Never let a post-silence timeout or stall stop listening before submission!
      if (this.useFallbackBrowserStt && isSpeechRecognitionSupported()) {
        const now = Date.now();
        if (!this.fallbackRecognizerActive && this.fallbackRestartTimer === null) {
          this.startBrowserSpeechFallback();
        } else if (
          this.fallbackRecognizerActive &&
          this.fallbackLastEventMs > 0 &&
          now - this.fallbackLastEventMs > 45000 &&
          this.fallbackRestartTimer === null
        ) {
          // Refresh stalled SpeechRecognition instance after prolonged silence
          this.stopBrowserSpeechFallback();
          this.startBrowserSpeechFallback();
        }
      }

      // Continuous-listening guarantee for WebSocket STT: recover dropped WS cleanly
      if (
        !this.useFallbackBrowserStt &&
        this.reconnectTimer === null &&
        (!this.ws || (this.ws.readyState !== WebSocket.OPEN && this.ws.readyState !== WebSocket.CONNECTING))
      ) {
        this.scheduleReconnect();
      }
    }, 600);
  }

  private startEphemeralTurnRecorder(audioTracks: MediaStreamTrack[]) {
    if (typeof MediaRecorder === 'undefined') return;
    this.stopEphemeralRecorderDiscard();
    try {
      const audioStream = new MediaStream(audioTracks);
      const preferredTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
      const chosenMime = preferredTypes.find((t) => MediaRecorder.isTypeSupported(t)) || '';
      const rec = chosenMime
        ? new MediaRecorder(audioStream, { mimeType: chosenMime })
        : new MediaRecorder(audioStream);
      this.recordedMime = rec.mimeType || 'audio/webm';
      rec.ondataavailable = (ev) => {
        // Always capture header & valid media packets while this recorder instance is active
        if (ev.data && ev.data.size > 0) {
          this.recordedChunks.push(ev.data);
        }
      };
      rec.start(400);
      this.mediaRecorder = rec;
    } catch {
      // ignore if unsupported
    }
  }

  private startAudioCapturePipeline(audioTracks: MediaStreamTrack[]) {
    if (typeof AudioContext === 'undefined') return;
    try {
      if (this.audioCtx) {
        this.audioCtx.close().catch(() => {});
      }
      const audioCtx = new AudioContext();
      this.audioCtx = audioCtx;
      if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }
      const audioStream = new MediaStream(audioTracks);
      const source = audioCtx.createMediaStreamSource(audioStream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.55;
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      const zeroGain = audioCtx.createGain();
      zeroGain.gain.value = 0;

      const freqBins = new Uint8Array(analyser.frequencyBinCount);
      this.freqBins = freqBins;

      source.connect(analyser);
      source.connect(processor);
      processor.connect(zeroGain);
      zeroGain.connect(audioCtx.destination);

      processor.onaudioprocess = (event) => {
        if (this.isDestroyed) return;
        const input = event.inputBuffer.getChannelData(0);

        let sumSq = 0;
        for (let i = 0; i < input.length; i++) {
          sumSq += input[i] * input[i];
        }
        const rms = Math.sqrt(sumSq / Math.max(1, input.length));
        const level = Math.min(100, Math.round(rms * 420));
        this.callbacks.onAudioLevel?.(level);

        if (this.isPaused) return;

        // Real-time Background Noise Detection (ambient floor + FFT speech-vs-noise ratio)
        this.recentRmsLevels.push(level);
        if (this.recentRmsLevels.length > 26) {
          this.recentRmsLevels.shift();
        }
        let ambientFloor = 0;
        if (this.recentRmsLevels.length >= 16) {
          const sorted = [...this.recentRmsLevels].sort((a, b) => a - b);
          ambientFloor = sorted[Math.floor(sorted.length * 0.2)] || 0;
        }

        let nonSpeechRatio = 0;
        if (this.analyserNode && this.freqBins) {
          this.analyserNode.getByteFrequencyData(this.freqBins);
          const nyquist = audioCtx.sampleRate / 2;
          const binHz = nyquist / this.freqBins.length;
          let lowBand = 0;
          let speechBand = 0;
          let highBand = 0;
          for (let i = 0; i < this.freqBins.length; i++) {
            const hz = i * binHz;
            const val = this.freqBins[i];
            if (hz < 220) lowBand += val;
            else if (hz <= 3400) speechBand += val;
            else highBand += val;
          }
          const totalEnergy = lowBand + speechBand + highBand;
          if (totalEnergy > 0) {
            nonSpeechRatio = (lowBand + highBand) / totalEnergy;
          }
        }

        // Only flag heavy/excessive ("too much") background noise — ignore low/mild ambient room sounds
        const isExcessiveAmbientNoise = this.recentRmsLevels.length >= 20 && ambientFloor >= 26;
        const isHeavyNonSpeechNoise = level >= 34 && nonSpeechRatio >= 0.68;
        const nowNoiseMs = Date.now();

        if (isExcessiveAmbientNoise || isHeavyNonSpeechNoise) {
          this.noiseConfirmStreak += 1;
          this.noiseClearStreak = 0;
          const noiseScore = Math.min(100, Math.max(ambientFloor * 2, Math.round(level * nonSpeechRatio)));
          const reason = isExcessiveAmbientNoise
            ? 'Excessive continuous background noise detected (loud TV, crowd chatter, or heavy traffic).'
            : 'Heavy non-speech background interference detected on your microphone.';

          if (this.noiseConfirmStreak >= 3) {
            if (this.heavyNoiseSinceMs === 0) {
              this.heavyNoiseSinceMs = nowNoiseMs;
            }
            const holdMs = nowNoiseMs - this.heavyNoiseSinceMs;

            if (holdMs >= 500 && !this.backgroundNoiseActive) {
              this.backgroundNoiseActive = true;
              this.callbacks.onBackgroundNoiseChange?.(true, noiseScore, reason);
            }

            if (holdMs > 2000) {
              // >2s continuous excessive noise -> count 1 attempt & reset timer to 0
              this.heavyNoiseSinceMs = 0;
              this.noiseConfirmStreak = 0;
              this.callbacks.onBackgroundNoiseChange?.(true, noiseScore, reason);
              this.callbacks.onExcessiveNoiseHold?.(0, true, noiseScore, reason);
            } else {
              this.callbacks.onExcessiveNoiseHold?.(holdMs, false, noiseScore, reason);
            }
          }
        } else {
          this.noiseClearStreak += 1;
          this.noiseConfirmStreak = Math.max(0, this.noiseConfirmStreak - 1);
          if (this.noiseClearStreak >= 10 && this.heavyNoiseSinceMs !== 0) {
            this.heavyNoiseSinceMs = 0;
            this.callbacks.onExcessiveNoiseHold?.(0, false, 0);
          }
          if (this.noiseClearStreak >= 18 && this.backgroundNoiseActive) {
            this.backgroundNoiseActive = false;
            this.callbacks.onBackgroundNoiseChange?.(false, 0);
          }
        }

        if (level > 10) {
          const now = Date.now();
          this.hasSpokenThisTurn = true;
          if (!this.firstSpokenWithAudioMs) {
            this.firstSpokenWithAudioMs = now;
          }
          this.lastVoiceMs = now;
          this.setSilentPause(false);
        }

        if (this.ws && this.ws.readyState === WebSocket.OPEN && !this.useFallbackBrowserStt) {
          const b64 = downsampleTo16kPcmBase64(input, audioCtx.sampleRate);
          try {
            this.ws.send(JSON.stringify({ type: 'audio', audio: b64 }));
          } catch {
            // ignore transient send error
          }
        }
      };

      this.sourceNode = source;
      this.analyserNode = analyser;
      this.processorNode = processor;
      this.gainNode = zeroGain;
    } catch {
      // Web Audio error
    }
  }

  private connectLiveWebSocket() {
    if (this.isDestroyed || typeof WebSocket === 'undefined') {
      this.activateBrowserSpeechFallback();
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const domainQuery = this.domainHint ? `?domain=${encodeURIComponent(this.domainHint)}` : '';
    const wsUrl = `${protocol}//${window.location.host}/ws/transcribe${domainQuery}`;
    this.updateStatus(this.reconnectAttempts > 0 ? 'reconnecting' : 'connecting', 'Connecting Live STT...');

    try {
      const ws = new WebSocket(wsUrl);
      this.ws = ws;

      const connectTimeout = window.setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          try {
            ws.close();
          } catch {
            // ignore
          }
        }
      }, 3200);

      ws.onmessage = (ev) => {
        if (this.isDestroyed) return;
        try {
          const msg = JSON.parse(ev.data);
          if (msg.type === 'ready') {
            window.clearTimeout(connectTimeout);
            this.reconnectAttempts = 0;
            this.useFallbackBrowserStt = false;
            this.stopBrowserSpeechFallback();
            const label =
              msg.provider === 'deepgram-nova-3' ? 'Deepgram Nova-3 Live' : 'Gemini Live STT';
            this.updateStatus(this.isPaused ? 'paused' : 'live', label);
          } else if (msg.type === 'interim') {
            if (!this.isPaused) {
              const txt = String(msg.text || '').trim();
              if (txt) this.wsTranscriptCount += 1;
              this.interimText = txt;
              this.callbacks.onInterimText?.(this.interimText);
            }
          } else if (msg.type === 'final') {
            if (!this.isPaused) {
              const txt = String(msg.text || '').trim();
              if (txt) this.wsTranscriptCount += 1;
              this.handleFinalTranscriptPiece(txt, Boolean(msg.discrete));
            }
          } else if (msg.type === 'utterance_end') {
            if (!this.isPaused && this.interimText) {
              this.interimText = '';
              this.callbacks.onInterimText?.('');
            }
          } else if (msg.type === 'unavailable') {
            window.clearTimeout(connectTimeout);
            this.activateBrowserSpeechFallback();
          } else if (msg.type === 'error' || msg.type === 'closed') {
            if (!this.isPaused && !this.useFallbackBrowserStt) {
              this.scheduleReconnect();
            }
          }
        } catch {
          // ignore
        }
      };

      ws.onerror = () => {
        window.clearTimeout(connectTimeout);
      };

      ws.onclose = () => {
        window.clearTimeout(connectTimeout);
        if (this.isDestroyed || this.useFallbackBrowserStt) return;
        this.scheduleReconnect();
      };
    } catch {
      this.activateBrowserSpeechFallback();
    }
  }

  private scheduleReconnect() {
    if (this.isDestroyed || this.useFallbackBrowserStt) return;
    if (this.reconnectTimer !== null) return;
    if (this.reconnectAttempts >= 3) {
      this.activateBrowserSpeechFallback();
      return;
    }
    this.reconnectAttempts += 1;
    this.updateStatus('reconnecting', 'Reconnecting STT...');
    const delayMs = 450 * this.reconnectAttempts;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.isDestroyed && !this.useFallbackBrowserStt) {
        this.connectLiveWebSocket();
      }
    }, delayMs);
  }

  private scheduleFallbackRestart(delayMs = 200) {
    if (this.isDestroyed || this.isPaused || !this.useFallbackBrowserStt) return;
    if (this.fallbackRestartTimer !== null) {
      window.clearTimeout(this.fallbackRestartTimer);
    }
    this.fallbackRestartTimer = window.setTimeout(() => {
      this.fallbackRestartTimer = null;
      if (!this.isDestroyed && !this.isPaused && this.useFallbackBrowserStt) {
        this.startBrowserSpeechFallback();
      }
    }, delayMs);
  }

  private activateBrowserSpeechFallback() {
    this.useFallbackBrowserStt = true;
    if (this.ws) {
      try {
        this.ws.onclose = null;
        this.ws.close();
      } catch {
        // ignore
      }
      this.ws = null;
    }

    if (isSpeechRecognitionSupported()) {
      this.updateStatus(this.isPaused ? 'paused' : 'fallback', 'Live Speech + AI Refine');
      if (!this.isPaused) {
        this.startBrowserSpeechFallback();
      }
    } else {
      this.updateStatus(this.isPaused ? 'paused' : 'fallback', 'Audio Capture + AI STT');
    }
  }

  private startBrowserSpeechFallback() {
    if (this.isDestroyed || this.isPaused || !isSpeechRecognitionSupported()) return;
    this.stopBrowserSpeechFallback();

    const recognizer = createSpeechRecognizer(
      (finalPiece) => {
        if (this.isPaused || this.isDestroyed) return;
        this.fallbackLastEventMs = Date.now();
        this.handleFinalTranscriptPiece(finalPiece);
      },
      (errCode) => {
        if (['not-allowed', 'service-not-allowed', 'audio-capture'].includes(errCode)) {
          this.fallbackRecognizerActive = false;
          this.stopBrowserSpeechFallback();
          this.updateStatus('unavailable', 'Text Input Only');
          return;
        }
        // Recoverable silence/abort/network errors (e.g. 'no-speech' after pause): keep listening continuously!
        this.fallbackRecognizerActive = false;
        if (!this.isDestroyed && !this.isPaused && this.useFallbackBrowserStt) {
          this.scheduleFallbackRestart(250);
        }
      },
      (interim) => {
        if (!this.isPaused && !this.isDestroyed) {
          this.fallbackLastEventMs = Date.now();
          this.interimText = interim;
          this.callbacks.onInterimText?.(interim);
        }
      }
    );

    if (!recognizer) return;
    recognizer.onstart = () => {
      this.fallbackRecognizerActive = true;
      this.fallbackLastEventMs = Date.now();
    };
    recognizer.onend = () => {
      this.fallbackRecognizerActive = false;
      if (!this.isDestroyed && !this.isPaused && this.useFallbackBrowserStt) {
        // Preserve any trailing unfinalized speech before browser resets recognition after a silence pause
        if (this.interimText.trim()) {
          const dangling = this.interimText.trim();
          this.interimText = '';
          this.handleFinalTranscriptPiece(dangling);
        }
        this.scheduleFallbackRestart(180);
      }
    };

    this.recognizer = recognizer;
    try {
      recognizer.start();
    } catch {
      this.fallbackRecognizerActive = false;
      this.scheduleFallbackRestart(320);
    }
  }

  private stopBrowserSpeechFallback() {
    this.fallbackRecognizerActive = false;
    if (this.fallbackRestartTimer !== null) {
      window.clearTimeout(this.fallbackRestartTimer);
      this.fallbackRestartTimer = null;
    }
    if (this.recognizer) {
      try {
        this.recognizer.onstart = null;
        this.recognizer.onend = null;
        this.recognizer.onerror = null;
        this.recognizer.stop();
      } catch {
        // ignore
      }
      this.recognizer = null;
    }
  }

  private handleFinalTranscriptPiece(rawPiece: string, isDiscrete = false) {
    const clean = rawPiece.trim();
    if (!clean) return;
    this.interimText = '';
    this.callbacks.onInterimText?.('');
    this.hasSpokenThisTurn = true;
    this.lastVoiceMs = Date.now();
    this.setSilentPause(false);

    const words = clean.split(/\s+/).length;
    if (words <= 14 && REPEAT_PHRASE_REGEX.test(clean)) {
      this.callbacks.onVoiceCommand?.('repeat', clean);
      return;
    }
    if (words <= 16 && CLARIFY_PHRASE_REGEX.test(clean)) {
      this.callbacks.onVoiceCommand?.('clarify', clean);
      return;
    }

    const { merged, delta } = mergeTranscriptSegment(this.finalizedText, clean, isDiscrete);
    if (delta) {
      this.finalizedText = merged;
      this.callbacks.onFinalText?.(this.finalizedText, delta);
    }
  }
}
