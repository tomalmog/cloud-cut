import { EC2Client, DescribeAddressesCommand, Address } from '@aws-sdk/client-ec2';
import { calculateEIPMonthlyCost } from '../aws-pricing';
import { AWSCredentials, createEC2Client } from '../aws-helpers';

export interface EIPFinding {
  resourceType: 'eip';
  resourceId: string;
  resourceName: string | null;
  region: string;
  issueType: 'unused_ip';
  severity: 'low';
  currentCost: number;
  potentialSaving: number;
  description: string;
  recommendation: string;
  resourceDetails: any;
  metrics: null;
}

/**
 * Get the Name tag from an Elastic IP
 */
function getEIPName(address: Address): string | null {
  const nameTag = address.Tags?.find(tag => tag.Key === 'Name');
  return nameTag?.Value || null;
}

/**
 * Scan for unallocated Elastic IPs
 */
export async function scanUnallocatedEIPs(
  credentials: AWSCredentials,
  region: string = 'us-east-1'
): Promise<EIPFinding[]> {
  const ec2Client = createEC2Client(credentials, region);
  const findings: EIPFinding[] = [];

  try {
    // Get all Elastic IPs
    const command = new DescribeAddressesCommand({});
    const response = await ec2Client.send(command);

    if (!response.Addresses) {
      return findings;
    }

    // Check each address
    for (const address of response.Addresses) {
      // Only interested in IPs that are NOT associated with an instance
      // If AssociationId is null/undefined, the IP is not attached
      if (address.AssociationId) {
        continue; // Skip - this IP is in use
      }

      const publicIp = address.PublicIp || address.AllocationId || 'Unknown';
      const monthlyCost = calculateEIPMonthlyCost();

      findings.push({
        resourceType: 'eip',
        resourceId: address.AllocationId || publicIp,
        resourceName: getEIPName(address),
        region,
        issueType: 'unused_ip',
        severity: 'low',
        currentCost: monthlyCost,
        potentialSaving: monthlyCost, // 100% savings if released
        description: `Elastic IP ${publicIp} is allocated but not associated with any instance`,
        recommendation: 'Release this Elastic IP if it is no longer needed',
        resourceDetails: address,
        metrics: null,
      });
    }

    return findings;
  } catch (error: any) {
    console.error('Error scanning Elastic IPs:', error);
    throw new Error(`Failed to scan Elastic IPs: ${error.message}`);
  }
}
