export type NetworkRate = {
  rate_key: string;
  program: string;
  rate: number;
  apr: number;
  active: boolean;
  sort_order: number;
  updated_at?: string;
};

export const DEFAULT_NETWORK_RATES: NetworkRate[] = [
  { rate_key: "30_fixed", program: "30-Year Fixed", rate: 6.413, apr: 6.425, active: true, sort_order: 1 },
  { rate_key: "30_fha", program: "30-Year FHA", rate: 6.250, apr: 7.273, active: true, sort_order: 2 },
  { rate_key: "15_fixed", program: "15-Year Fixed", rate: 5.897, apr: 5.926, active: true, sort_order: 3 },
];
