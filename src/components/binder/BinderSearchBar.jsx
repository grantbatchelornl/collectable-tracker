import { useState, useRef, useEffect } from 'react';
import { Search, Mic, X } from 'lucide-react';

export default function BinderSearchBar({ value, onChange, placeholder = 'Search sets, characters, teams...' }) {
  const [listening, setListening] = useState(false);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (e) => {
      onChange(e.results[0][0].transcript);
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setListening(true);
  };

  const stopVoice = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  useEffect(() => () => recognitionRef.current?.stop(), []);

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-2xl bg-card border border-border px-3 h-12 shadow-soft">
        <Search className={`w-4 h-4 flex-shrink-0 transition-colors ${listening ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {value ? (
          <button onClick={() => onChange('')} className="flex-shrink-0 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        ) : null}
        <button
          onClick={listening ? stopVoice : startVoice}
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            listening ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          }`}
          aria-label="Voice search"
        >
          <Mic className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}