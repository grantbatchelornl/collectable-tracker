import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { askCollectorAI, executeAction, getAdaptivePrompts, SUGGESTED_PROMPTS } from '@/lib/collectorAI';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Send, Sparkles, User, Bot, Check, X, AlertTriangle, ChevronRight } from 'lucide-react';

export default function CollectorAIChat({ conversationId, contextHint, onConversationChange }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [adaptivePrompts, setAdaptivePrompts] = useState(SUGGESTED_PROMPTS.slice(0, 6));
  const [pendingAction, setPendingAction] = useState(null);
  const [executing, setExecuting] = useState(false);
  const [actionResult, setActionResult] = useState(null);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
    } else {
      setMessages([]);
    }
  }, [conversationId]);

  useEffect(() => {
    if (user) loadAdaptiveData();
  }, [user]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const loadConversation = async (id) => {
    try {
      const conv = await base44.entities.AIConversation.get(id);
      if (conv.messages_json) {
        setMessages(JSON.parse(conv.messages_json));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadAdaptiveData = async () => {
    try {
      const [items, binders, health] = await Promise.all([
        base44.entities.Collectible.filter({ created_by_id: user.id }, '-created_date', 200),
        base44.entities.CollectionBinder.filter({ created_by_id: user.id }, '-created_date', 10),
        base44.entities.CollectionHealth.filter({ user_id: user.id }, '-created_date', 20),
      ]);
      const validItems = items.filter(c => !c.is_deleted);
      const adaptive = getAdaptivePrompts(validItems, binders, health);
      if (adaptive.length > 0) setAdaptivePrompts(adaptive);
    } catch (err) {
      // fall back to default prompts
    }
  };

  const ask = async (question) => {
    if (!question.trim() || loading) return;
    setError(null);
    const userMsg = { role: 'user', text: question, timestamp: Date.now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const result = await askCollectorAI(question, messages, contextHint);
      const assistantMsg = {
        role: 'assistant',
        text: result.response || 'I could not process that request.',
        actions: result.suggested_actions || [],
        actionsStatus: {},
        timestamp: Date.now(),
      };
      const updatedMessages = [...newMessages, assistantMsg];
      setMessages(updatedMessages);

      if (onConversationChange) {
        onConversationChange(updatedMessages);
      }
    } catch (err) {
      const errorMsg = err?.response?.data?.error || err.message || 'An error occurred';
      if (errorMsg.includes('Rate limit')) {
        setError('You are sending messages too fast. Please wait a moment.');
      } else if (errorMsg.includes('temporarily disabled')) {
        setError('Collector AI is temporarily disabled for maintenance.');
      } else {
        setError('I encountered an error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const dismissAction = (msgIndex, actionIndex) => {
    setMessages(prev => {
      const updated = [...prev];
      if (updated[msgIndex]?.actionsStatus) {
        updated[msgIndex].actionsStatus[actionIndex] = 'dismissed';
      }
      return [...updated];
    });
  };

  const confirmAction = (action) => {
    setPendingAction(action);
    setActionResult(null);
  };

  const executeConfirmedAction = async () => {
    if (!pendingAction) return;
    setExecuting(true);
    try {
      const result = await executeAction(pendingAction, user, navigate, {
        conversationId: conversationId,
      });
      setActionResult(result);
      if (result.success && result.navigate) {
        // Don't auto-navigate; show a link the user can click
      } else if (result.success && result.route) {
        // Route is available for the user to click
      }
    } catch (err) {
      setActionResult({ success: false, message: err.message || 'Failed to execute action' });
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-3 overflow-y-auto pb-4">
        {messages.length === 0 && !loading && (
          <div className="rounded-2xl bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-sm">Ask about your collection</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              I can analyze your collection, find duplicates, suggest grading candidates, help finish binders, find trades, and more — using only your verified data.
            </p>
            {contextHint && (
              <div className="mb-3 rounded-lg bg-accent/50 p-2.5">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Context:</span> {contextHint}
                </p>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {adaptivePrompts.map((p) => (
                <button
                  key={p.label}
                  onClick={() => ask(p.question)}
                  className="text-xs bg-accent text-accent-foreground rounded-full px-3 py-1.5 font-medium hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-1"
                >
                  {p.label}
                  <ChevronRight className="w-3 h-3" />
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i}>
            <div className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
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

            {msg.actions && msg.actions.length > 0 && (
              <div className="ml-10 mt-2 space-y-2">
                {msg.actions.map((action, ai) => {
                  if (msg.actionsStatus?.[ai] === 'dismissed' || msg.actionsStatus?.[ai] === 'executed') return null;
                  return (
                    <div key={ai} className="rounded-xl bg-accent/50 border border-border p-3">
                      <div className="flex items-start gap-2">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{action.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => confirmAction(action)}
                              className="text-xs bg-primary text-primary-foreground rounded-full px-3 py-1 font-medium hover:bg-primary/90"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => dismissAction(i, ai)}
                              className="text-xs bg-muted text-muted-foreground rounded-full px-3 py-1 hover:bg-muted/80"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-2.5">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="rounded-2xl bg-card border border-border p-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Analyzing your collection...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="flex gap-2.5">
            <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4 text-destructive" />
            </div>
            <div className="rounded-2xl bg-card border border-destructive/20 p-3">
              <p className="text-sm text-destructive">{error}</p>
              <button onClick={() => ask(messages[messages.length - 2]?.text || '')} className="text-xs text-primary font-medium mt-1">
                Retry
              </button>
            </div>
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      <div className="flex gap-2 sticky bottom-0 bg-background pt-2">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), ask(input))}
          placeholder="Ask about your collection..."
          className="flex-1 h-11 rounded-xl border border-input bg-card px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          disabled={loading}
        />
        <button
          onClick={() => ask(input)}
          disabled={loading || !input.trim()}
          className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 flex-shrink-0"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </div>

      <Dialog open={!!pendingAction} onOpenChange={(open) => { if (!open && !executing) { setPendingAction(null); setActionResult(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{pendingAction?.title}</DialogTitle>
            <DialogDescription>{pendingAction?.description}</DialogDescription>
          </DialogHeader>
          <div className="text-sm text-muted-foreground bg-accent/50 rounded-lg p-3 space-y-2">
            {actionResult ? (
              <>
                <div className="flex items-center gap-2">
                  {actionResult.success ? (
                    <Check className="w-4 h-4 text-gain flex-shrink-0" />
                  ) : (
                    <X className="w-4 h-4 text-destructive flex-shrink-0" />
                  )}
                  <span>{actionResult.message}</span>
                </div>
                {actionResult.success && actionResult.route && (
                  <button
                    onClick={() => {
                      setPendingAction(null);
                      setActionResult(null);
                      navigate(actionResult.route);
                    }}
                    className="text-xs text-primary font-medium flex items-center gap-1 hover:underline"
                  >
                    View result <ChevronRight className="w-3 h-3" />
                  </button>
                )}
                {actionResult.success && actionResult.navigate && (
                  <button
                    onClick={() => {
                      setPendingAction(null);
                      setActionResult(null);
                      actionResult.navigate();
                    }}
                    className="text-xs text-primary font-medium flex items-center gap-1 hover:underline"
                  >
                    View result <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </>
            ) : (
              <p>This action will modify your data. Please confirm to proceed. You can review the details above before executing.</p>
            )}
          </div>
          <DialogFooter>
            {actionResult ? (
              <Button onClick={() => { setPendingAction(null); setActionResult(null); }}>Done</Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setPendingAction(null)} disabled={executing}>Cancel</Button>
                <Button onClick={executeConfirmedAction} disabled={executing}>
                  {executing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Execute
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}