import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Check if sender is suspended
    if (user.is_suspended) {
      return Response.json({ error: 'Your account is suspended. You cannot send messages.' }, { status: 403 });
    }

    const body = await req.json();
    const recipientId = body.recipientId;
    const messageBody = (body.body || '').trim();
    const attachedCollectibleId = body.attachedCollectibleId || '';
    const attachedCollectibleName = body.attachedCollectibleName || '';
    const attachedCollectiblePhoto = body.attachedCollectiblePhoto || '';
    const attachedCollectibleValue = body.attachedCollectibleValue || 0;

    if (!recipientId) return Response.json({ error: 'Missing recipient' }, { status: 400 });
    if (!messageBody && !attachedCollectibleId) return Response.json({ error: 'Empty message' }, { status: 400 });
    if (recipientId === user.id) return Response.json({ error: 'Cannot message yourself' }, { status: 400 });

    // Rate limit: max 30 messages per hour
    const recentMessages = await base44.asServiceRole.entities.Message.filter(
      { sender_id: user.id },
      '-created_date',
      30
    );
    if (recentMessages.length >= 30) {
      const oldestRecent = new Date(recentMessages[29].created_date);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (oldestRecent > oneHourAgo) {
        return Response.json({ error: 'Rate limit exceeded. Please wait before sending more messages.' }, { status: 429 });
      }
    }

    // Check blocks in both directions using service role
    const [myBlock, theirBlock] = await Promise.all([
      base44.asServiceRole.entities.UserBlock.filter({ blocker_id: user.id, blocked_id: recipientId }),
      base44.asServiceRole.entities.UserBlock.filter({ blocker_id: recipientId, blocked_id: user.id }),
    ]);

    if (myBlock.length > 0) return Response.json({ error: 'You blocked this user' }, { status: 403 });
    if (theirBlock.length > 0) return Response.json({ error: 'blocked' }, { status: 403 });

    // Check if recipient is suspended
    let recipientUser = null;
    try {
      recipientUser = await base44.asServiceRole.entities.User.get(recipientId);
    } catch (e) {
      // recipient not found — will be caught below
    }
    if (!recipientUser) {
      return Response.json({ error: 'Recipient not found' }, { status: 404 });
    }
    if (recipientUser.is_suspended) {
      return Response.json({ error: 'Recipient account is suspended' }, { status: 403 });
    }

    // Get recipient profile for name/photo
    const profiles = await base44.asServiceRole.entities.CollectorProfile.filter({ user_id: recipientId });
    const recipientProfile = profiles[0];

    // Create message using service role (RLS blocks direct client creation)
    const message = await base44.asServiceRole.entities.Message.create({
      sender_id: user.id,
      recipient_id: recipientId,
      sender_name: user.display_name || user.full_name || '',
      recipient_name: recipientProfile?.display_name || recipientUser?.display_name || '',
      sender_photo: user.profile_photo || '',
      recipient_photo: recipientProfile?.profile_photo || '',
      body: messageBody,
      read: false,
      attached_collectible_id: attachedCollectibleId,
      attached_collectible_name: attachedCollectibleName,
      attached_collectible_photo: attachedCollectiblePhoto,
      attached_collectible_value: attachedCollectibleValue,
    });

    return Response.json({ success: true, message });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}