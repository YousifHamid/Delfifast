const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Password123!', 12);

  // --- Users ---
  const customer = await prisma.user.upsert({
    where: { phone: '+201000000000' },
    update: {},
    create: {
      fullName: 'Mariam H.',
      phone: '+201000000000',
      passwordHash,
      role: 'CUSTOMER',
    },
  });

  const vendorOwner = await prisma.user.upsert({
    where: { phone: '+201000000001' },
    update: {},
    create: {
      fullName: 'Omar — Midan Kofta House',
      phone: '+201000000001',
      passwordHash,
      role: 'VENDOR_OWNER',
    },
  });

  const marketOwner = await prisma.user.upsert({
    where: { phone: '+201000000002' },
    update: {},
    create: {
      fullName: 'Laila — Nasr City Fresh Market',
      phone: '+201000000002',
      passwordHash,
      role: 'VENDOR_OWNER',
    },
  });

  const superAdmin = await prisma.user.upsert({
    where: { phone: '+201000000009' },
    update: {},
    create: {
      fullName: 'Yousif (Super Admin)',
      phone: '+201000000009',
      passwordHash,
      role: 'SUPER_ADMIN',
    },
  });

  // --- Vendor: Midan Kofta House (restaurant, matches the reference mockup) ---
  const kofta = await prisma.vendor.upsert({
    where: { id: 'seed-vendor-kofta' },
    update: {},
    create: {
      id: 'seed-vendor-kofta',
      name: 'Midan Kofta House',
      type: 'RESTAURANT',
      city: 'Cairo',
      district: 'Nasr City',
      isApproved: true,
      rating: 4.8,
      ratingCount: 1200,
      deliveryFee: 25,
      etaMinLabel: '15-20 MIN',
      coverImageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',
      logoInitial: 'Z',
    },
  });

  await prisma.vendorStaff.upsert({
    where: { userId_vendorId: { userId: vendorOwner.id, vendorId: kofta.id } },
    update: {},
    create: { userId: vendorOwner.id, vendorId: kofta.id, role: 'VENDOR_OWNER' },
  });

  const chargrill = await prisma.category.create({
    data: { vendorId: kofta.id, name: 'Chargrill', sortOrder: 1 },
  });
  const sides = await prisma.category.create({
    data: { vendorId: kofta.id, name: 'Sides', sortOrder: 2 },
  });

  await prisma.product.createMany({
    data: [
      { vendorId: kofta.id, categoryId: chargrill.id, name: 'Charcoal Kofta Plate', description: 'toms, onion, garlic toum, flatbread', price: 145 },
      { vendorId: kofta.id, categoryId: chargrill.id, name: 'Halloumi & Kofta Skewer', description: 'grilled halloumi, sumac onion, lemon', price: 110 },
      { vendorId: kofta.id, categoryId: chargrill.id, name: 'Shish Tawook', description: 'yogurt-marinated, charred, mint', price: 125 },
      { vendorId: kofta.id, categoryId: chargrill.id, name: 'Mixed Grill for Two', description: 'kofta, tawook, ribs, rice, salad', price: 320 },
      { vendorId: kofta.id, categoryId: sides.id, name: 'Tahina & Baladi Bread', description: 'stone-ground sesame, olive oil', price: 35 },
      { vendorId: kofta.id, categoryId: sides.id, name: 'Baba Ghanoush', description: 'smoked aubergine, pomegranate', price: 45 },
    ],
  });

  // --- Vendor: Shurba on 26 (matches the reference mockup) ---
  const shurba = await prisma.vendor.upsert({
    where: { id: 'seed-vendor-shurba' },
    update: {},
    create: {
      id: 'seed-vendor-shurba',
      name: 'Shurba on 26',
      type: 'RESTAURANT',
      city: 'Cairo',
      district: 'Nasr City',
      isApproved: true,
      rating: 4.4,
      ratingCount: 610,
      deliveryFee: 30,
      etaMinLabel: '20-25 MIN',
      coverImageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800',
    },
  });

  const spit = await prisma.category.create({ data: { vendorId: shurba.id, name: 'Spit', sortOrder: 1 } });
  const sweet = await prisma.category.create({ data: { vendorId: shurba.id, name: 'Sweet', sortOrder: 2 } });

  await prisma.product.createMany({
    data: [
      { vendorId: shurba.id, categoryId: spit.id, name: 'Chicken Shawarma Wrap', description: 'toum, fries, pickles', price: 85 },
      { vendorId: shurba.id, categoryId: spit.id, name: 'Beef Shawarma Wrap', description: 'tahina, tomato, parsley', price: 95 },
      { vendorId: shurba.id, categoryId: spit.id, name: 'Shawarma Tray', description: 'rice, salad, two sauces', price: 180 },
      { vendorId: shurba.id, categoryId: sweet.id, name: 'Pistachio Baklava', description: 'four pieces, honey syrup', price: 65 },
    ],
  });

  // --- A preview supermarket vendor, gated behind the feature flag ---
  const market = await prisma.vendor.upsert({
    where: { id: 'seed-vendor-market' },
    update: {},
    create: {
      id: 'seed-vendor-market',
      name: 'Nasr City Fresh Market',
      type: 'SUPERMARKET',
      city: 'Cairo',
      district: 'Nasr City',
      isApproved: true,
      rating: 4.6,
      ratingCount: 340,
      deliveryFee: 20,
      etaMinLabel: '30-40 MIN',
      coverImageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800',
    },
  });

  await prisma.vendorStaff.upsert({
    where: { userId_vendorId: { userId: marketOwner.id, vendorId: market.id } },
    update: {},
    create: { userId: marketOwner.id, vendorId: market.id, role: 'VENDOR_OWNER' },
  });

  const produce = await prisma.category.create({ data: { vendorId: market.id, name: 'Produce', sortOrder: 1 } });
  const dairy = await prisma.category.create({ data: { vendorId: market.id, name: 'Dairy', sortOrder: 2 } });
  const pantry = await prisma.category.create({ data: { vendorId: market.id, name: 'Pantry', sortOrder: 3 } });

  await prisma.product.createMany({
    data: [
      { vendorId: market.id, categoryId: produce.id, name: 'Tomatoes', price: 18, attributes: { weightKg: 1, brand: null } },
      { vendorId: market.id, categoryId: produce.id, name: 'Cucumbers', price: 14, attributes: { weightKg: 1, brand: null } },
      { vendorId: market.id, categoryId: produce.id, name: 'Bananas', price: 22, attributes: { weightKg: 1, brand: null } },
      { vendorId: market.id, categoryId: dairy.id, name: 'Full Cream Milk', price: 45, attributes: { weightKg: 1, brand: 'Juhayna' } },
      { vendorId: market.id, categoryId: dairy.id, name: 'White Cheese', price: 60, attributes: { weightKg: 0.5, brand: 'Domty' } },
      { vendorId: market.id, categoryId: pantry.id, name: 'Basmati Rice', price: 85, attributes: { weightKg: 2, brand: 'Abu Bint' } },
      { vendorId: market.id, categoryId: pantry.id, name: 'Sunflower Oil', price: 95, attributes: { weightKg: 1.5, brand: 'Crystal' } },
    ],
  });

  await prisma.featureFlag.upsert({
    where: { key: 'supermarket_vertical_enabled' },
    update: {},
    create: { key: 'supermarket_vertical_enabled', isEnabled: true },
  });
  await prisma.featureFlag.upsert({
    where: { key: 'card_on_delivery_enabled' },
    update: {},
    create: { key: 'card_on_delivery_enabled', isEnabled: false },
  });

  console.log('Seed complete. Test logins (all use password: Password123!):');
  console.log(`  Customer:      ${customer.phone}`);
  console.log(`  Vendor:        ${vendorOwner.phone}  (Midan Kofta House)`);
  console.log(`  Vendor:        ${marketOwner.phone}  (Nasr City Fresh Market)`);
  console.log(`  Super admin:   ${superAdmin.phone}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
