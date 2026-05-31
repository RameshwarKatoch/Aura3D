import { useState, useCallback } from 'react';
import { Mic, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceControlProps {
  onCommand: (command: string) => void;
}

export default function VoiceControl({ onCommand }: VoiceControlProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('Listening...');
    };

    recognition.onresult = (event: any) => {
      const command = event.results[0][0].transcript.toLowerCase();
      setTranscript(command);
      onCommand(command);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      setTranscript('Error');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }, [onCommand]);

  return (
    <div className="flex items-center gap-3">
      <AnimatePresence>
        {transcript && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-panel border border-border px-3 py-1.5 rounded-lg text-xs font-mono text-primary shadow-sm"
          >
            "{transcript}"
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={startListening}
        className={`p-2.5 rounded-full transition-all border ${isListening ? 'bg-red-500 border-red-500 text-white animate-pulse' : 'bg-panel border-border text-text-muted hover:text-text-main hover:border-gray-300 shadow-sm'}`}
        title="Voice Commands (Try: 'Log Water' or 'Switch to Power Mode')"
      >
        {isListening ? <Loader2 className="animate-spin" size={18} /> : <Mic size={18} />}
      </button>
    </div>
  );
}
