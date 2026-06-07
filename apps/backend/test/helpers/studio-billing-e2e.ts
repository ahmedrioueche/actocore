import type { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { DEFAULT_STUDIO_PLANS } from '../../src/studio-billing/constants/default-studio-plans';
import { StudioPlanModel } from '../../src/studio-billing/schemas/billing.schema';

export async function seedStudioPlansForE2e(app: INestApplication): Promise<void> {
  const planModel = app.get(getModelToken(StudioPlanModel.name));

  for (const plan of DEFAULT_STUDIO_PLANS) {
    const paypalPlanIds =
      plan.planId === 'starter'
        ? {
            monthly: 'P-TEST-STARTER-MONTHLY',
            yearly: 'P-TEST-STARTER-YEARLY',
          }
        : plan.planId === 'pro'
          ? {
              monthly: 'P-TEST-PRO-MONTHLY',
              yearly: 'P-TEST-PRO-YEARLY',
            }
          : plan.paypalPlanIds;

    await planModel.updateOne(
      { planId: plan.planId },
      {
        $set: {
          ...plan,
          paypalPlanIds,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true },
    );
  }
}
