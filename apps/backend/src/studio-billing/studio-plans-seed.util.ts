import {
  DEFAULT_STUDIO_PLANS,
  DEPRECATED_PLAN_IDS,
} from './constants/default-studio-plans';

type PlanUpsertStore = {
  updateOne(
    filter: { planId: string },
    update: Record<string, unknown>,
    options?: { upsert?: boolean },
  ): Promise<unknown>;
};

export async function seedDefaultStudioPlans(
  planStore: PlanUpsertStore,
): Promise<void> {
  for (const plan of DEFAULT_STUDIO_PLANS) {
    const now = new Date();
    await planStore.updateOne(
      { planId: plan.planId },
      {
        $set: {
          ...plan,
          limits: plan.limits,
          features: plan.features ?? [],
          version: 1,
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    );
  }

  for (const planId of DEPRECATED_PLAN_IDS) {
    await planStore.updateOne(
      { planId },
      { $set: { isActive: false, updatedAt: new Date() } },
    );
  }
}
