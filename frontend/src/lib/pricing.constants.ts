export const PLAN_PRICES = {
  STARTER:    { MONTHLY: 3000,  QUARTERLY: 8500,  YEARLY: 30000  },
  PRO:        { MONTHLY: 7000,  QUARTERLY: 19500, YEARLY: 72000  },
  ENTERPRISE: { MONTHLY: 15000, QUARTERLY: 42000, YEARLY: 150000 },
} as const;

export type Plan = keyof typeof PLAN_PRICES;
export type BillingPeriod = keyof typeof PLAN_PRICES['STARTER'];
