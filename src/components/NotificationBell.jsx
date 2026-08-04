import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import {
  Bell,
  MessageCircle,
  UserPlus,
  UserCheck,
  ArrowLeftRight,
  Award,
  TrendingUp,
  TrendingDown,
  Shield,
  Heart,
  Trophy,
  Megaphone,
  ShieldAlert,
  Activity,
  Loader2,
} from 'lucide-react';
import { formatRelativeDate } from '@/lib/format';

const ICON_MAP = {
  message: MessageCircle,
  friend_request: UserPlus,
  friend_accepted: UserCheck,
  trade_request: ArrowLeftRight,
  trade_update: ArrowLeftRight,
  achievement: Award,
  price_increase: TrendingUp,
  price_decrease: TrendingDown,
  grade_worthiness: Shield,
  wishlist_match: Heart,
  leaderboard: Trophy,
  admin_announcement: Megaphone,
  security_alert: ShieldAlert,
  collection_health: Activity,
};

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!user?.id) return;
    loadNotifications();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const notifs = await base44.entities.Notification.filter(
        { recipient_id: user.id },
        '-created_date',
        30
      );
      setNotifications(notifs);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleClick = async (notification) => {
    if (!notification.read) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
      );
      try {
        await base44.entities.Notification.update(notification.id, { read: true });
      } catch (err) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, read: false } : n))
        );
        console.error('Failed to mark notification as read', err);
      }
    }

    setOpen(false);

    if (notification.destination_route) {
      navigate(notification.destination_route);
    }
  };

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await base44.entities.Notification.bulkUpdate(
        unread.map((n) => ({ id: n.id, read: true }))
      );
    } catch (err) {
      setNotifications((prev) =>
        prev.map((n) => (unread.find((u) => u.id === n.id) ? { ...n, read: false } : n))
      );
      console.error('Failed to mark all as read', err);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          setOpen(!open);
          if (!open && !loading) loadNotifications();
        }}
        className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-accent transition-colors relative"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-12 right-0 w-80 max-w-[calc(100vw-2rem)] bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-50">
          <div className="flex items-center justify-between p-3 border-b border-border">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-primary font-medium"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No notifications yet
              </div>
            ) : (
              notifications.map((notif) => {
                const Icon = ICON_MAP[notif.type] || Bell;
                return (
                  <button
                    key={notif.id}
                    onClick={() => handleClick(notif)}
                    className={`w-full text-left p-3 border-b border-border last:border-b-0 hover:bg-accent transition-colors flex gap-3 ${
                      !notif.read ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        notif.read ? 'bg-muted' : 'bg-primary/10'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 ${notif.read ? 'text-muted-foreground' : 'text-primary'}`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm ${
                          notif.read ? 'text-muted-foreground' : 'font-semibold'
                        }`}
                      >
                        {notif.title}
                      </p>
                      {notif.body && (
                        <p className="text-xs text-muted-foreground truncate">{notif.body}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatRelativeDate(notif.created_date)}
                      </p>
                    </div>
                    {!notif.read && (
                      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}