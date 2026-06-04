import type { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { StudioPlanModel } from '../../src/studio-billing/schemas/billing.schema';

const starterPlan = {
  planId: 'starter',
  level: 'starter',
  order: 1,
  name: 'Starter',
  description: 'E2E',
  isActive: true,
  trialDays: 14,
  pricing: { USD: { monthly: 29, yearly: 290 } },
  limits: { maxProjects: 3, maxTeamSeats: 5, monthlyChatQuota: 10_000 },
};

export async function seedStudioPlansForE2e(app: INestApplication): Promise<void> {
  const planModel = app.get(getModelToken(StudioPlanModel.name));
  await planModel.updateOne(
    { planId: 'starter' },
    { $set: { ...starterPlan, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
    { upsert: true },
  );
}
