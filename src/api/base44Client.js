import { supabase } from '@/lib/supabaseClient';

const tableMap = {
  AIConversation: 'ai_conversations',
  AIReviewQueue: 'ai_review_queue',
  Achievement: 'achievements',
  AchievementTemplate: 'achievement_templates',
  AppFeatureFlag: 'app_feature_flags',
  AppSetting: 'app_settings',
  AuditLog: 'audit_logs',
  Collectible: 'collectibles',
  CollectibleCategory: 'collectible_categories',
  CollectiblePhoto: 'collectible_photos',
  CollectionFolder: 'collection_folders',
  CollectionGoal: 'collection_goals',
  CollectionHealth: 'collection_health',
  CollectionValueSnapshot: 'collection_value_snapshots',
  CollectorProfile: 'profiles',
  Follow: 'follows',
  FoundingCollector: 'founding_collectors',
  HallOfFame: 'hall_of_fame',
  League: 'leagues',
  LeagueActivity: 'league_activities',
  LeagueChallenge: 'league_challenges',
  LeagueMember: 'league_members',
  Message: 'messages',
  Notification: 'notifications',
  PriceAlert: 'price_alerts',
  PricingHistory: 'pricing_history',
  Report: 'reports',
  Trade: 'trades',
  TradeReview: 'trade_reviews',
  User: 'profiles',
  UserBlock: 'user_blocks',
  Watchlist: 'watchlist',
};

function normalizeSort(sort) {
  if (!sort) return null;
  const desc = sort.startsWith('-');
  return {
    column: desc ? sort.slice(1) : sort,
    ascending: !desc,
  };
}

function applyFilters(query, filters = {}) {
  for (const [key, value] of Object.entries(filters || {})) {
    if (value === undefined) continue;
    if (value === null) {
      query = query.is(key, null);
    } else {
      query = query.eq(key, value);
    }
  }
  return query;
}

function makeEntity(entityName) {
  const table = tableMap[entityName];
  if (!table) {
    throw new Error(`No Supabase table mapping for entity: ${entityName}`);
  }

  return {
    async list(sort, limit = 100) {
      let query = supabase.from(table).select('*');

      const ordering = normalizeSort(sort);
      if (ordering) {
        query = query.order(ordering.column, {
          ascending: ordering.ascending,
        });
      }

      if (limit) query = query.limit(limit);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    async filter(filters = {}, sort, limit = 100) {
      let query = supabase.from(table).select('*');
      query = applyFilters(query, filters);

      const ordering = normalizeSort(sort);
      if (ordering) {
        query = query.order(ordering.column, {
          ascending: ordering.ascending,
        });
      }

      if (limit) query = query.limit(limit);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    async get(id) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },

    async create(payload) {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;

      const row = {
        ...payload,
        ...(userId && !payload.created_by_id
          ? { created_by_id: userId }
          : {}),
      };

      if (entityName === 'User' || entityName === 'CollectorProfile') {
        if (payload.user_id && !payload.id) {
          row.id = payload.user_id;
        }
      }

      const { data, error } = await supabase
        .from(table)
        .insert(row)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async update(id, payload) {
      const { data, error } = await supabase
        .from(table)
        .update({
          ...payload,
          updated_date: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async delete(id) {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    },

    async deleteMany(filters = {}) {
      let query = supabase.from(table).delete();
      query = applyFilters(query, filters);

      const { error } = await query;
      if (error) throw error;
      return true;
    },

    async bulkCreate(rows = []) {
      if (!rows.length) return [];

      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;

      const payload = rows.map((row) => ({
        ...row,
        ...(userId && !row.created_by_id
          ? { created_by_id: userId }
          : {}),
      }));

      const { data, error } = await supabase
        .from(table)
        .insert(payload)
        .select();

      if (error) throw error;
      return data || [];
    },

    async bulkUpdate(ids = [], payload = {}) {
      if (!ids.length) return [];

      const { data, error } = await supabase
        .from(table)
        .update({
          ...payload,
          updated_date: new Date().toISOString(),
        })
        .in('id', ids)
        .select();

      if (error) throw error;
      return data || [];
    },

    subscribe(callback) {
      const channel = supabase
        .channel(`entity-${table}-${Math.random().toString(36).slice(2)}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table,
          },
          (payload) => callback(payload)
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    },
  };
}

const entities = new Proxy(
  {},
  {
    get(_target, entityName) {
      return makeEntity(entityName);
    },
  }
);

const unsupported = (name) => async () => {
  throw new Error(`${name} still needs to be migrated away from Base44`);
};

export const base44 = {
  entities,

  integrations: {
    Core: {
      UploadFile: async ({ file }) => {
        if (!file) {
          throw new Error('UploadFile requires a file');
        }

        const { data: authData } = await supabase.auth.getUser();
        const userId = authData?.user?.id || 'anonymous';

        const extension = file.name?.includes('.')
          ? file.name.split('.').pop()
          : 'bin';

        const safeName = (file.name || `upload.${extension}`)
          .replace(/[^a-zA-Z0-9._-]/g, '_');

        const path = `${userId}/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}-${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from('uploads')
          .upload(path, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('uploads')
          .getPublicUrl(path);

        return {
          file_url: data.publicUrl,
          path,
        };
      },

      InvokeLLM: async (payload = {}) => {
        const { data, error } = await supabase.functions.invoke('invoke-llm', {
          body: payload,
        });

        if (error) throw error;
        return data;
      },
    },
  },

  functions: {
    invoke: async (name, args = {}) => {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;

      const currentUser = authData?.user;
      const currentUserId = currentUser?.id;

      const wrap = (data) => ({ data });

      if (name === 'getPublicProfiles') {
        const { data, error } = await supabase
          .from('profiles')
          .select('*');

        if (error) throw error;

        const profiles = (data || []).map((p) => ({
          ...p,
          user_id: p.user_id || p.id,
        }));

        return wrap({ profiles });
      }

      if (name === 'getPublicProfile') {
        const targetUserId = args.targetUserId;

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', targetUserId)
          .maybeSingle();

        if (error) throw error;

        const { data: blocks, error: blockError } = await supabase
          .from('user_blocks')
          .select('*')
          .or(
            `and(blocker_id.eq.${currentUserId},blocked_id.eq.${targetUserId}),and(blocker_id.eq.${targetUserId},blocked_id.eq.${currentUserId})`
          );

        if (blockError) throw blockError;

        const { data: follows, error: followError } = await supabase
          .from('follows')
          .select('*')
          .or(
            `and(follower_id.eq.${currentUserId},following_id.eq.${targetUserId}),and(follower_id.eq.${targetUserId},following_id.eq.${currentUserId})`
          );

        if (followError) throw followError;

        const iBlockedThem = (blocks || []).some(
          (b) => b.blocker_id === currentUserId && b.blocked_id === targetUserId
        );

        const theyBlockedMe = (blocks || []).some(
          (b) => b.blocker_id === targetUserId && b.blocked_id === currentUserId
        );

        const isFriend = (follows || []).some(
          (f) =>
            f.status === 'active' &&
            (
              (f.follower_id === currentUserId && f.following_id === targetUserId) ||
              (f.follower_id === targetUserId && f.following_id === currentUserId)
            )
        );

        return wrap({
          profile: profile
            ? { ...profile, user_id: profile.user_id || profile.id }
            : null,
          isFriend,
          iBlockedThem,
          theyBlockedMe,
        });
      }

      if (name === 'sendMessage') {
        const recipientId = args.recipientId;

        const { data: blocked } = await supabase
          .from('user_blocks')
          .select('id')
          .or(
            `and(blocker_id.eq.${currentUserId},blocked_id.eq.${recipientId}),and(blocker_id.eq.${recipientId},blocked_id.eq.${currentUserId})`
          )
          .limit(1);

        if (blocked?.length) {
          return wrap({ error: 'blocked' });
        }

        const { data: senderProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUserId)
          .maybeSingle();

        const { data: recipientProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', recipientId)
          .maybeSingle();

        const { data: message, error } = await supabase
          .from('messages')
          .insert({
            sender_id: currentUserId,
            recipient_id: recipientId,
            sender_name: senderProfile?.display_name || currentUser?.email || 'Collector',
            recipient_name: recipientProfile?.display_name || 'Collector',
            sender_photo: senderProfile?.profile_photo || '',
            recipient_photo: recipientProfile?.profile_photo || '',
            body: args.body || '',
            read: false,
            attached_collectible_id: args.attachedCollectibleId || '',
            attached_collectible_name: args.attachedCollectibleName || '',
            attached_collectible_photo: args.attachedCollectiblePhoto || '',
            attached_collectible_value: args.attachedCollectibleValue || 0,
            created_by_id: currentUserId,
          })
          .select()
          .single();

        if (error) throw error;
        return wrap({ message });
      }

      if (name === 'createTrade') {
        const recipientId = args.recipientId;

        const { data: proposerProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUserId)
          .maybeSingle();

        const { data: recipientProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', recipientId)
          .maybeSingle();

        const { data: trade, error } = await supabase
          .from('trades')
          .insert({
            proposer_id: currentUserId,
            recipient_id: recipientId,
            proposer_name: proposerProfile?.display_name || 'Collector',
            recipient_name: recipientProfile?.display_name || 'Collector',
            proposer_photo: proposerProfile?.profile_photo || '',
            status: 'pending',
            message: args.message || '',
            offered_items_json: JSON.stringify(args.offeredItemIds || []),
            requested_items_json: JSON.stringify(args.requestedItemIds || []),
            cash_adjustment: args.cashAdjustment || 0,
            created_by_id: currentUserId,
          })
          .select()
          .single();

        if (error) throw error;
        return wrap({ trade });
      }

      if (name === 'updateTradeStatus') {
        const { data: trade, error: readError } = await supabase
          .from('trades')
          .select('*')
          .eq('id', args.tradeId)
          .single();

        if (readError) throw readError;

        const allowed =
          trade.proposer_id === currentUserId ||
          trade.recipient_id === currentUserId;

        if (!allowed) {
          return wrap({ error: 'Not authorized' });
        }

        const { data: updated, error } = await supabase
          .from('trades')
          .update({
            status: args.status,
            updated_date: new Date().toISOString(),
          })
          .eq('id', args.tradeId)
          .select()
          .single();

        if (error) throw error;
        return wrap({ trade: updated });
      }

      if (name === 'submitTradeReview') {
        const { data: trade, error: tradeError } = await supabase
          .from('trades')
          .select('*')
          .eq('id', args.tradeId)
          .single();

        if (tradeError) throw tradeError;

        const reviewedId =
          trade.proposer_id === currentUserId
            ? trade.recipient_id
            : trade.proposer_id;

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUserId)
          .maybeSingle();

        const { data: review, error } = await supabase
          .from('trade_reviews')
          .insert({
            trade_id: args.tradeId,
            reviewer_id: currentUserId,
            reviewer_name: profile?.display_name || 'Collector',
            reviewed_id: reviewedId,
            rating_accuracy: args.rating_accuracy,
            rating_communication: args.rating_communication,
            rating_shipping: args.rating_shipping,
            rating_packaging: args.rating_packaging,
            would_trade_again: args.would_trade_again,
            comment: args.comment || '',
            created_by_id: currentUserId,
          })
          .select()
          .single();

        if (error) throw error;
        return wrap({ review });
      }

      if (name === 'updateUserRole') {
        const { data: me } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', currentUserId)
          .maybeSingle();

        if (!['admin', 'super_admin'].includes(me?.role)) {
          return wrap({ error: 'Not authorized' });
        }

        const { data: updated, error } = await supabase
          .from('profiles')
          .update({ role: args.newRole })
          .eq('id', args.targetUserId)
          .select()
          .single();

        if (error) throw error;
        return wrap({ user: updated });
      }

      if (name === 'awardAchievements') {
        // Keep the app operational while the old Base44 award engine
        // is replaced separately.
        const { data, error } = await supabase
          .from('achievements')
          .select('*')
          .eq('user_id', currentUserId);

        if (error) throw error;
        return wrap({ achievements: data || [] });
      }

      if (name === 'verifyAdminAccess') {
        // Do not reproduce the old shared-password mechanism client-side.
        // Supabase role authorization is now the source of truth.
        const { data: me } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', currentUserId)
          .maybeSingle();

        return wrap({
          authorized: ['admin', 'super_admin'].includes(me?.role),
        });
      }

      throw new Error(`Function "${name}" still needs migration`);
    },
  },

  auth: {
    me: async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data.user;
    },

    logout: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },

    updateMe: async (payload) => {
      const { data, error } = await supabase.auth.updateUser({
        data: payload,
      });
      if (error) throw error;
      return data.user;
    },

    isAuthenticated: async () => {
      const { data } = await supabase.auth.getSession();
      return Boolean(data.session);
    },
  },
};
