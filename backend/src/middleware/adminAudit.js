const prisma = require('../config/db');

// Call this from any admin controller after a mutating action succeeds.
// Never skip this for admin actions — it's the only record of who did what.
async function logAdminAction({ actorId, action, targetType, targetId, metadata }) {
  return prisma.adminAuditLog.create({
    data: { actorId, action, targetType, targetId, metadata: metadata || {} },
  });
}

module.exports = { logAdminAction };
