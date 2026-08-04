import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch all active price alerts (service role bypasses RLS)
    const alerts = await base44.asServiceRole.entities.PriceAlert.filter({
      status: 'active',
    });

    let triggeredCount = 0;

    for (const alert of alerts) {
      // Fetch the collectible to get its current estimated value
      let collectible;
      try {
        collectible = await base44.asServiceRole.entities.Collectible.get(
          alert.collectible_id
        );
      } catch (e) {
        continue; // collectible may have been deleted
      }

      if (!collectible || collectible.is_deleted) continue;

      const currentValue = collectible.estimated_value || 0;
      const targetValue = alert.target_value;

      const conditionMet =
        alert.direction === 'below'
          ? currentValue <= targetValue
          : currentValue >= targetValue;

      if (conditionMet) {
        // Mark alert as triggered
        await base44.asServiceRole.entities.PriceAlert.update(alert.id, {
          status: 'triggered',
          triggered_date: new Date().toISOString(),
          triggered_value: currentValue,
        });

        // Create in-app notification
        await base44.asServiceRole.entities.Notification.create({
          recipient_id: alert.user_id,
          type: 'price_alert',
          title: `Price Alert: ${alert.collectible_name}`,
          body: `${alert.collectible_name} has reached ${formatCurrency(
            currentValue
          )}, ${alert.direction === 'below' ? 'dropping to or below' : 'meeting or exceeding'} your target of ${formatCurrency(
            targetValue
          )}.`,
          destination_route: `/collectible/${alert.collectible_id}`,
          destination_id: alert.collectible_id,
          icon: '🔔',
        });

        triggeredCount++;
      }
    }

    return Response.json({
      success: true,
      checked: alerts.length,
      triggered: triggeredCount,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}