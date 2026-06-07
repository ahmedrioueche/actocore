import type { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { DEFAULT_STUDIO_PLANS } from '../../src/studio-billing/constants/default-studio-plans';
import { StudioPlanModel } from '../../src/studio-billing/schemas/billing.schema';

export async function seedStudioPlansForE2e(app: INestApplication): Promise<void> {
  const planModel = app.get(getModelToken(StudioPlanModel.name));
  const starterPlan = DEFAULT_STUDIO_PLANS.find((plan) => plan.planId === 'starter');
  if (!starterPlan) {
    throw new Error('Starter plan missing from default catalog');
  }

  await planModel.updateOne(
    { planId: 'starter' },
    {
      $set: {
        ...starterPlan,
        paypalPlanIds: {
          monthly: 'P-TEST-STARTER-MONTHLY',
          yearly: 'P-TEST-STARTER-YEARLY',
        },
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true },
  );
}
