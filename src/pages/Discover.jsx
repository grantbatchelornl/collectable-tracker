import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import CollectorCard from '@/components/social/CollectorCard';
import CollectibleCard from '@/components/CollectibleCard';
import { Search, Loader2, Compass } from 'lucide-react';

export default function Discover() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [featuredItems, setFeaturedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [profileRes, publicItems] = await Promise.all([
        base44.functions.invoke('getPublicProfiles', {}),
        base44.entities.Collectible.filter({ privacy_status: 'public', is_deleted: false }, '-estimated_value', 12),
      ]);
      const allProfiles = profileRes.data?.profiles || profileRes.profiles || [];
      setProfiles(allProfiles.filter((p) => p.user_id !== user?.id));
      setFeaturedItems(publicItems);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = profiles.filter(
    (p) =>
      !search ||
      p.display_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.username?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold mb-1">Discover</h2>
        <p className="text-sm text-muted-foreground">
          Browse public collections from collectors around the world.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search collectors..."
          className="w-full h-11 pl-10 pr-4 rounded-xl border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
          Collectors
        </h3>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Compass className="w-10 h-10 text-muted-foreground opacity-50 mb-2" />
            <p className="text-sm text-muted-foreground">
              {search ? 'No collectors match your search' : 'No other collectors yet'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((p) => (
              <CollectorCard key={p.id} profile={p} currentUserId={user?.id} />
            ))}
          </div>
        )}
      </div>

      {featuredItems.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
            Featured Items
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {featuredItems.map((item) => (
              <CollectibleCard key={item.id} collectible={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}