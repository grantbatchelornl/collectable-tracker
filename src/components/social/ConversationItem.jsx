import { Image } from '@/components/ui/image';
import { formatRelativeDate } from '@/lib/format';
import { getInitials } from '@/lib/social';

export default function ConversationItem({
  otherUserName,
  otherUserPhoto,
  lastMessage,
  lastMessageDate,
  unreadCount,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 hover:bg-accent transition-colors text-left"
    >
      <div className="w-12 h-12 rounded-full overflow-hidden border border-border bg-muted flex-shrink-0">
        {otherUserPhoto ? (
          <Image src={otherUserPhoto} fittingType="fill" className="w-full h-full" alt={otherUserName} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-lg font-bold text-muted-foreground">
            {getInitials(otherUserName)}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-sm truncate">{otherUserName || 'Collector'}</p>
          {lastMessageDate && (
            <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
              {formatRelativeDate(lastMessageDate)}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">{lastMessage || 'Say hi!'}</p>
      </div>
      {unreadCount > 0 && (
        <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center flex-shrink-0">
          {unreadCount}
        </div>
      )}
    </button>
  );
}