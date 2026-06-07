import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';
import mongoose from 'mongoose';

loadEnv({ path: resolve(__dirname, '../.env') });

import { resolveMongoDatabaseName, resolveMongoUri } from '../src/config/mongodb.config';
import { DEFAULT_STUDIO_PLANS } from '../src/studio-billing/constants/default-studio-plans';
import { seedDefaultStudioPlans } from '../src/studio-billing/studio-plans-seed.util';

async function main() {
  const uri = resolveMongoUri();
  const dbName = resolveMongoDatabaseName();
  console.log(`Connecting to MongoDB database: ${dbName}`);

  await mongoose.connect(uri, { dbName });
  const plans = mongoose.connection.collection('studio_plans');

  await seedDefaultStudioPlans(plans);

  for (const plan of DEFAULT_STUDIO_PLANS) {
    console.log(`Upserted plan: ${plan.planId}`);
  }

  await mongoose.disconnect();
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
