import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import CollectorAIChat from '@/components/CollectorAIChat';
import AISettings from '@/components/AISettings';
import { ArrowLeft, Sparkles, MessageSquarePlus, History, Settings as SettingsIcon, Trash2, X, Loader2, Search } from 'lucide-react';

export default function CollectorAI() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [profile, setProfile] = useState(null);

  const urlParams = new URLSearchParams(window.location.search);
  const contextHint = urlParams.get('context') || '';

  useEffect(() => {
    if (user) {
      loadConversations();
      loadProfile();
    }
  }, [user]);

  const loadConversations = async () => {
    setLoadingConvs(true);
    try {
      const convs = await base44.entities.AIConversation.filter({ user_id: user.id }, '-updated_date', 50);
      setConversations(convs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingConvs(false);
    }
  };

  const loadProfile = async () => {
    try {
      const profiles = await base44.entities.CollectorProfile.filter({ user_id: user.id });
      setProfile(profiles[0]);
    } catch (err) {
      console.error(err);
    }
  };

  const startNewConversation = () => {
    setCurrentConversationId(null);
    setShowHistory(false);
  };

  const selectConversation = (id) => {
    setCurrentConversationId(id);
    setShowHistory(false);
  };

  const deleteConversation = async (id) => {
    if (!confirm('Delete this conversation?')) return;
    try {
      await base44.entities.AIConversation.delete(id);
      if (currentConversationId === id) setCurrentConversationId(null);
      loadConversations();
    } catch (err) {
      console.error(err);
    }
  };

  const handleConversationChange = async (messages) => {
    if (messages.length < 2) return;
    if (profile?.ai_save_history === false) return;

    const title = messages[0]?.text?.substring(0, 50) || 'New Conversation';
    const messagesJson = JSON.stringify(messages.map(m => ({
      role: m.role,
      text: m.text,
      actions: m.actions,
      actionsStatus: m.actionsStatus,
    })));
    const lastPreview = messages[messages.length - 1]?.text?.substring(0, 100) || '';

    try {
      if (currentConversationId) {
        await base44.entities.AIConversation.update(currentConversationId, {
          messages_json: messagesJson,
          last_message_preview: lastPreview,
          message_count: messages.length,
        });
      } else {
        const conv = await base44.entities.AIConversation.create({
          user_id: user.id,
          title,
          messages_json: messagesJson,
          last_message_preview: lastPreview,
          message_count: messages.length,
        });
        setCurrentConversationId(conv.id);
      }
      loadConversations();
    } catch (err) {
      console.error(err);
    }
  };

  const aiEnabled = profile?.ai_enabled !== false;

  const filteredConversations = conversations.filter(c =>
    !searchQuery ||
    c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.last_message_preview?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!aiEnabled) {
    return (
      <div className="px-4 py-8 text-center">
        <div className="w-20 h-20 rounded-3xl bg-accent flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="font-display text-xl font-bold mb-2">Collector AI is Disabled</h2>
        <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
          Enable Collector AI in settings to start using your collection assistant.
        </p>
        <button
          onClick={() => setShowSettings(true)}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-6 py-3 font-medium"
        >
          <SettingsIcon className="w-5 h-5" /> Open Settings
        </button>
        <AISettings open={showSettings} onOpenChange={setShowSettings} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-accent flex-shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-lg font-bold flex items-center gap-1.5 truncate">
            <Sparkles className="w-5 h-5 text-primary flex-shrink-0" /> Collector AI
          </h1>
          {contextHint ? (
            <p className="text-xs text-muted-foreground truncate">Context: {contextHint}</p>
          ) : (
            <p className="text-xs text-muted-foreground">Your collection assistant</p>
          )}
        </div>
        <button
          onClick={startNewConversation}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-accent flex-shrink-0"
          title="New conversation"
        >
          <MessageSquarePlus className="w-5 h-5" />
        </button>
        <button
          onClick={() => setShowHistory(true)}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-accent flex-shrink-0"
          title="Conversation history"
        >
          <History className="w-5 h-5" />
        </button>
        <button
          onClick={() => setShowSettings(true)}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-accent flex-shrink-0"
          title="Settings"
        >
          <SettingsIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 px-4 py-3 overflow-hidden">
        <CollectorAIChat
          conversationId={currentConversationId}
          contextHint={contextHint}
          onConversationChange={handleConversationChange}
        />
      </div>

      {showHistory && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <h2 className="font-display text-lg font-bold flex-1">Conversations</h2>
            <button
              onClick={() => setShowHistory(false)}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-accent"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full h-10 rounded-xl border border-input bg-card pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
            {loadingConvs ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">No conversations found</p>
            ) : (
              filteredConversations.map(conv => (
                <div
                  key={conv.id}
                  onClick={() => selectConversation(conv.id)}
                  className={`rounded-xl border p-3 cursor-pointer transition-colors ${
                    currentConversationId === conv.id
                      ? 'bg-accent border-primary'
                      : 'bg-card border-border hover:bg-accent/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{conv.title}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.last_message_preview}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {conv.message_count} messages · {new Date(conv.updated_date || conv.created_date).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <AISettings open={showSettings} onOpenChange={setShowSettings} />
    </div>
  );
}