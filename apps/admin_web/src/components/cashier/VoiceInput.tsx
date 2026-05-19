import React from 'react';
import { VoiceState } from '../../hooks/useVoiceCommand';

interface VoiceInputProps {
  state: VoiceState;
  transcript: string;
  onCancel: () => void;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ state, transcript, onCancel }) => {
  if (state === 'idle') return null;

  return (
    <div className="fixed inset-x-4 bottom-28 z-50 flex flex-col items-center justify-end animate-in fade-in slide-in-from-bottom-4 duration-150">
      <div className="bg-zinc-900 text-white p-6 rounded-none shadow-2xl w-full max-w-md border-t-4 border-emerald-500">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="relative flex h-4 w-4">
              {state === 'listening' && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
            </span>
            <span className="font-mono text-sm tracking-wider uppercase text-zinc-300">
              {state === 'listening' ? 'Listening...' : state === 'processing' ? 'Processing...' : 'Error'}
            </span>
          </div>
          <button 
            onClick={onCancel}
            aria-label="Cancel Voice input"
            className="min-h-[48px] min-w-[48px] flex items-center justify-center bg-zinc-800 text-zinc-300 active:bg-zinc-700 font-bold"
          >
            ✕
          </button>
        </div>
        <p className="text-xl font-medium leading-relaxed min-h-[60px]">
          {transcript || "Waiting for command..."}
        </p>
      </div>
    </div>
  );
};
