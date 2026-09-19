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

const fieldAliases = {
  Collectible: {
    created_by_id: 'user_id',
    created_date: 'created_at',
  },
  CollectorProfile: {
    user_id: 'id',
  },
  User: {
    user_id: 'id',
  },
};

function fieldName(entityName, field) {
  return fieldAliases[entityName]?.[field] || field;
}


function normalizeSort(sort, entityName) {
  if (!sort) return null;
  const desc = sort.startsWith('-');
  const raw = desc ? sort.slice(1) : sort;
  return {
    column: fieldName(entityName, raw),
    ascending: !desc,
  };
}

function applyFilters(query, filters = {}, entityName) {
  for (const [key, value] of Object.entries(filters || {})) {
    if (value === undefined) continue;
    const column = fieldName(entityName, key);
    if (value === null) {
      query = query.is(column, null);
    } else {
      query = query.eq(column, value);
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

      const ordering = normalizeSort(sort, entityName);
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
      query = applyFilters(query, filters, entityName);

      const ordering = normalizeSort(sort, entityName);
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
      };

      if (entityName === 'Collectible') {
        delete row.created_by_id;
        if (!row.user_id && userId) row.user_id = userId;
      } else if (userId && !row.created_by_id) {
        row.created_by_id = userId;
      }

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
      query = applyFilters(query, filters, entityName);

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

      if (name === 'collectorAIChat') {
        const [collectiblesRes, healthRes] = await Promise.all([
          supabase
            .from('collectibles')
            .select('*')
            .eq('user_id', currentUserId)
            .eq('is_deleted', false)
            .limit(200),
          supabase
            .from('collection_health')
            .select('*')
            .eq('created_by_id', currentUserId)
            .limit(20),
        ]);

        if (collectiblesRes.error) throw collectiblesRes.error;
        if (healthRes.error) throw healthRes.error;

        const items = collectiblesRes.data || [];
        const health = healthRes.data || [];

        const historyText = (args.history || [])
          .slice(-10)
          .map((m) => `${m.role}: ${m.text}`)
          .join('\n');

        const collectionText = items
          .slice(0, 100)
          .map((c) =>
            `${c.item_name || 'Unknown'} | category:${c.category_name || ''} | value:$${c.estimated_value || 0} | year:${c.year || ''} | grade:${c.grade || 'raw'} | set:${c.set_name || ''}`
          )
          .join('\n');

        const prompt = `You are COLLECTABLE AI, an assistant for a collectibles tracking app.

Answer using the collector's actual collection data below. Do not invent collectibles they do not own.

Context hint:
${args.contextHint || 'None'}

Recent conversation:
${historyText || 'None'}

Collection:
${collectionText || 'No collectibles yet'}

Collection health:
${JSON.stringify(health)}

User question:
${args.question}

Return JSON with:
- response: a helpful plain-text answer
- suggested_actions: an array of zero or more actions

Each suggested action must contain:
- title
- description
- action_type
- details

Allowed action_type values:
navigate, update_profile, update_collectible, add_to_wishlist,
mark_for_trade, toggle_favorite, toggle_showcase,
refresh_pricing, start_grading, create_goal.

Only suggest a write action when it is clearly useful.`;

        const { data, error } = await supabase.functions.invoke('invoke-llm', {
          body: {
            prompt,
            model: 'gemini_3_flash',
            response_json_schema: {
              type: 'object',
              properties: {
                response: { type: 'string' },
                suggested_actions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      title: { type: 'string' },
                      description: { type: 'string' },
                      action_type: { type: 'string' },
                      details: { type: 'object' },
                    },
                  },
                },
              },
              required: ['response', 'suggested_actions'],
            },
          },
        });

        if (error) throw error;
        return wrap(data);
      }

      if (name === 'collectorAIExecute') {
        if (args.confirmed !== true) {
          return wrap({
            success: false,
            message: 'Confirmation is required before changing your data.',
          });
        }

        const details = args.details || {};

        if (args.action_type === 'update_profile') {
          const allowed = [
            'display_name',
            'username',
            'bio',
            'profile_photo',
            'show_public_value',
          ];

          const update = Object.fromEntries(
            Object.entries(details).filter(([key]) => allowed.includes(key))
          );

          const { error } = await supabase
            .from('profiles')
            .update(update)
            .eq('id', currentUserId);

          if (error) throw error;

          return wrap({
            success: true,
            message: 'Profile updated.',
            route: '/profile',
          });
        }

        if (args.action_type === 'update_collectible') {
          if (!details.collectible_id) {
            return wrap({ success: false, message: 'Collectible ID is required.' });
          }

          const { collectible_id, ...requested } = details;

          const allowed = [
            'item_name',
            'estimated_value',
            'notes',
            'trade_status',
            'is_favorite',
            'showcase_order',
            'privacy_status',
          ];

          const update = Object.fromEntries(
            Object.entries(requested).filter(([key]) => allowed.includes(key))
          );

          const { data, error } = await supabase
            .from('collectibles')
            .update(update)
            .eq('id', collectible_id)
            .eq('created_by_id', currentUserId)
            .select()
            .maybeSingle();

          if (error) throw error;
          if (!data) {
            return wrap({ success: false, message: 'Collectible not found.' });
          }

          return wrap({
            success: true,
            message: 'Collectible updated.',
            route: `/collectible/${collectible_id}`,
          });
        }

        if (args.action_type === 'add_to_wishlist') {
          const { data, error } = await supabase
            .from('watchlist')
            .insert({
              user_id: currentUserId,
              item_name: details.item_name || details.name || 'Collectible',
              category_name: details.category_name || '',
              target_price: details.target_price || 0,
              notes: details.notes || '',
              priority: details.priority || 'medium',
              status: 'active',
              created_by_id: currentUserId,
            })
            .select()
            .single();

          if (error) throw error;

          return wrap({
            success: true,
            message: `Added "${data.item_name}" to your wishlist.`,
            route: '/watchlist',
          });
        }

        if (
          ['mark_for_trade', 'toggle_favorite', 'toggle_showcase'].includes(
            args.action_type
          )
        ) {
          const collectibleId = details.collectible_id;

          if (!collectibleId) {
            return wrap({ success: false, message: 'Collectible ID is required.' });
          }

          const update =
            args.action_type === 'mark_for_trade'
              ? { trade_status: details.trade_status || 'trade' }
              : args.action_type === 'toggle_favorite'
                ? { is_favorite: details.is_favorite !== false }
                : { showcase_order: details.showcase_order || 1 };

          const { data, error } = await supabase
            .from('collectibles')
            .update(update)
            .eq('id', collectibleId)
            .eq('created_by_id', currentUserId)
            .select()
            .maybeSingle();

          if (error) throw error;
          if (!data) {
            return wrap({ success: false, message: 'Collectible not found.' });
          }

          return wrap({
            success: true,
            message: 'Collectible updated.',
            route: `/collectible/${collectibleId}`,
          });
        }

        return wrap({
          success: false,
          message: `Unsupported Collector AI action: ${args.action_type}`,
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

    register: async ({ email, password }) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;
      return data;
    },

    verifyOtp: async ({ email, otpCode }) => {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'email',
      });

      if (error) throw error;

      return {
        ...data,
        access_token: data.session?.access_token || null,
      };
    },

    resendOtp: async (email) => {
      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;
      return data;
    },

    loginWithProvider: async (provider, returnTo = '/') => {
      const redirectTo = new URL(returnTo, window.location.origin).toString();

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
        },
      });

      if (error) throw error;
      return data;
    },

    resetPasswordRequest: async (email) => {
      const redirectTo = `${window.location.origin}/reset-password`;

      const { data, error } = await supabase.auth.resetPasswordForEmail(
        email,
        { redirectTo }
      );

      if (error) throw error;
      return data;
    },

    resetPassword: async ({ resetToken, newPassword }) => {
      // Supabase establishes a recovery session when the user follows the
      // password-reset email link. At that point updateUser changes the
      // password for that authenticated recovery session.
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
      return data.user;
    },

    setToken: async () => {
      // Supabase persists the session returned by verifyOtp automatically.
      // Kept as a compatibility no-op for the former Base44 call site.
      return true;
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
