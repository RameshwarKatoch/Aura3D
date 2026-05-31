import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Zap, X, Send, Volume2, VolumeX, Bot, User,
  ChevronRight, Mic, RotateCcw,
} from 'lucide-react';
import type { UserProfile, WorkoutSet, SleepEntry, CoachMessage } from '../../types';
import { runCoachEngine } from '../../lib/coachEngine';

// Minimal markdown renderer (bold, italic, tables, lists, headers)
function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h4 class="text-text-main font-bold text-sm mt-3 mb-1">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 class="text-text-main font-semibold text-base mt-3 mb-1">$1</h3>')
    .replace(/^# (.+)$/gm, '<h2 class="text-text-main font-bold text-lg mt-2 mb-1">$1</h2>')
    .replace(/^\| (.+) \|$/gm, (_: string, row: string) => {
      const cells = row.split(' | ');
      return `<div class="grid gap-1 my-0.5" style="grid-template-columns:repeat(${cells.length},1fr)">${cells.map(c => `<span class="text-xs text-text-main bg-surface rounded px-2 py-1">${c.trim()}</span>`).join('')}</div>`;
    })
    .replace(/^\|[-|: ]+\|$/gm, '')
    .replace(/^- (.+)$/gm, '<div class="flex gap-1.5 my-0.5"><span class="text-primary mt-0.5 flex-shrink-0">•</span><span class="text-text-main text-sm">$1</span></div>')
    .replace(/^\d+\. (.+)$/gm, '<div class="flex gap-1.5 my-0.5 ml-1"><span class="text-primary flex-shrink-0 text-xs mt-0.5">›</span><span class="text-text-main text-sm">$1</span></div>')
    .replace(/\n\n/g, '<div class="h-2"></div>')
    .replace(/\n/g, '<br/>');
}

// Voice synthesis
function speakText(text: string) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const clean = text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/#{1,6} (.+)/g, '$1')
    .replace(/\|.+\|/g, '')
    .replace(/^[-•›] /gm, '')
    .replace(/\n+/g, '. ');

  const utt = new SpeechSynthesisUtterance(clean.slice(0, 800));
  utt.rate = 0.95;
  utt.pitch = 0.9;
  // Prefer a professional voice
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v =>
    /google uk english male|daniel|alex|microsoft david/i.test(v.name)
  ) ?? voices.find(v => v.lang.startsWith('en')) ?? voices[0];
  if (preferred) utt.voice = preferred;
  (window as any)._currentUtterance = utt;
  window.speechSynthesis.speak(utt);
}

function stopSpeaking() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  (window as any)._currentUtterance = null;
}

interface Props {
  profile: UserProfile;
  workoutSets: WorkoutSet[];
  sleepData: SleepEntry[];
}

const STORAGE_KEY = 'aura3d_coach_history';

export default function BioCoach({ profile, workoutSets, sleepData }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [input, setInput] = useState('');
  const [voiceMode, setVoiceMode] = useState(false);
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load history from localStorage
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try { setMessages(JSON.parse(raw)); } catch { /* ignore */ }
    }
  }, []);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  // Focus input on open
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const saveMessages = useCallback((msgs: CoachMessage[]) => {
    setMessages(msgs);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs.slice(-40)));
  }, []);

  const sendGreeting = useCallback(() => {
    if (messages.length > 0) return;
    setTyping(true);
    setTimeout(() => {
      const response = runCoachEngine({ profile, workoutSets, sleepData, message: 'hello' });
      const coachMsg: CoachMessage = {
        id: Date.now().toString(),
        role: 'coach',
        text: response.text,
        timestamp: Date.now(),
      };
      saveMessages([coachMsg]);
      setTyping(false);
      if (voiceMode) speakText(response.text);
    }, 600);
  }, [messages.length, profile, workoutSets, sleepData, voiceMode, saveMessages]);

  // Send greeting when first opened
  useEffect(() => {
    if (open) sendGreeting();
  }, [open]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    stopSpeaking();

    const userMsg: CoachMessage = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: Date.now(),
    };

    const newMsgs = [...messages, userMsg];
    saveMessages(newMsgs);
    setInput('');
    setTyping(true);

    // Simulate thinking time 400–900ms
    const delay = 400 + Math.random() * 500;
    setTimeout(() => {
      const response = runCoachEngine({ profile, workoutSets, sleepData, message: text });
      const coachMsg: CoachMessage = {
        id: (Date.now() + 1).toString(),
        role: 'coach',
        text: response.text,
        timestamp: Date.now(),
      };
      const updated = [...newMsgs, coachMsg];
      saveMessages(updated);
      setTyping(false);
      if (voiceMode) speakText(response.text);
    }, delay);
  }, [input, messages, profile, workoutSets, sleepData, voiceMode, saveMessages]);

  const handleClear = () => {
    stopSpeaking();
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const toggleVoice = () => {
    if (voiceMode) stopSpeaking();
    setVoiceMode(v => !v);
  };

  const quickPrompts = [
    "I'm feeling tired today",
    'What should I eat for protein?',
    "What's my recovery status?",
    'Give me a meal plan',
  ];

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`fixed right-6 bottom-32 z-50 w-12 h-12 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
          open ? 'bg-panel border border-border text-text-main rotate-90' : 'bg-primary text-white'
        }`}
        title="AI Bio-Coach"
      >
        {open ? <X size={20} /> : <Bot size={20} />}
      </button>

      {/* Sidebar panel */}
      <div
        className={`fixed top-0 right-0 h-full z-[60] flex flex-col bg-panel border-l border-border shadow-xl transition-all duration-300 ease-in-out ${
          open ? 'w-[380px] opacity-100 translate-x-0' : 'w-[380px] opacity-0 translate-x-full pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center animate-fade-in">
              <Zap size={16} className="text-white" fill="white" />
            </div>
            <div>
              <p className="text-text-main font-bold text-sm leading-tight">Aura Bio-Coach</p>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                <p className="text-text-muted text-xs">AI-powered · Knows your metrics</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleVoice}
              title={voiceMode ? 'Voice Mode ON — click to disable' : 'Enable Voice Mode'}
              className={`p-2 rounded-lg transition-colors ${
                voiceMode ? 'bg-primary/20 text-primary' : 'text-text-muted hover:text-text-main hover:bg-surface'
              }`}
            >
              {voiceMode ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <button
              onClick={handleClear}
              title="Clear chat history"
              className="p-2 rounded-lg text-text-muted hover:text-text-main hover:bg-surface transition-colors"
            >
              <RotateCcw size={15} />
            </button>
            <button
              onClick={() => setOpen(false)}
              className="p-2 rounded-lg text-text-muted hover:text-text-main hover:bg-surface transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Voice Mode Banner */}
        {voiceMode && (
          <div className="flex items-center gap-2 px-5 py-2 bg-primary/10 border-b border-primary/20 flex-shrink-0">
            <Mic size={13} className="text-primary animate-pulse" />
            <p className="text-primary text-xs font-medium">Voice Mode active — coach responses are read aloud</p>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && !typing && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot size={28} className="text-primary" />
              </div>
              <div>
                <p className="text-text-main font-semibold mb-1">Your AI Bio-Coach</p>
                <p className="text-text-muted text-sm">Ask me anything about your training, nutrition, sleep, or recovery.</p>
              </div>
              <div className="grid grid-cols-1 gap-2 w-full mt-2">
                {quickPrompts.map(p => (
                  <button
                    key={p}
                    onClick={() => { setInput(p); setTimeout(() => inputRef.current?.focus(), 50); }}
                    className="text-left text-sm text-text-muted bg-surface border border-border rounded-xl px-3 py-2.5 hover:border-primary/40 hover:text-text-main transition-all flex items-center gap-2"
                  >
                    <ChevronRight size={14} className="text-primary flex-shrink-0" />
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${
                msg.role === 'coach' ? 'bg-primary/20' : 'bg-surface border border-border'
              }`}>
                {msg.role === 'coach'
                  ? <Zap size={13} className="text-primary" />
                  : <User size={13} className="text-text-muted" />}
              </div>
              <div
                className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary text-white rounded-tr-sm shadow-sm'
                    : 'bg-surface border border-border text-text-main rounded-tl-sm'
                }`}
              >
                {msg.role === 'coach' ? (
                  <div
                    className="coach-message"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }}
                  />
                ) : (
                  <p>{msg.text}</p>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {typing && (
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center">
                <Zap size={13} className="text-primary" />
              </div>
              <div className="bg-surface border border-border rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1 items-center h-5">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick prompts row */}
        {messages.length > 0 && (
          <div className="px-4 py-2 flex gap-2 overflow-x-auto flex-shrink-0 border-t border-border bg-surface">
            {quickPrompts.map(p => (
              <button
                key={p}
                onClick={() => setInput(p)}
                className="text-[10px] text-text-muted bg-panel border border-border rounded-full px-3 py-1.5 hover:border-primary/40 hover:text-text-main transition-all whitespace-nowrap flex-shrink-0"
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Input bar */}
        <div className="px-4 py-4 border-t border-border flex-shrink-0">
          <div className="flex gap-2 items-end">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Ask your Bio-Coach..."
              disabled={typing}
              className="flex-1 bg-surface border border-border rounded-xl px-4 py-3 text-text-main text-sm placeholder-text-muted focus:outline-none focus:border-primary/50 transition-colors disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || typing}
              className="p-3 bg-primary rounded-xl text-white disabled:opacity-40 hover:bg-primary/90 transition-all flex-shrink-0"
            >
              <Send size={16} />
            </button>
          </div>
          <p className="text-text-muted text-[10px] text-center mt-2">
            Powered by Aura Intelligence · Reads your live metrics
          </p>
        </div>
      </div>

      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-[59] lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
