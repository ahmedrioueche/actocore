/**
 * Creates PayPal catalog product + billing plans and prints env vars for studio_plans seed.
 *
 * Usage: npm run seed:paypal-catalog (from apps/backend)
 * Requires: PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET
 */
import 'dotenv/config';
import axios from 'axios';
import { randomUUID } from 'crypto';

const API_BASE =
  process.env.PAYPAL_API_BASE_URL ?? 'https://api-m.sandbox.paypal.com';

async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET are required');
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await axios.post(
    `${API_BASE}/v1/oauth2/token`,
    'grant_type=client_credentials',
    {
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    },
  );
  return response.data.access_token as string;
}

async function createProduct(token: string): Promise<string> {
  const existing = process.env.PAYPAL_PRODUCT_ID?.trim();
  if (existing) {
    console.log(`Using existing PAYPAL_PRODUCT_ID=${existing}`);
    return existing;
  }

  const response = await axios.post(
    `${API_BASE}/v1/catalogs/products`,
    {
      name: 'ActoCore Studio',
      description: 'AI assistant platform for your product',
      type: 'SERVICE',
      category: 'SOFTWARE',
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': randomUUID(),
      },
    },
  );
  const productId = response.data.id as string;
  console.log(`PAYPAL_PRODUCT_ID=${productId}`);
  return productId;
}

async function createPlan(
  token: string,
  productId: string,
  name: string,
  amount: string,
  intervalUnit: 'MONTH' | 'YEAR',
  trialDays = 0,
): Promise<string> {
  const billingCycles: Record<string, unknown>[] = [];
  let sequence = 1;

  if (trialDays > 0) {
    billingCycles.push({
      frequency: { interval_unit: 'DAY', interval_count: trialDays },
      tenure_type: 'TRIAL',
      sequence,
      total_cycles: 1,
      pricing_scheme: {
        fixed_price: { value: '0', currency_code: 'USD' },
      },
    });
    sequence += 1;
  }

  billingCycles.push({
    frequency: {
      interval_unit: intervalUnit,
      interval_count: 1,
    },
    tenure_type: 'REGULAR',
    sequence,
    total_cycles: 0,
    pricing_scheme: {
      fixed_price: { value: amount, currency_code: 'USD' },
    },
  });

  const response = await axios.post(
    `${API_BASE}/v1/billing/plans`,
    {
      product_id: productId,
      name,
      description: name,
      billing_cycles: billingCycles,
      payment_preferences: {
        auto_bill_outstanding: true,
        payment_failure_threshold: 3,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': randomUUID(),
      },
    },
  );

  const planId = response.data.id as string;
  const status = response.data.status as string | undefined;
  if (status !== 'ACTIVE') {
    try {
      await axios.post(
        `${API_BASE}/v1/billing/plans/${planId}/activate`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );
    } catch (error) {
      if (!axios.isAxiosError(error) || error.response?.status !== 422) {
        throw error;
      }
      console.warn(`Plan ${planId} activate skipped (may already be active)`);
    }
  }
  return planId;
}

async function main(): Promise<void> {
  const token = await getAccessToken();
  const productId = await createProduct(token);

  const starterMonthly = await createPlan(
    token,
    productId,
    'ActoCore Starter Monthly',
    '29',
    'MONTH',
  );
  const starterYearly = await createPlan(
    token,
    productId,
    'ActoCore Starter Yearly',
    '290',
    'YEAR',
  );
  const proMonthly = await createPlan(
    token,
    productId,
    'ActoCore Pro Monthly',
    '79',
    'MONTH',
  );
  const proYearly = await createPlan(
    token,
    productId,
    'ActoCore Pro Yearly',
    '790',
    'YEAR',
  );

  console.log('\nAdd these to your .env:\n');
  console.log(`PAYPAL_PRODUCT_ID=${productId}`);
  console.log(`PAYPAL_PLAN_STARTER_MONTHLY=${starterMonthly}`);
  console.log(`PAYPAL_PLAN_STARTER_YEARLY=${starterYearly}`);
  console.log(`PAYPAL_PLAN_PRO_MONTHLY=${proMonthly}`);
  console.log(`PAYPAL_PLAN_PRO_YEARLY=${proYearly}`);
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
