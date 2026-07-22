import { useNavigate } from 'react-router-dom';
import { Image } from '@/components/ui/image';
import { formatCurrency } from '@/lib/format';

export default function MessageBubble({ message, isMine }) {
  const navigate = useNavigate();
  const alignment = isMine ? 'justify-end' : 'justify-start';
  const bubbleClass = isMine
    ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-md'
    : 'bg-secondary text-secondary-foreground rounded-2xl rounded-bl-md';

  return (
    <div className={`flex ${alignment} mb-2`}>
      <div className={`max-w-[75%] ${bubbleClass} px-4 py-2.5`}>
        {message.body && <p className="text-sm leading-relaxed">{message.body}</p>}
        {message.attached_collectible_id && (
          <button
            onClick={() => navigate(`/collectible/${message.attached_collectible_id}`)}
            className="mt-2 flex items-center gap-3 bg-card/20 rounded-xl p-2 w-full text-left"
          >
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              {message.attached_collectible_photo ? (
                <Image
                  src={message.attached_collectible_photo}
                  fittingType="fill"
                  className="w-full h-full"
                  alt={message.attached_collectible_name}
                />
              ) : (
                <div className="w-full h-full" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate">{message.attached_collectible_name}</p>
              <p className="text-xs opacity-80">{formatCurrency(message.attached_collectible_value || 0)}</p>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}