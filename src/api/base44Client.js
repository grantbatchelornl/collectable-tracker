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
      UploadFile: unsupported('UploadFile'),
      InvokeLLM: unsupported('InvokeLLM'),
    },
  },

  functions: {
    invoke: async (name) => {
      throw new Error(`Base44 function "${name}" still needs migration`);
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
