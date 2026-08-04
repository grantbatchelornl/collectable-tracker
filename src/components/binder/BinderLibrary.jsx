import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { subscribeToMasterBinder } from '@/lib/binderChecklist';
import {
  getBinderIndex, searchBinders, getSmartSuggestions,
  getFavorites, toggleFavorite, getRecentlyViewed, addRecentlyViewed,
  getRecommendations, estimateOwnership, getCategoryColor,
  setPokemonDynamicSets,
} from '@/lib/masterBinderIndex';
import { MASTER_BINDERS } from '@/lib/masterBinders';
import { fetchCategorySetsDynamic } from '@/lib/binderSetGenerator';
import { Loader2, Sparkles, Star, BookOpen, Search, ArrowLeft, ChevronRight } from 'lucide-react';
import BinderSearchBar from './BinderSearchBar';
import SetLibraryCard from './SetLibraryCard';
import SetDetailModal from './SetDetailModal';
import CategoryCard from './CategoryCard';
import CategoryLibrary from './CategoryLibrary';
import ComingSoonStrip from './ComingSoonStrip';
import HiddenSetsSection from './HiddenSetsSection';
import EmptyState from '@/components/ui/EmptyState';

export default function BinderLibrary() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [previewEntry, setPreviewEntry] = useState(null);
  const [subscribing, setSubscribing] = useState(null);
  const [collectibles, setCollectibles] = useState([]);
  const [binders, setBinders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [pokemonLoaded, setPokemonLoaded] = useState(false);

  useEffect(() => {
    setFavorites(getFavorites());
    setRecentlyViewed(getRecentlyViewed());
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    try {
      const [collectibleData, binderData] = await Promise.all([
        base44.entities.Collectible.filter({ created_by_id: user.id, is_deleted: false }, '-created_date', 500),
        base44.entities.CollectionBinder.filter({ user_id: user.id }, '-created_date', 50),
      ]);
      setCollectibles(collectibleData);
      setBinders(binderData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
    // Fetch live Pokémon set data from the API in parallel (non-blocking)
    fetchCategorySetsDynamic('pokemon')
      .then((sets) => {
        if (sets) {
          setPokemonDynamicSets(sets);
          setPokemonLoaded(true);
        }
      })
      .catch(() => {});
  };

  const existingBinderSets = useMemo(() => {
    const set = new Set();
    for (const b of binders) {
      const catKey = Object.keys(MASTER_BINDERS).find(k => MASTER_BINDERS[k].label === b.franchise);
      if (catKey && b.set_name) set.add(`${catKey}::${b.set_name}`);
    }
    return set;
  }, [binders]);

  const index = useMemo(() => getBinderIndex(), [pokemonLoaded]);

  const favoriteEntries = useMemo(
    () => favorites.map(id => index.find(e => e.id === id)).filter(Boolean),
    [favorites, index]
  );

  const recentEntries = useMemo(
    () => recentlyViewed.map(id => index.find(e => e.id === id)).filter(Boolean),
    [recentlyViewed, index]
  );

  const recommendations = useMemo(
    () => getRecommendations(collectibles, [], existingBinderSets),
    [collectibles, existingBinderSets]
  );

  const searchResults = useMemo(() => {
    return searchBinders(query, { category: selectedCategory || 'all' });
  }, [query, selectedCategory]);

  const hasQuery = query.trim().length > 0;
  const smartSuggestions = useMemo(() => {
    if (!hasQuery || searchResults.length > 0) return [];
    return getSmartSuggestions(query).slice(0, 6);
  }, [hasQuery, query, searchResults.length]);

  const handleToggleFavorite = (entryId) => {
    const updated = toggleFavorite(entryId);
    setFavorites(updated);
  };

  const handleOpenPreview = (entry) => {
    addRecentlyViewed(entry.id);
    setRecentlyViewed(getRecentlyViewed());
    setPreviewEntry(entry);
  };

  const handleCreate = async (entry) => {
    setSubscribing(entry.id);
    try {
      const binder = await subscribeToMasterBinder(user, entry.category, entry.franchise, entry.name, entry.icon);
      navigate(`/binder/${binder.id}`);
    } catch (e) {
      console.error(e);
      setSubscribing(null);
    }
  };

  const handleAddToWishlist = async (entry) => {
    try {
      await base44.entities.Watchlist.create({
        user_id: user.id,
        item_name: `${entry.franchise} ${entry.name} (Complete Set)`,
        category_name: entry.categoryLabel,
        status: 'active',
        priority: 'medium',
        visibility: 'private',
      });
    } catch (e) { console.error(e); }
    setPreviewEntry(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // SEARCH RESULTS VIEW
  if (hasQuery) {
    return (
      <div className="space-y-4">
        <BinderSearchBar value={query} onChange={setQuery} placeholder="Search Pokémon, Funko, Sports, Coins, Magic, Lorcana..." />

        {searchResults.length > 0 ? (
          <>
            <p className="text-xs text-muted-foreground">{searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</p>
            <div className="grid grid-cols-2 gap-2">
              {searchResults.map(entry => (
                <SetLibraryCard
                  key={entry.id}
                  entry={entry}
                  isFavorite={favorites.includes(entry.id)}
                  ownership={estimateOwnership(entry, collectibles)}
                  onToggleFavorite={() => handleToggleFavorite(entry.id)}
                  onOpen={() => handleOpenPreview(entry)}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <EmptyState
              icon={Search}
              title="No exact match"
              description={`No sets found for "${query}". Check similar sets below.`}
            />
            {smartSuggestions.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <p className="text-xs font-medium">Similar Sets</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {smartSuggestions.map(entry => (
                    <SetLibraryCard
                      key={entry.id}
                      entry={entry}
                      isFavorite={favorites.includes(entry.id)}
                      ownership={estimateOwnership(entry, collectibles)}
                      onToggleFavorite={() => handleToggleFavorite(entry.id)}
                      onOpen={() => handleOpenPreview(entry)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {previewEntry && (
          <SetDetailModal
            entry={previewEntry}
            isFavorite={favorites.includes(previewEntry.id)}
            ownership={estimateOwnership(previewEntry, collectibles)}
            existingBinder={existingBinderSets.has(previewEntry.id)}
            isCreating={subscribing === previewEntry.id}
            onClose={() => setPreviewEntry(null)}
            onCreate={() => handleCreate(previewEntry)}
            onToggleFavorite={() => handleToggleFavorite(previewEntry.id)}
            onAddToWishlist={() => handleAddToWishlist(previewEntry)}
          />
        )}
      </div>
    );
  }

  // CATEGORY DETAIL VIEW
  if (selectedCategory) {
    const cat = MASTER_BINDERS[selectedCategory];
    return (
      <div className="space-y-4">
        <CategoryLibrary
          categoryKey={selectedCategory}
          category={cat}
          collectibles={collectibles}
          favorites={favorites}
          onBack={() => setSelectedCategory(null)}
          onOpenSet={handleOpenPreview}
          onToggleFav={handleToggleFavorite}
        />
        {previewEntry && (
          <SetDetailModal
            entry={previewEntry}
            isFavorite={favorites.includes(previewEntry.id)}
            ownership={estimateOwnership(previewEntry, collectibles)}
            existingBinder={existingBinderSets.has(previewEntry.id)}
            isCreating={subscribing === previewEntry.id}
            onClose={() => setPreviewEntry(null)}
            onCreate={() => handleCreate(previewEntry)}
            onToggleFavorite={() => handleToggleFavorite(previewEntry.id)}
            onAddToWishlist={() => handleAddToWishlist(previewEntry)}
          />
        )}
      </div>
    );
  }

  // LIBRARY HOME VIEW
  return (
    <div className="space-y-5">
      <BinderSearchBar value={query} onChange={setQuery} placeholder="Search Pokémon, Funko, Sports, Coins, Magic, Lorcana..." />

      {/* Continue Collecting */}
      {recentEntries.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Continue Collecting</h3>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
            {recentEntries.slice(0, 6).map(entry => (
              <div key={entry.id} className="w-36 flex-shrink-0">
                <SetLibraryCard
                  entry={entry}
                  isFavorite={favorites.includes(entry.id)}
                  ownership={estimateOwnership(entry, collectibles)}
                  onToggleFavorite={() => handleToggleFavorite(entry.id)}
                  onOpen={() => handleOpenPreview(entry)}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Favorites */}
      {favoriteEntries.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-gold" />
            <h3 className="text-sm font-semibold">Favorites</h3>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
            {favoriteEntries.map(entry => (
              <div key={entry.id} className="w-36 flex-shrink-0">
                <SetLibraryCard
                  entry={entry}
                  isFavorite
                  onToggleFavorite={() => handleToggleFavorite(entry.id)}
                  onOpen={() => handleOpenPreview(entry)}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <h3 className="text-sm font-semibold">AI Recommendations</h3>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
            {recommendations.map(rec => (
              <div key={rec.id} className="w-44 flex-shrink-0">
                <div className="mb-1">
                  <p className="text-[10px] text-primary font-medium truncate">{rec.reason}</p>
                </div>
                <SetLibraryCard
                  entry={rec}
                  isFavorite={favorites.includes(rec.id)}
                  ownership={rec.ownership}
                  onToggleFavorite={() => handleToggleFavorite(rec.id)}
                  onOpen={() => handleOpenPreview(rec)}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Coming Soon */}
      <ComingSoonStrip onOpenSet={handleOpenPreview} />

      {/* Browse by Category */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold">Browse by Category</h3>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(MASTER_BINDERS).map(([key, cat], i) => (
            <CategoryCard
              key={key}
              category={cat}
              count={cat.sets.length}
              index={i}
              onClick={() => setSelectedCategory(key)}
            />
          ))}
        </div>
      </section>

      {/* Hidden Collections */}
      <HiddenSetsSection onOpenSet={handleOpenPreview} />

      {/* All Sets Quick Access */}
      <section className="space-y-2">
        <button
          onClick={() => setSelectedCategory(Object.keys(MASTER_BINDERS)[0])}
          className="w-full flex items-center justify-between p-3 rounded-2xl bg-card border border-border"
        >
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Browse All Sets</span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </section>

      {/* Set Detail Modal */}
      {previewEntry && (
        <SetDetailModal
          entry={previewEntry}
          isFavorite={favorites.includes(previewEntry.id)}
          ownership={estimateOwnership(previewEntry, collectibles)}
          existingBinder={existingBinderSets.has(previewEntry.id)}
          isCreating={subscribing === previewEntry.id}
          onClose={() => setPreviewEntry(null)}
          onCreate={() => handleCreate(previewEntry)}
          onToggleFavorite={() => handleToggleFavorite(previewEntry.id)}
          onAddToWishlist={() => handleAddToWishlist(previewEntry)}
        />
      )}
    </div>
  );
}