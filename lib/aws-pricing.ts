// AWS Pricing Reference (US East 1 - On-Demand pricing)
// Last updated: 2024

export const EC2_PRICING: Record<string, number> = {
  // T3 instances (per hour)
  't3.nano': 0.0052,
  't3.micro': 0.0104,
  't3.small': 0.0208,
  't3.medium': 0.0416,
  't3.large': 0.0832,
  't3.xlarge': 0.1664,
  't3.2xlarge': 0.3328,

  // T2 instances
  't2.nano': 0.0058,
  't2.micro': 0.0116,
  't2.small': 0.023,
  't2.medium': 0.0464,
  't2.large': 0.0928,
  't2.xlarge': 0.1856,
  't2.2xlarge': 0.3712,

  // M5 instances
  'm5.large': 0.096,
  'm5.xlarge': 0.192,
  'm5.2xlarge': 0.384,
  'm5.4xlarge': 0.768,
  'm5.8xlarge': 1.536,
  'm5.12xlarge': 2.304,
  'm5.16xlarge': 3.072,
  'm5.24xlarge': 4.608,

  // C5 instances (compute optimized)
  'c5.large': 0.085,
  'c5.xlarge': 0.17,
  'c5.2xlarge': 0.34,
  'c5.4xlarge': 0.68,
  'c5.9xlarge': 1.53,
  'c5.12xlarge': 2.04,
  'c5.18xlarge': 3.06,
  'c5.24xlarge': 4.08,

  // R5 instances (memory optimized)
  'r5.large': 0.126,
  'r5.xlarge': 0.252,
  'r5.2xlarge': 0.504,
  'r5.4xlarge': 1.008,
  'r5.8xlarge': 2.016,
  'r5.12xlarge': 3.024,
  'r5.16xlarge': 4.032,
  'r5.24xlarge': 6.048,
};

export const RDS_PRICING: Record<string, number> = {
  // PostgreSQL/MySQL - db.t3 instances (per hour)
  'db.t3.micro': 0.017,
  'db.t3.small': 0.034,
  'db.t3.medium': 0.068,
  'db.t3.large': 0.136,
  'db.t3.xlarge': 0.272,
  'db.t3.2xlarge': 0.544,

  // db.t2 instances
  'db.t2.micro': 0.018,
  'db.t2.small': 0.036,
  'db.t2.medium': 0.072,
  'db.t2.large': 0.145,
  'db.t2.xlarge': 0.29,
  'db.t2.2xlarge': 0.58,

  // db.m5 instances
  'db.m5.large': 0.192,
  'db.m5.xlarge': 0.384,
  'db.m5.2xlarge': 0.768,
  'db.m5.4xlarge': 1.536,
  'db.m5.8xlarge': 3.072,
  'db.m5.12xlarge': 4.608,
  'db.m5.16xlarge': 6.144,
  'db.m5.24xlarge': 9.216,

  // db.r5 instances
  'db.r5.large': 0.24,
  'db.r5.xlarge': 0.48,
  'db.r5.2xlarge': 0.96,
  'db.r5.4xlarge': 1.92,
  'db.r5.8xlarge': 3.84,
  'db.r5.12xlarge': 5.76,
  'db.r5.16xlarge': 7.68,
  'db.r5.24xlarge': 11.52,
};

export const STORAGE_PRICING: Record<string, number> = {
  'gp3': 0.08,   // per GB-month
  'gp2': 0.10,   // per GB-month
  'io1': 0.125,  // per GB-month
  'io2': 0.125,  // per GB-month
  'st1': 0.045,  // per GB-month (throughput optimized HDD)
  'sc1': 0.015,  // per GB-month (cold HDD)
  'standard': 0.05, // per GB-month (magnetic)
};

// Elastic IP pricing (per hour when NOT associated)
export const EIP_PRICING = 0.005; // $0.005/hour = ~$3.60/month

// Load Balancer pricing
export const ALB_PRICING = 0.0225; // per hour = ~$16.43/month
export const NLB_PRICING = 0.0225; // per hour = ~$16.43/month
export const CLB_PRICING = 0.025;  // per hour = ~$18.25/month

// Average hours per month (for cost calculations)
export const HOURS_PER_MONTH = 730;

/**
 * Calculate monthly cost for EC2 instance
 */
export function calculateEC2MonthlyCost(
  instanceType: string,
  hoursRunning: number = HOURS_PER_MONTH
): number {
  const hourlyRate = EC2_PRICING[instanceType] || 0;
  return hourlyRate * hoursRunning;
}

/**
 * Calculate monthly cost for RDS instance
 */
export function calculateRDSMonthlyCost(
  instanceClass: string,
  hoursRunning: number = HOURS_PER_MONTH
): number {
  const hourlyRate = RDS_PRICING[instanceClass] || 0;
  return hourlyRate * hoursRunning;
}

/**
 * Calculate monthly cost for EBS volume
 */
export function calculateEBSMonthlyCost(
  volumeType: string,
  sizeGB: number
): number {
  const pricePerGB = STORAGE_PRICING[volumeType] || STORAGE_PRICING['gp3'];
  return pricePerGB * sizeGB;
}

/**
 * Calculate monthly cost for unallocated Elastic IP
 */
export function calculateEIPMonthlyCost(): number {
  return EIP_PRICING * HOURS_PER_MONTH;
}

/**
 * Calculate monthly cost for Load Balancer
 */
export function calculateLoadBalancerMonthlyCost(
  lbType: 'alb' | 'nlb' | 'clb'
): number {
  const hourlyRate =
    lbType === 'alb' ? ALB_PRICING :
    lbType === 'nlb' ? NLB_PRICING :
    CLB_PRICING;
  return hourlyRate * HOURS_PER_MONTH;
}

/**
 * Format currency value
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Calculate savings percentage
 */
export function calculateSavingsPercentage(
  currentCost: number,
  potentialSavings: number
): number {
  if (currentCost === 0) return 0;
  return (potentialSavings / currentCost) * 100;
}

/**
 * Get instance type family (e.g., "t3" from "t3.medium")
 */
export function getInstanceFamily(instanceType: string): string {
  return instanceType.split('.')[0];
}

/**
 * Get instance size (e.g., "medium" from "t3.medium")
 */
export function getInstanceSize(instanceType: string): string {
  return instanceType.split('.')[1] || '';
}

/**
 * Suggest a smaller instance type (for downsizing recommendations)
 */
export function suggestSmallerInstance(instanceType: string): string | null {
  const family = getInstanceFamily(instanceType);
  const size = getInstanceSize(instanceType);

  const sizes = ['nano', 'micro', 'small', 'medium', 'large', 'xlarge', '2xlarge', '4xlarge', '8xlarge', '12xlarge', '16xlarge', '24xlarge'];
  const currentIndex = sizes.indexOf(size);

  if (currentIndex <= 0) return null; // Already smallest or not found

  const smallerSize = sizes[currentIndex - 1];
  return `${family}.${smallerSize}`;
}
