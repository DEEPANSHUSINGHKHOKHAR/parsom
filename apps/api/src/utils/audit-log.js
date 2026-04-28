const { query } = require('../config/db');
const { logger } = require('../config/logger');

async function writeAuditLog({
  actorType = 'system',
  actorId = null,
  actionKey,
  resourceType,
  resourceId = null,
  req = null,
  meta = null,
}) {
  const numericResourceId = Number(resourceId);

  try {
    await query(
      `
        INSERT INTO audit_logs (
          actor_type,
          actor_id,
          action_type,
          entity_type,
          entity_id,
          ip_address,
          user_agent,
          new_values
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        actorType,
        actorId,
        actionKey,
        resourceType,
        Number.isFinite(numericResourceId) && numericResourceId > 0
          ? numericResourceId
          : 0,
        req?.ip || null,
        req?.headers?.['user-agent'] || null,
        meta
          ? JSON.stringify({
              ...meta,
              resourceId: String(resourceId || ''),
            })
          : JSON.stringify({ resourceId: String(resourceId || '') }),
      ]
    );
  } catch (error) {
    logger.error({ err: error, actionKey, resourceType }, 'Audit log write failed');
  }
}

module.exports = {
  writeAuditLog,
};
