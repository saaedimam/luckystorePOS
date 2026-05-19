import React, { useEffect, useRef } from 'react';
import { Command } from 'cmdk';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, CornerDownLeft } from 'lucide-react';

export interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  shortcut?: string[];
  onSelect: () => void;
  icon?: React.ReactNode;
  keywords?: string[];
}

export interface CommandGroup {
  heading: string;
  items: CommandItem[];
}

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  groups: CommandGroup[];
  placeholder?: string;
  triggerGlobally?: boolean;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  groups,
  placeholder = 'Type a command or search...',
  triggerGlobally = true,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Global keydown listener to trigger open/close
  useEffect(() => {
    if (!triggerGlobally) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onClose();
      }

      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerGlobally, isOpen, onClose]);

  // Autofocus the input field when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Floating Command Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl flex flex-col overflow-hidden max-h-[420px] z-[101] font-sans text-zinc-100"
          >
            <Command className="flex flex-col h-full">
              {/* Input field wrapper */}
              <div className="relative border-b border-zinc-800 p-4 flex items-center gap-3">
                <Search size={18} className="text-zinc-500 shrink-0" />
                <Command.Input
                  ref={inputRef}
                  placeholder={placeholder}
                  className="w-full bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none font-medium border-none p-0 focus:ring-0 focus:border-none"
                />
              </div>

              {/* List of actions */}
              <Command.List className="flex-1 overflow-y-auto p-2 space-y-1.5 max-h-[300px] scrollbar-thin scrollbar-thumb-zinc-800">
                <Command.Empty className="py-6 text-center text-sm text-zinc-500 font-sans">
                  No actions found for that query.
                </Command.Empty>

                {groups.map((group) => (
                  <Command.Group
                    key={group.heading}
                    heading={group.heading}
                    className="select-none"
                  >
                    {/* Header Group */}
                    <div className="px-3 py-1.5 text-[10px] font-mono tracking-wider text-zinc-500 uppercase select-none">
                      {group.heading}
                    </div>

                    {/* Items */}
                    <div className="space-y-0.5">
                      {group.items.map((item) => (
                        <Command.Item
                          key={item.id}
                          value={`${item.title} ${item.subtitle || ''} ${item.keywords?.join(' ') || ''}`}
                          onSelect={item.onSelect}
                          className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-zinc-100 aria-selected:text-zinc-100 aria-selected:bg-zinc-900/80 transition-all duration-150 cursor-pointer select-none outline-none"
                        >
                          <div className="flex items-center gap-3">
                            {item.icon && (
                              <span className="text-zinc-500 shrink-0 select-none">
                                {item.icon}
                              </span>
                            )}
                            <div className="flex flex-col">
                              <span className="text-zinc-200">{item.title}</span>
                              {item.subtitle && (
                                <span className="text-[11px] text-zinc-500 font-normal">
                                  {item.subtitle}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 select-none">
                            {item.shortcut && item.shortcut.length > 0 ? (
                              <div className="flex items-center gap-1">
                                {item.shortcut.map((key, index) => (
                                  <kbd
                                    key={index}
                                    className="px-1.5 py-0.5 text-[10px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-400 rounded uppercase"
                                  >
                                    {key}
                                  </kbd>
                                ))}
                              </div>
                            ) : (
                              <CornerDownLeft
                                size={12}
                                className="opacity-0 aria-selected:opacity-100 text-zinc-500 transition-opacity"
                              />
                            )}
                          </div>
                        </Command.Item>
                      ))}
                    </div>
                  </Command.Group>
                ))}
              </Command.List>

              {/* Vercel-style Console Footer */}
              <div className="border-t border-zinc-800 p-3 bg-zinc-950/60 text-[10px] text-zinc-500 flex justify-between items-center px-4 font-mono select-none">
                <div className="flex items-center gap-2">
                  <span>Press</span>
                  <kbd className="font-mono bg-zinc-900 px-1.5 py-0.5 border border-zinc-800 rounded shadow-sm text-zinc-400">
                    ESC
                  </kbd>
                  <span>to close</span>
                </div>
                <span>Vercel-Inspired Console UI</span>
              </div>
            </Command>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
