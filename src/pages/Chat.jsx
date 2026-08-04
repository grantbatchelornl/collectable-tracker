import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Image } from '@/components/ui/image';
import MessageBubble from '@/components/social/MessageBubble';
import { getInitials } from '@/lib/social';
import { formatCurrency } from '@/lib/format';
import { ArrowLeft, Send, Share2, Loader2, X, Package } from 'lucide-react';

export default function Chat() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [otherProfile, setOtherProfile] = useState(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [myCollectibles, setMyCollectibles] = useState([]);
  const [loadingCollectibles, setLoadingCollectibles] = useState(false);
  const [blockStatus, setBlockStatus] = useState({ iBlockedThem: false, theyBlockedMe: false });
  const scrollRef = useRef(null);

  useEffect(() => {
    loadChat();
    const unsubscribe = base44.entities.Message.subscribe(() => {
      loadMessages();
    });
    return unsubscribe;
  }, [userId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadChat = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [profiles, sentMsgs, receivedMsgs] = await Promise.all([
        base44.entities.CollectorProfile.filter({ user_id: userId }),
        base44.entities.Message.filter({ sender_id: user.id, recipient_id: userId }, '-created_date', 500),
        base44.entities.Message.filter({ sender_id: userId, recipient_id: user.id }, '-created_date', 500),
      ]);
      setOtherProfile(profiles[0] || null);
      await processMessages([...sentMsgs, ...receivedMsgs]);

      try {
        const myBlock = await base44.entities.UserBlock.filter({ blocker_id: user.id, blocked_id: userId });
        setBlockStatus({ iBlockedThem: myBlock.length > 0, theyBlockedMe: false });
      } catch (e) {
        // non-critical — backend function enforces blocks on send
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const [sentMsgs, receivedMsgs] = await Promise.all([
        base44.entities.Message.filter({ sender_id: user.id, recipient_id: userId }, '-created_date', 500),
        base44.entities.Message.filter({ sender_id: userId, recipient_id: user.id }, '-created_date', 500),
      ]);
      await processMessages([...sentMsgs, ...receivedMsgs]);
    } catch (err) {
      console.error(err);
    }
  };

  const processMessages = async (msgs) => {
    const myMessages = msgs
      .filter(
        (m) =>
          (m.sender_id === user.id && m.recipient_id === userId) ||
          (m.sender_id === userId && m.recipient_id === user.id)
      )
      .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    setMessages(myMessages);

    const unread = myMessages.filter((m) => m.recipient_id === user.id && !m.read);
    if (unread.length > 0) {
      try {
        await base44.entities.Message.bulkUpdate(
          unread.map((m) => ({ id: m.id, read: true }))
        );
      } catch (err) {
        console.error(err);
      }
    }
  };

  const sendMessage = async (attachedItem = null) => {
    if (!input.trim() && !attachedItem) return;
    if (blockStatus.iBlockedThem || blockStatus.theyBlockedMe) return;
    setSending(true);
    try {
      const response = await base44.functions.invoke('sendMessage', {
        recipientId: userId,
        body: input.trim(),
        attachedCollectibleId: attachedItem?.id || '',
        attachedCollectibleName: attachedItem?.item_name || '',
        attachedCollectiblePhoto: attachedItem?.primary_photo_url || '',
        attachedCollectibleValue: attachedItem?.estimated_value || 0,
      });
      if (response.data?.error === 'blocked') {
        setBlockStatus((prev) => ({ ...prev, theyBlockedMe: true }));
        return;
      }
      if (response.data?.error) {
        console.error('sendMessage error:', response.data.error);
        return;
      }
      setInput('');
      if (attachedItem) setShowShare(false);
      await loadMessages();
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const openShare = async () => {
    if (myCollectibles.length > 0) {
      setShowShare(true);
      return;
    }
    setLoadingCollectibles(true);
    try {
      const items = await base44.entities.Collectible.filter({ created_by_id: user.id, is_deleted: false }, '-created_date', 100);
      setMyCollectibles(items);
      setShowShare(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCollectibles(false);
    }
  };

  const otherName = otherProfile?.display_name || 'Collector';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 8rem)' }}>
      <div className="flex items-center gap-3 pb-3 mb-2 border-b border-border">
        <button
          onClick={() => navigate('/messages')}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-accent"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-10 h-10 rounded-full overflow-hidden border border-border bg-muted flex-shrink-0">
          {otherProfile?.profile_photo ? (
            <Image src={otherProfile.profile_photo} fittingType="fill" className="w-full h-full" alt={otherName} />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-bold text-muted-foreground">
              {getInitials(otherName)}
            </div>
          )}
        </div>
        <div>
          <p className="font-semibold text-sm">{otherName}</p>
          <p className="text-xs text-muted-foreground">@{otherProfile?.username || 'collector'}</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto pb-4">
        {blockStatus.theyBlockedMe ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mb-3">
              <X className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">This user has blocked you. You cannot send messages.</p>
          </div>
        ) : blockStatus.iBlockedThem ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mb-3">
              <X className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">You blocked this user. Unblock them to send messages.</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mb-3">
              <Send className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Say hi to {otherName}!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} isMine={msg.sender_id === user.id} />
          ))
        )}
      </div>

      {showShare && (
        <div className="border-t border-border pt-3 pb-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Share a collectible</p>
            <button
              onClick={() => setShowShare(false)}
              className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-accent"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {loadingCollectibles ? (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            ) : myCollectibles.length === 0 ? (
              <p className="text-xs text-muted-foreground">No collectibles to share</p>
            ) : (
              myCollectibles.map((item) => (
                <button
                  key={item.id}
                  onClick={() => sendMessage(item)}
                  className="flex-shrink-0 w-24 text-left"
                >
                  <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted border border-border">
                    {item.primary_photo_url ? (
                      <Image src={item.primary_photo_url} fittingType="fill" className="w-full h-full" alt={item.item_name} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] truncate mt-1">{item.item_name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatCurrency(item.estimated_value || 0)}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {blockStatus.iBlockedThem || blockStatus.theyBlockedMe ? null : (
      <div className="border-t border-border pt-3 flex items-center gap-2 safe-bottom">
        <button
          onClick={openShare}
          className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-accent flex-shrink-0"
        >
          <Share2 className="w-5 h-5" />
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && input.trim()) sendMessage();
          }}
          placeholder="Type a message..."
          className="flex-1 h-10 px-4 rounded-full border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          onClick={() => sendMessage()}
          disabled={sending || !input.trim()}
          className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 flex-shrink-0"
        >
          {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </div>
      )}
    </div>
  );
}