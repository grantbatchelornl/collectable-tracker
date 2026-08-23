import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import ConversationItem from '@/components/social/ConversationItem';
import TradeCard from '@/components/social/TradeCard';
import { MessageCircle, ArrowLeftRight, Loader2 } from 'lucide-react';

export default function Messages() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState('chats');
  const [conversations, setConversations] = useState([]);
  const [incomingTrades, setIncomingTrades] = useState([]);
  const [outgoingTrades, setOutgoingTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [blockedIds, setBlockedIds] = useState(new Set());

  useEffect(() => {
    loadData(true);
    let debounceTimer = null;
    const debouncedLoad = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => loadData(), 300);
    };
    const unsubMessages = base44.entities.Message.subscribe(debouncedLoad);
    const unsubTrades = base44.entities.Trade.subscribe(debouncedLoad);
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      unsubMessages();
      unsubTrades();
    };
  }, []);

  const loadData = async (showSpinner = false) => {
    if (!user?.id) return;
    if (showSpinner) setLoading(true);
    try {
      const [sentMsgs, receivedMsgs, incomingTradeRows, outgoingTradeRows, blocks] = await Promise.all([
        base44.entities.Message.filter({ sender_id: user.id }, '-created_date', 250),
        base44.entities.Message.filter({ recipient_id: user.id }, '-created_date', 250),
        base44.entities.Trade.filter({ recipient_id: user.id }, '-created_date', 100),
        base44.entities.Trade.filter({ proposer_id: user.id }, '-created_date', 100),
        base44.entities.UserBlock.filter({ blocker_id: user.id }),
      ]);
      const messages = [...sentMsgs, ...receivedMsgs];
      const tradeMap = new Map();
      [...incomingTradeRows, ...outgoingTradeRows].forEach((trade) => tradeMap.set(trade.id, trade));
      const trades = [...tradeMap.values()].sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));

      const blockedSet = new Set(blocks.map((b) => b.blocked_id));
      setBlockedIds(blockedSet);

      const convMap = new Map();
      messages.forEach((msg) => {
        const otherId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
        const otherName = msg.sender_id === user.id ? msg.recipient_name : msg.sender_name;
        const otherPhoto = msg.sender_id === user.id ? msg.recipient_photo : msg.sender_photo;
        const existing = convMap.get(otherId);
        if (!existing || new Date(msg.created_date) > new Date(existing.lastMessageDate)) {
          convMap.set(otherId, {
            otherUserId: otherId,
            otherUserName: otherName,
            otherUserPhoto: otherPhoto || '',
            lastMessage:
              msg.body ||
              (msg.attached_collectible_name ? `Shared: ${msg.attached_collectible_name}` : ''),
            lastMessageDate: msg.created_date,
            unreadCount: 0,
          });
        }
      });

      messages.forEach((msg) => {
        if (msg.recipient_id === user.id && !msg.read) {
          const conv = convMap.get(msg.sender_id);
          if (conv) conv.unreadCount++;
        }
      });

      setConversations(
        Array.from(convMap.values())
          .filter((conv) => !blockedSet.has(conv.otherUserId))
          .sort((a, b) => new Date(b.lastMessageDate) - new Date(a.lastMessageDate))
      );
      setIncomingTrades(trades.filter((t) => t.recipient_id === user.id && !blockedSet.has(t.proposer_id)));
      setOutgoingTrades(trades.filter((t) => t.proposer_id === user.id && !blockedSet.has(t.recipient_id)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const pendingIncoming = incomingTrades.filter((t) => t.status === 'pending').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      <h2 className="font-display text-xl font-bold mb-4">Messages</h2>

      <div className="flex gap-1 bg-muted rounded-xl p-1 mb-4">
        <button
          onClick={() => setTab('chats')}
          className={`flex-1 h-9 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
            tab === 'chats' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
          }`}
        >
          <MessageCircle className="w-4 h-4" /> Chats
        </button>
        <button
          onClick={() => setTab('trades')}
          className={`flex-1 h-9 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-colors relative ${
            tab === 'trades' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" /> Trades
          {pendingIncoming > 0 && (
            <span className="absolute top-0 right-2 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {pendingIncoming}
            </span>
          )}
        </button>
      </div>

      {tab === 'chats' ? (
        conversations.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="No conversations yet"
            text="Follow collectors and start chatting from their profile."
          />
        ) : (
          <div className="rounded-2xl bg-card border border-border overflow-hidden">
            {conversations.map((conv) => (
              <div key={conv.otherUserId} className="border-b border-border last:border-b-0">
                <ConversationItem
                  otherUserName={conv.otherUserName}
                  otherUserPhoto={conv.otherUserPhoto}
                  lastMessage={conv.lastMessage}
                  lastMessageDate={conv.lastMessageDate}
                  unreadCount={conv.unreadCount}
                  onClick={() => navigate(`/chat/${conv.otherUserId}`)}
                />
              </div>
            ))}
          </div>
        )
      ) : incomingTrades.length === 0 && outgoingTrades.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="No trade offers"
          text="Propose trades from a collector's profile to see them here."
        />
      ) : (
        <div className="space-y-4">
          {incomingTrades.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Incoming
              </h3>
              <div className="space-y-3">
                {incomingTrades.map((trade) => (
                  <TradeCard key={trade.id} trade={trade} isIncoming onAction={loadData} />
                ))}
              </div>
            </div>
          )}
          {outgoingTrades.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Outgoing
              </h3>
              <div className="space-y-3">
                {outgoingTrades.map((trade) => (
                  <TradeCard key={trade.id} trade={trade} isIncoming={false} onAction={loadData} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, title, text }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="font-display text-base font-bold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs">{text}</p>
    </div>
  );
}