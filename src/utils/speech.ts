// Browser Speech Recognition & Synthesis Wrapper

export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
}

export function createSpeechRecognizer(
  onFinalTranscript: (text: string) => void,
  onError?: (errCode: string) => void,
  onInterimTranscript?: (text: string) => void
) {
  if (!isSpeechRecognitionSupported()) return null;

  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
  recognition.lang = 'en-US';

  recognition.onresult = (event: any) => {
    let finalTranscript = '';
    let interimTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const piece = event.results[i][0]?.transcript || '';
      if (event.results[i].isFinal) {
        finalTranscript += piece + ' ';
      } else {
        interimTranscript += piece + ' ';
      }
    }
    if (onInterimTranscript) {
      onInterimTranscript(interimTranscript.trim());
    }
    if (finalTranscript.trim()) {
      onFinalTranscript(finalTranscript.trim());
    }
  };

  recognition.onerror = (event: any) => {
    if (onError) onError(event?.error || 'unknown');
  };

  return recognition;
}

export function speakQuestion(text: string, onEnd?: () => void): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  // Prefer natural English voice if available
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(
    v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha'))
  );
  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  if (onEnd) {
    utterance.onend = () => onEnd();
    utterance.onerror = () => onEnd();
  }

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
