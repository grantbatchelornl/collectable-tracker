import { Lock, Users, Globe } from 'lucide-react';

const CONFIG = {
  private: { icon: Lock, label: 'Private', cls: 'bg-muted/80 text-muted-foreground' },
  friends: { icon: Users, label: 'Friends', cls: 'bg-accent text-accent-foreground' },
  public: { icon: Globe, label: 'Public', cls: 'bg-primary/15 text-primary' },
};

export default function PrivacyBadge({ status, compact }) {
  const { icon: Icon, label, cls } = CONFIG[status] || CONFIG.private;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${cls}`}>
      <Icon className="w-3 h-3" />
      {!compact && label}
    </span>
  );
}