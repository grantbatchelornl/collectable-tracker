import { useState, useRef, useEffect } from 'react';
import { askCollectorAI } from '@/lib/collectorAI';
import { Loader2, Send, Sparkles, User, Bot } from 'lucide-react';

const PRESET_QUESTIONS = [
  "What's my most valuable item?",
  'What are my best grading candidates?',
  'What set pieces am I missing?',
  'Give me collection statistics',
  'What are my best trade candidates?',
];

export default function CollectorAIChat({ collectibles, pricingHistory }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const ask = async (question) => {
    if (!question.trim() || loading) return;
    setMessages((prev) => [...prev, { role: 'user', text: question }]);
    setInput('');
    setLoading(true);
    try {
      const answer = await askCollectorAI(question, collectibles, pricingHistory);
      setMessages((prev) => [...prev, { role: 'assistant', text: typeof answer === 'string' ? answer : JSON.stringify(answer) }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', text: 'Sorry, I could not process that question. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {messages.length === 0 && (
        <div className="rounded-2xl bg-card border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-sm">Ask about your collection</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            I can answer questions about your collectibles, values, portfolio stats, and more — using only your data.
          </p>
          <div className="flex flex-wrap gap-2">
            {PRESET_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => ask(q)}
                className="text-xs bg-accent text-accent-foreground rounded-full px-3 py-1.5 font-medium hover:bg-primary/10 hover:text-primary transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === 'user' ? 'bg-primary' : 'bg-accent'
            }`}>
              {msg.role === 'user' ? (
                <User className="w-4 h-4 text-primary-foreground" />
              ) : (
                <Bot className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            <div className={`rounded-2xl p-3 max-w-[85%] ${
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border'
            }`}>
              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2.5">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="rounded-2xl bg-card border border-border p-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="flex gap-2 sticky bottom-20">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && ask(input)}
          placeholder="Ask about your collection..."
          className="flex-1 h-11 rounded-xl border border-input bg-card px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          disabled={loading}
        />
        <button
          onClick={() => ask(input)}
          disabled={loading || !input.trim()}
          className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}