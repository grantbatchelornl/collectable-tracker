import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import {
  PROFILE_UPDATABLE_FIELDS,
  COLLECTIBLE_UPDATABLE_FIELDS,
  BINDER_UPDATABLE_FIELDS,
  ACTIONS_REQUIRING_CONFIRMATION,
  VALID_ROUTES,
} from '../../shared/appCapabilities.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const actionType = body.action_type;
    const details = typeof body.details === 'string' ? JSON.parse(body.details) : (body.details || {});
    const conversationId = body.conversation_id || null;
    const autoConfirmed = body.auto_confirmed || false;

    if (!actionType) return Response.json({ error: 'Missing action_type' }, { status: 400 });

    // Check if this action always requires confirmation
    const alwaysRequiresConfirmation = ACTIONS_REQUIRING_CONFIRMATION.includes(actionType);
    const confirmationStatus = autoConfirmed && !alwaysRequiresConfirmation ? 'auto_confirmed' : 'confirmed';

    // Helper: safe get (returns null instead of throwing when record doesn't exist)
    const safeGet = async (entity: any, id: string) => {
      try {
        return await entity.get(id);
      } catch {
        return null;
      }
    };

    // Helper: audit log
    const logAction = async (targetType: string, targetId: string, targetName: string, prev: any, next: any, success: boolean, errorMsg?: string) => {
      try {
        await base44.asServiceRole.entities.AuditLog.create({
          user_id: user.id,
          conversation_id: conversationId,
          action: `collector_ai_${actionType}`,
          action_requested: actionType,
          target_type: targetType,
          target_id: targetId,
          target_name: targetName,
          previous_value: prev ? JSON.stringify(prev) : null,
          new_value: next ? JSON.stringify(next) : null,
          confirmation_status: confirmationStatus,
          success,
          details: errorMsg || undefined,
        });
      } catch (e) {
        // audit failure should not block the action
      }
    };

    switch (actionType) {
      case 'update_profile': {
        const profiles = await base44.asServiceRole.entities.CollectorProfile.filter({ user_id: user.id });
        if (!profiles[0]) return Response.json({ error: 'Profile not found' }, { status: 404 });
        const profile = profiles[0];
        const updates: Record<string, any> = {};
        for (const [field, value] of Object.entries(details.fields || {})) {
          if (PROFILE_UPDATABLE_FIELDS.includes(field)) {
            updates[field] = value;
          }
        }
        if (Object.keys(updates).length === 0) {
          return Response.json({ error: 'No valid profile fields to update' }, { status: 400 });
        }
        const prev = { ...profile };
        const updated = await base44.asServiceRole.entities.CollectorProfile.update(profile.id, updates);
        await logAction('CollectorProfile', profile.id, profile.display_name || user.email, prev, updates, true);
        return Response.json({
          success: true,
          message: `Updated profile: ${Object.keys(updates).join(', ')}`,
          route: '/profile',
          record_id: profile.id,
        });
      }

      case 'update_collectible': {
        const collectibleId = details.collectible_id;
        if (!collectibleId) return Response.json({ error: 'Missing collectible_id' }, { status: 400 });
        const collectible = await safeGet(base44.asServiceRole.entities.Collectible, collectibleId);
        if (!collectible) return Response.json({ error: 'Collectible not found' }, { status: 404 });
        if (collectible.created_by_id !== user.id) {
          return Response.json({ error: 'You can only update your own collectibles' }, { status: 403 });
        }
        const updates: Record<string, any> = {};
        for (const [field, value] of Object.entries(details.fields || {})) {
          if (COLLECTIBLE_UPDATABLE_FIELDS.includes(field)) {
            updates[field] = value;
          }
        }
        if (Object.keys(updates).length === 0) {
          return Response.json({ error: 'No valid collectible fields to update' }, { status: 400 });
        }
        const prev = { ...collectible };
        const updated = await base44.asServiceRole.entities.Collectible.update(collectibleId, updates);
        await logAction('Collectible', collectibleId, collectible.item_name, prev, updates, true);
        return Response.json({
          success: true,
          message: `Updated "${updated.item_name}"`,
          route: `/collectible/${collectibleId}`,
          record_id: collectibleId,
        });
      }

      case 'update_binder': {
        const binderId = details.binder_id;
        if (!binderId) return Response.json({ error: 'Missing binder_id' }, { status: 400 });
        const binder = await safeGet(base44.asServiceRole.entities.CollectionBinder, binderId);
        if (!binder) return Response.json({ error: 'Binder not found' }, { status: 404 });
        if (binder.created_by_id !== user.id) {
          return Response.json({ error: 'You can only update your own binders' }, { status: 403 });
        }
        const updates: Record<string, any> = {};
        for (const [field, value] of Object.entries(details.fields || {})) {
          if (BINDER_UPDATABLE_FIELDS.includes(field)) {
            updates[field] = value;
          }
        }
        if (Object.keys(updates).length === 0) {
          return Response.json({ error: 'No valid binder fields to update' }, { status: 400 });
        }
        const prev = { ...binder };
        const updated = await base44.asServiceRole.entities.CollectionBinder.update(binderId, updates);
        await logAction('CollectionBinder', binderId, binder.name, prev, updates, true);
        return Response.json({
          success: true,
          message: `Updated binder "${updated.name}"`,
          route: `/binder/${binderId}`,
          record_id: binderId,
        });
      }

      case 'add_to_wishlist': {
        const items = details.items || [];
        if (!items.length) return Response.json({ error: 'No items specified' }, { status: 400 });
        const created = await base44.asServiceRole.entities.Watchlist.bulkCreate(
          items.map((item: any) => ({
            user_id: user.id,
            item_name: item.name || item,
            category_name: item.category || '',
            target_price: item.target_price || 0,
            priority: item.priority || 'medium',
            status: 'active',
            alert_type: item.alert_type || 'buy_target',
          }))
        );
        await logAction('Watchlist', null, `${items.length} wishlist items`, null, { count: items.length }, true);
        return Response.json({
          success: true,
          message: `Added ${items.length} item${items.length > 1 ? 's' : ''} to your wishlist`,
          route: '/watchlist',
        });
      }

      case 'mark_for_trade': {
        const ids = details.collectible_ids || [];
        if (!ids.length) return Response.json({ error: 'No items specified' }, { status: 400 });
        for (const id of ids) {
          const c = await safeGet(base44.asServiceRole.entities.Collectible, id);
          if (!c || c.created_by_id !== user.id) {
            return Response.json({ error: `You can only update your own collectibles (failed on ${id})` }, { status: 403 });
          }
        }
        await base44.asServiceRole.entities.Collectible.updateMany(
          { _id: { $in: ids } },
          { $set: { trade_status: details.trade_status || 'trade' } }
        );
        await logAction('Collectible', null, `${ids.length} items marked for trade`, null, { ids, trade_status: details.trade_status || 'trade' }, true);
        return Response.json({
          success: true,
          message: `Marked ${ids.length} item${ids.length > 1 ? 's' : ''} as available for trade`,
          route: '/collection',
        });
      }

      case 'toggle_favorite': {
        const collectibleId = details.collectible_id;
        if (!collectibleId) return Response.json({ error: 'Missing collectible_id' }, { status: 400 });
        const collectible = await safeGet(base44.asServiceRole.entities.Collectible, collectibleId);
        if (!collectible) return Response.json({ error: 'Collectible not found' }, { status: 404 });
        if (collectible.created_by_id !== user.id) {
          return Response.json({ error: 'You can only update your own collectibles' }, { status: 403 });
        }
        const prev = { is_favorite: collectible.is_favorite };
        const updated = await base44.asServiceRole.entities.Collectible.update(collectibleId, {
          is_favorite: !collectible.is_favorite,
        });
        await logAction('Collectible', collectibleId, collectible.item_name, prev, { is_favorite: updated.is_favorite }, true);
        return Response.json({
          success: true,
          message: `${updated.is_favorite ? 'Added to' : 'Removed from'} favorites: "${updated.item_name}"`,
          route: `/collectible/${collectibleId}`,
          record_id: collectibleId,
        });
      }

      case 'toggle_showcase': {
        const collectibleId = details.collectible_id;
        if (!collectibleId) return Response.json({ error: 'Missing collectible_id' }, { status: 400 });
        const collectible = await safeGet(base44.asServiceRole.entities.Collectible, collectibleId);
        if (!collectible) return Response.json({ error: 'Collectible not found' }, { status: 404 });
        if (collectible.created_by_id !== user.id) {
          return Response.json({ error: 'You can only update your own collectibles' }, { status: 403 });
        }
        const prev = { showcase_order: collectible.showcase_order };
        const newOrder = collectible.showcase_order > 0 ? 0 : 1;
        const updated = await base44.asServiceRole.entities.Collectible.update(collectibleId, {
          showcase_order: newOrder,
        });
        await logAction('Collectible', collectibleId, collectible.item_name, prev, { showcase_order: newOrder }, true);
        return Response.json({
          success: true,
          message: `${newOrder > 0 ? 'Added to' : 'Removed from'} showcase: "${updated.item_name}"`,
          route: `/collectible/${collectibleId}`,
          record_id: collectibleId,
        });
      }

      case 'delete_binder': {
        const binderId = details.binder_id;
        if (!binderId) return Response.json({ error: 'Missing binder_id' }, { status: 400 });
        const binder = await safeGet(base44.asServiceRole.entities.CollectionBinder, binderId);
        if (!binder) return Response.json({ error: 'Binder not found' }, { status: 404 });
        if (binder.created_by_id !== user.id) {
          return Response.json({ error: 'You can only delete your own binders' }, { status: 403 });
        }
        const prev = { ...binder };
        // Soft delete — collectibles remain untouched
        await base44.asServiceRole.entities.CollectionBinder.update(binderId, {
          is_deleted: true,
          deleted_date: new Date().toISOString(),
        });
        await logAction('CollectionBinder', binderId, binder.name, prev, { is_deleted: true }, true);
        return Response.json({
          success: true,
          message: `Deleted binder "${binder.name}". Your collectibles were not affected.`,
          route: '/binders',
        });
      }

      case 'navigate': {
        const route = details.route;
        if (!route) return Response.json({ error: 'No route specified' }, { status: 400 });
        // Validate route against the registry
        const routePattern = route.split('/').filter(Boolean);
        const matched = VALID_ROUTES.some(r => {
          const rParts = r.pattern.split('/').filter(Boolean);
          if (rParts.length !== routePattern.length) return false;
          return rParts.every((p, i) => p.startsWith(':') || p === routePattern[i]);
        });
        if (!matched) {
          await logAction('Navigation', null, route, null, null, false, `Invalid route: ${route}`);
          return Response.json({ error: `Invalid route: ${route}` }, { status: 400 });
        }
        return Response.json({
          success: true,
          message: 'Navigating',
          route,
        });
      }

      default:
        return Response.json({ error: `Unknown action type: ${actionType}` }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ error: error.message || 'An error occurred' }, { status: 500 });
  }
}