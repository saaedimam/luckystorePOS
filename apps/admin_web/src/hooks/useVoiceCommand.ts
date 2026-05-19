import { useState, useCallback, useEffect, useRef } from 'react';

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface ISpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition;
    webkitSpeechRecognition: new () => ISpeechRecognition;
  }
}

export type VoiceState = 'idle' | 'listening' | 'processing' | 'error';

export function useVoiceCommand() {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState<string>('');
  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionClass) {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US'; // Supports standard English command structure

      recognition.onstart = () => {
        setVoiceState('listening');
      };
      
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const current = event.resultIndex;
        const result = event.results[current][0].transcript;
        setTranscript(result);
      };

      recognition.onerror = () => {
        setVoiceState('error');
        setTimeout(() => setVoiceState('idle'), 3000);
      };

      recognition.onend = () => {
        setVoiceState('processing');
        setTimeout(() => setVoiceState('idle'), 1200);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const startListening = useCallback(() => {
    setTranscript('');
    try {
      recognitionRef.current?.start();
    } catch {
      // Speech recognition already active
    }
  }, []);

  const stopListening = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // Already stopped
    }
    setVoiceState('idle');
  }, []);

  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.15;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  return {
    voiceState,
    transcript,
    startListening,
    stopListening,
    speak,
  };
}
