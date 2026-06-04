/**
 * Seed default Studio plans (idempotent by planId).
 *
 *   node scripts/seed-studio-plans.mjs
 *
 * Set PADDLE_* price IDs in Mongo or via super-admin API after creating products in Paddle.
 */
import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DB_NAME || 'actocore_dev';

const plans = [
  {
    planId: 'free',
    level: 'free',
    order: 0,
    name: 'Free',
    description: 'Try ActoCore Studio',
    isActive: true,
    trialDays: 0,
    pricing: { USD: { monthly: 0, yearly: 0 } },
    limits: { maxProjects: 1, maxTeamSeats: 1, monthlyChatQuota: 500 },
  },
  {
    planId: 'starter',
    level: 'starter',
    order: 1,
    name: 'Starter',
    description: 'For small teams',
    isActive: true,
    trialDays: 14,
    pricing: { USD: { monthly: 29, yearly: 290 } },
    paddleProductId: process.env.PADDLE_PRODUCT_STARTER || '',
    paddlePriceIds: {
      monthly: process.env.PADDLE_PRICE_STARTER_MONTHLY || '',
      yearly: process.env.PADDLE_PRICE_STARTER_YEARLY || '',
    },
    limits: { maxProjects: 3, maxTeamSeats: 5, monthlyChatQuota: 10_000 },
  },
  {
    planId: 'pro',
    level: 'pro',
    order: 2,
    name: 'Pro',
    description: 'Growing products',
    isActive: true,
    trialDays: 14,
    pricing: { USD: { monthly: 79, yearly: 790 } },
    paddleProductId: process.env.PADDLE_PRODUCT_PRO || '',
    paddlePriceIds: {
      monthly: process.env.PADDLE_PRICE_PRO_MONTHLY || '',
      yearly: process.env.PADDLE_PRICE_PRO_YEARLY || '',
    },
    limits: { maxProjects: 10, maxTeamSeats: 20, monthlyChatQuota: 100_000 },
  },
  {
    planId: 'premium',
    level: 'premium',
    order: 3,
    name: 'Premium',
    description: 'High volume',
    isActive: true,
    trialDays: 14,
    pricing: { USD: { monthly: 199, yearly: 1990 } },
    paddleProductId: process.env.PADDLE_PRODUCT_PREMIUM || '',
    paddlePriceIds: {
      monthly: process.env.PADDLE_PRICE_PREMIUM_MONTHLY || '',
      yearly: process.env.PADDLE_PRICE_PREMIUM_YEARLY || '',
    },
    limits: { maxProjects: 50, maxTeamSeats: 100, monthlyChatQuota: 1_000_000 },
  },
];

async function main() {
  await mongoose.connect(uri, { dbName });
  const col = mongoose.connection.collection('studio_plans');

  for (const plan of plans) {
    const now = new Date();
    await col.updateOne(
      { planId: plan.planId },
      {
        $set: { ...plan, version: 1, updatedAt: now },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    );
    console.log(`Upserted plan: ${plan.planId}`);
  }

  await mongoose.disconnect();
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
