import { PrismaClient, Prisma } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import {faker} from "@faker-js/faker"

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});


// ─────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────
const categories = [
  {
    name: "T-Shirts",
    slug: "t-shirts",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
  },
  {
    name: "Shirts",
    slug: "shirts",
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400",
  },
  {
    name: "Pants",
    slug: "pants",
    image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400",
  },
  {
    name: "Jackets",
    slug: "jackets",
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400",
  },
  {
    name: "Shoes",
    slug: "shoes",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
  },
  {
    name: "Accessories",
    slug: "accessories",
    image: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=400",
  },
];

// ─────────────────────────────────────────
// PRODUCT IMAGES PER CATEGORY
// ─────────────────────────────────────────
const categoryImages: Record<string, string[]> = {
  "t-shirts": [
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600",
    "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600",
    "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600",
    "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600",
  ],
  shirts: [
    "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600",
    "https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?w=600",
    "https://images.unsplash.com/photo-1603252109303-2751441dd157?w=600",
    "https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?w=600",
  ],
  pants: [
    "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600",
    "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600",
    "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600",
    "https://images.unsplash.com/photo-1604176354204-9268737828e4?w=600",
  ],
  jackets: [
    "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600",
    "https://images.unsplash.com/photo-1548126032-079a0fb0099d?w=600",
    "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600",
    "https://images.unsplash.com/photo-1559551409-dadc959f76b8?w=600",
  ],
  shoes: [
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600",
    "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600",
    "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=600",
    "https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=600",
  ],
  accessories: [
    "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=600",
    "https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=600",
    "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600",
    "https://images.unsplash.com/photo-1625591342274-013866180a78?w=600",
  ],
};

// ─────────────────────────────────────────
// SIZES & COLORS PER CATEGORY
// ─────────────────────────────────────────
const categorySizes: Record<string, string[]> = {
  "t-shirts": ["XS", "S", "M", "L", "XL", "XXL"],
  shirts:     ["XS", "S", "M", "L", "XL", "XXL"],
  pants:      ["28", "30", "32", "34", "36", "38"],
  jackets:    ["XS", "S", "M", "L", "XL", "XXL"],
  shoes:      ["38", "39", "40", "41", "42", "43", "44", "45"],
  accessories:["One Size"],
};

const colors = [
  "Black", "White", "Navy", "Gray",
  "Red",   "Blue",  "Green","Beige",
];

// ─────────────────────────────────────────
// PRODUCT NAME PREFIXES
// ─────────────────────────────────────────
const productPrefixes: Record<string, string[]> = {
  "t-shirts":   ["Classic", "Premium", "Urban", "Slim Fit", "Oversized", "Vintage"],
  shirts:       ["Formal", "Oxford", "Linen", "Casual", "Business", "Flannel"],
  pants:        ["Slim", "Regular", "Cargo", "Chino", "Jogger", "Straight"],
  jackets:      ["Bomber", "Denim", "Leather", "Puffer", "Windbreaker", "Fleece"],
  shoes:        ["Runner", "Classic", "Sport", "Canvas", "Leather", "Casual"],
  accessories:  ["Leather", "Canvas", "Sport", "Classic", "Premium", "Urban"],
};

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function randomPrice(min: number, max: number): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

function pickRandom<T>(arr: T[], count: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, count);
}

// ─────────────────────────────────────────
// MAIN SEED FUNCTION
// ─────────────────────────────────────────
async function main() {
  console.log("🌱 Starting database seed...\n");

  // ── 1. Clean existing data ──────────────
  console.log("🧹 Cleaning existing data...");
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.orderAddress.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();
  console.log("✅ Cleaned!\n");

  // ── 2. Seed Categories ──────────────────
  console.log("📂 Seeding categories...");
  const createdCategories = await Promise.all(
    categories.map((cat) =>
      prisma.category.create({ data: cat })
    )
  );
  console.log(`✅ Created ${createdCategories.length} categories\n`);

  // ── 3. Seed Products ────────────────────
  console.log("👕 Seeding products...");
  const createdProducts = [];

  for (const category of createdCategories) {
    const prefixes = productPrefixes[category.slug] || ["Classic"];
    const sizes    = categorySizes[category.slug]   || ["S", "M", "L"];
    const images   = categoryImages[category.slug]  || [];

    // 8 products per category = 48 total
    for (let i = 0; i < 8; i++) {
      const prefix    = prefixes[i % prefixes.length];
      const colorName = colors[i % colors.length];
      const name      = `${prefix} ${category.name.slice(0, -1)} ${colorName}`;
      const baseSlug  = slugify(name);
      const slug      = `${baseSlug}-${faker.string.alphanumeric(4)}`;
      const price     = randomPrice(15, 150);
      const hasDiscount = Math.random() > 0.5;

      const product = await prisma.product.create({
        data: {
          name,
          slug,
          description: faker.commerce.productDescription(),
          price,
          comparePrice: hasDiscount
            ? parseFloat((price * 1.3).toFixed(2))
            : null,
          images:   images.length > 0 ? images : [
            `https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600`,
          ],
          sizes:    pickRandom(sizes, Math.floor(Math.random() * 3) + 3),
          colors:   pickRandom(colors, Math.floor(Math.random() * 3) + 2),
          stock:    faker.number.int({ min: 5, max: 100 }),
          featured: i < 2, // first 2 of each category are featured
          published: true,
          categoryId: category.id,
        },
      });

      createdProducts.push(product);
    }
  }
  console.log(`✅ Created ${createdProducts.length} products\n`);

  // ── 4. Seed Admin User ──────────────────
  console.log("👤 Seeding admin user...");
  const adminUser = await prisma.user.create({
    data: {
      firebaseId: "admin-firebase-placeholder",
      email:      "admin@aicommerce.com",
      name:       "Admin User",
      avatar:     "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
      role:       "ADMIN",
    },
  });
  console.log(`✅ Created admin: ${adminUser.email}\n`);

  // ── 5. Seed Demo Users ──────────────────
  console.log("👥 Seeding demo users...");
  const demoUsers = await Promise.all(
    Array.from({ length: 5 }).map((_, i) =>
      prisma.user.create({
        data: {
          firebaseId: `demo-firebase-${i + 1}`,
          email:      faker.internet.email(),
          name:       faker.person.fullName(),
          avatar:     `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`,
          role:       "USER",
        },
      })
    )
  );
  console.log(`✅ Created ${demoUsers.length} demo users\n`);

  // ── 6. Seed Reviews ─────────────────────
  console.log("⭐ Seeding reviews...");
  let reviewCount = 0;

  for (const user of demoUsers) {
    // each user reviews 6 random products
    const productsToReview = pickRandom(createdProducts, 6);

    for (const product of productsToReview) {
      await prisma.review.create({
        data: {
          rating:    faker.number.int({ min: 3, max: 5 }),
          comment:   faker.lorem.sentences(2),
          userId:    user.id,
          productId: product.id,
        },
      });
      reviewCount++;
    }
  }
  console.log(`✅ Created ${reviewCount} reviews\n`);

  // ── 7. Seed Cart Items ──────────────────
  console.log("🛒 Seeding cart items...");
  let cartCount = 0;

  for (const user of demoUsers) {
    const cartProducts = pickRandom(createdProducts, 3);

    for (const product of cartProducts) {
      const size  = product.sizes[0];
      const color = product.colors[0];

      // avoid duplicate [userId, productId, size, color]
      await prisma.cartItem.upsert({
        where: {
          userId_productId_size_color: {
            userId:    user.id,
            productId: product.id,
            size,
            color,
          },
        },
        update: {},
        create: {
          userId:    user.id,
          productId: product.id,
          quantity:  faker.number.int({ min: 1, max: 3 }),
          size,
          color,
        },
      });
      cartCount++;
    }
  }
  console.log(`✅ Created ${cartCount} cart items\n`);

  // ── 8. Seed Wishlist ────────────────────
  console.log("❤️  Seeding wishlist items...");
  let wishCount = 0;

  for (const user of demoUsers) {
    const wishProducts = pickRandom(createdProducts, 4);

    for (const product of wishProducts) {
      await prisma.wishlistItem.upsert({
        where: {
          userId_productId: {
            userId:    user.id,
            productId: product.id,
          },
        },
        update: {},
        create: {
          userId:    user.id,
          productId: product.id,
        },
      });
      wishCount++;
    }
  }
  console.log(`✅ Created ${wishCount} wishlist items\n`);

  // ── 9. Summary ──────────────────────────
  console.log("─────────────────────────────────");
  console.log("🎉 Seed complete! Summary:");
  console.log(`   📂 Categories : ${createdCategories.length}`);
  console.log(`   👕 Products   : ${createdProducts.length}`);
  console.log(`   👤 Users      : ${demoUsers.length + 1}`);
  console.log(`   ⭐ Reviews    : ${reviewCount}`);
  console.log(`   🛒 Cart Items : ${cartCount}`);
  console.log(`   ❤️  Wishlist   : ${wishCount}`);
  console.log("─────────────────────────────────");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });