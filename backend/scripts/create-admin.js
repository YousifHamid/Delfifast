// Bootstraps the first SUPER_ADMIN account. There is deliberately no public
// API endpoint that can create an admin — that would be a privilege-escalation
// risk. Run this once, directly on the server / via your hosting provider's
// one-off command runner, never expose it over HTTP.
//
// Usage:
//   node scripts/create-admin.js "Full Name" "+201234567890" "a-strong-password"

const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const [, , fullName, phone, password] = process.argv;
  if (!fullName || !phone || !password) {
    console.error('Usage: node scripts/create-admin.js "Full Name" "+201234567890" "a-strong-password"');
    process.exit(1);
  }
  if (password.length < 12) {
    console.error('Use a password of at least 12 characters for an admin account.');
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) {
    console.error(`A user with phone ${phone} already exists (role: ${existing.role}).`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { fullName, phone, passwordHash, role: 'SUPER_ADMIN' },
  });

  console.log(`Created SUPER_ADMIN: ${user.fullName} (${user.phone})`);
  console.log('They will be walked through mandatory 2FA setup on first login to the admin panel.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
