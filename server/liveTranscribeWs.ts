import type { IncomingMessage, Server as HttpServer } from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

const BASE_INTERVIEW_KEYTERMS = [
  'LIFO',
  'FIFO',
  'Big-O',
  'mutex',
  'asyncio',
  'memoization',
  'recursion',
  'Dijkstra',
  'PostgreSQL',
  'TypeScript',
  'JavaScript',
  'Python',
  'Kubernetes',
  'React',
  'Redis',
  'Docker'
];

export function getDeepgramApiKey(): string {
  const raw = process.env.DEEPGRAM_API_KEY?.trim() || '';
  if (!raw || raw === 'MY_DEEPGRAM_API_KEY') return '';
  return raw;
}

export function buildTechnicalKeyterms(domain?: string, extraText?: string): string[] {
  const terms = new Set<string>(BASE_INTERVIEW_KEYTERMS);
  const rawSources = [domain || '', extraText || ''].join(' ');
  const tokens = rawSources.split(/[^A-Za-z0-9_+.#-]+/);
  for (const token of tokens) {
    const clean = token.trim();
    if (clean.length >= 3 && clean.length <= 28 && /[A-Za-z]/.test(clean)) {
      terms.add(clean);
    }
    if (terms.size >= 26) break;
  }
  return Array.from(terms).slice(0, 26);
}

export function attachLiveTranscribeWebSocket(server: HttpServer, aiClient: GoogleGenAI | null) {
  const wss = new WebSocketServer({ server, path: '/ws/transcribe' });

  wss.on('connection', async (clientWs: WebSocket, req: IncomingMessage) => {
    const deepgramKey = getDeepgramApiKey();

    let domainParam = '';
    try {
      const parsedUrl = new URL(req.url || '/ws/transcribe', 'http://localhost');
      domainParam = parsedUrl.searchParams.get('domain') || '';
    } catch {
      domainParam = '';
    }

    const safeSend = (payload: Record<string, unknown>) => {
      if (clientWs.readyState === WebSocket.OPEN) {
        try {
          clientWs.send(JSON.stringify(payload));
        } catch {
          // ignore
        }
      }
    };

    if (!deepgramKey && !aiClient) {
      safeSend({
        type: 'unavailable',
        reason: 'Live transcription requires DEEPGRAM_API_KEY or GEMINI_API_KEY on the server.'
      });
      clientWs.close();
      return;
    }

    let isClosing = false;
    let dgWs: WebSocket | null = null;
    let dgOpened = false;
    let dgKeepAliveTimer: ReturnType<typeof setInterval> | null = null;
    let lastAudioSentAt = Date.now();
    let liveSession: Awaited<ReturnType<GoogleGenAI['live']['connect']>> | null = null;
    const pendingAudioFrames: string[] = [];

    const stopDgKeepAlive = () => {
      if (dgKeepAliveTimer !== null) {
        clearInterval(dgKeepAliveTimer);
        dgKeepAliveTimer = null;
      }
    };

    const connectGeminiLive = async () => {
      if (!aiClient || isClosing) {
        safeSend({
          type: 'unavailable',
          reason: 'No available real-time STT backend configured.'
        });
        clientWs.close();
        return;
      }

      let geminiOpened = false;
      try {
        liveSession = await aiClient.live.connect({
          model: 'gemini-3.5-transcribe-live',
          config: {
            responseModalities: [Modality.TEXT],
            inputAudioTranscription: {}
          },
          callbacks: {
            onopen: () => {
              geminiOpened = true;
              safeSend({ type: 'ready', provider: 'gemini-3.5-transcribe-live' });
              while (pendingAudioFrames.length > 0 && liveSession && !isClosing) {
                const frame = pendingAudioFrames.shift();
                if (frame) {
                  try {
                    liveSession.sendRealtimeInput({
                      audio: { data: frame, mimeType: 'audio/pcm;rate=16000' }
                    });
                  } catch {
                    // ignore
                  }
                }
              }
            },
            onmessage: (message: LiveServerMessage) => {
              const content = message.serverContent;
              if (content?.interimInputTranscription?.text) {
                safeSend({
                  type: 'interim',
                  text: content.interimInputTranscription.text
                });
              }
              if (content?.inputTranscription?.text) {
                safeSend({
                  type: 'final',
                  text: content.inputTranscription.text,
                  discrete: false
                });
              }
            },
            onerror: (err: unknown) => {
              if (!isClosing && geminiOpened) {
                safeSend({
                  type: 'error',
                  message: err instanceof Error ? err.message : 'Live transcription stream error'
                });
              }
            },
            onclose: () => {
              if (!isClosing && geminiOpened) {
                safeSend({ type: 'closed' });
              }
            }
          }
        });
      } catch (err) {
        safeSend({
          type: 'unavailable',
          reason: err instanceof Error ? err.message : 'Live API connection failed'
        });
        clientWs.close();
      }
    };

    const connectDeepgramLive = () => {
      const params = new URLSearchParams({
        model: 'nova-3',
        language: 'en',
        encoding: 'linear16',
        sample_rate: '16000',
        channels: '1',
        smart_format: 'true',
        punctuate: 'true',
        interim_results: 'true',
        endpointing: '350',
        utterance_end_ms: '1100',
        vad_events: 'true'
      });

      const keyterms = buildTechnicalKeyterms(domainParam);
      for (const term of keyterms) {
        params.append('keyterm', term);
      }

      const dgUrl = `wss://api.deepgram.com/v1/listen?${params.toString()}`;
      const upstream = new WebSocket(dgUrl, {
        headers: {
          Authorization: `Token ${deepgramKey}`
        }
      });
      dgWs = upstream;

      upstream.on('open', () => {
        if (isClosing) {
          try {
            upstream.close();
          } catch {
            // ignore
          }
          return;
        }
        dgOpened = true;
        lastAudioSentAt = Date.now();
        safeSend({ type: 'ready', provider: 'deepgram-nova-3' });

        while (pendingAudioFrames.length > 0 && upstream.readyState === WebSocket.OPEN) {
          const frame = pendingAudioFrames.shift();
          if (frame) {
            try {
              upstream.send(Buffer.from(frame, 'base64'));
              lastAudioSentAt = Date.now();
            } catch {
              // ignore
            }
          }
        }

        stopDgKeepAlive();
        dgKeepAliveTimer = setInterval(() => {
          if (isClosing || upstream.readyState !== WebSocket.OPEN) return;
          if (Date.now() - lastAudioSentAt >= 2800) {
            try {
              upstream.send(JSON.stringify({ type: 'KeepAlive' }));
            } catch {
              // ignore
            }
          }
        }, 3500);
      });

      upstream.on('message', (raw) => {
        if (isClosing) return;
        try {
          const data = JSON.parse(raw.toString());
          if (data?.type === 'Results') {
            const transcript = String(data?.channel?.alternatives?.[0]?.transcript || '').trim();
            if (data?.is_final) {
              if (transcript) {
                safeSend({
                  type: 'final',
                  text: transcript,
                  discrete: true
                });
              }
            } else if (transcript) {
              safeSend({
                type: 'interim',
                text: transcript
              });
            }
          } else if (data?.type === 'UtteranceEnd') {
            safeSend({ type: 'utterance_end' });
          }
        } catch {
          // ignore malformed Deepgram message
        }
      });

      const handleUpstreamFailure = (reason: string) => {
        stopDgKeepAlive();
        if (isClosing) return;
        if (!dgOpened) {
          dgWs = null;
          if (aiClient) {
            console.warn(`Deepgram Live WS failed before open (${reason}); falling back to Gemini Live STT.`);
            void connectGeminiLive();
          } else {
            safeSend({ type: 'unavailable', reason });
            clientWs.close();
          }
        } else {
          safeSend({ type: 'closed' });
        }
      };

      upstream.on('error', (err) => {
        handleUpstreamFailure(err instanceof Error ? err.message : 'Deepgram WebSocket error');
      });

      upstream.on('close', (code) => {
        handleUpstreamFailure(`Deepgram WebSocket closed (${code})`);
      });
    };

    if (deepgramKey) {
      connectDeepgramLive();
    } else {
      await connectGeminiLive();
    }

    clientWs.on('message', (rawData) => {
      if (isClosing) return;
      try {
        const msg = JSON.parse(rawData.toString());
        if (msg?.type === 'audio' && typeof msg.audio === 'string' && msg.audio.length > 0) {
          if (dgWs && dgWs.readyState === WebSocket.OPEN) {
            dgWs.send(Buffer.from(msg.audio, 'base64'));
            lastAudioSentAt = Date.now();
          } else if (liveSession) {
            liveSession.sendRealtimeInput({
              audio: { data: msg.audio, mimeType: 'audio/pcm;rate=16000' }
            });
          } else {
            if (pendingAudioFrames.length >= 30) {
              pendingAudioFrames.shift();
            }
            pendingAudioFrames.push(msg.audio);
          }
        } else if (msg?.type === 'ping') {
          safeSend({ type: 'pong' });
        }
      } catch {
        // ignore malformed frames
      }
    });

    const cleanup = () => {
      if (isClosing) return;
      isClosing = true;
      stopDgKeepAlive();
      pendingAudioFrames.length = 0;

      if (dgWs) {
        try {
          if (dgWs.readyState === WebSocket.OPEN) {
            dgWs.send(JSON.stringify({ type: 'CloseStream' }));
          }
          dgWs.close();
        } catch {
          // ignore
        }
        dgWs = null;
      }

      if (liveSession) {
        try {
          liveSession.close();
        } catch {
          // ignore
        }
        liveSession = null;
      }
    };

    clientWs.on('close', cleanup);
    clientWs.on('error', cleanup);
  });

  return wss;
}
