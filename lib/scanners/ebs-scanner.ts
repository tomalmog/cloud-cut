import { EC2Client, DescribeVolumesCommand, Volume } from '@aws-sdk/client-ec2';
import { calculateEBSMonthlyCost } from '../aws-pricing';
import { AWSCredentials, createEC2Client } from '../aws-helpers';

export interface EBSFinding {
  resourceType: 'ebs';
  resourceId: string;
  resourceName: string | null;
  region: string;
  issueType: 'unused_volume';
  severity: 'medium' | 'low';
  currentCost: number;
  potentialSaving: number;
  description: string;
  recommendation: string;
  resourceDetails: any;
  metrics: null;
}

/**
 * Get the Name tag from an EBS volume
 */
function getVolumeName(volume: Volume): string | null {
  const nameTag = volume.Tags?.find(tag => tag.Key === 'Name');
  return nameTag?.Value || null;
}

/**
 * Scan for unattached EBS volumes
 */
export async function scanUnattachedEBSVolumes(
  credentials: AWSCredentials,
  region: string = 'us-east-1'
): Promise<EBSFinding[]> {
  const ec2Client = createEC2Client(credentials, region);
  const findings: EBSFinding[] = [];

  try {
    // Get all EBS volumes
    const command = new DescribeVolumesCommand({});
    const response = await ec2Client.send(command);

    if (!response.Volumes) {
      return findings;
    }

    // Check each volume
    for (const volume of response.Volumes) {
      // Only interested in 'available' volumes (not attached)
      if (volume.State !== 'available') {
        continue;
      }

      if (!volume.VolumeId || !volume.VolumeType || !volume.Size) {
        continue;
      }

      const monthlyCost = calculateEBSMonthlyCost(volume.VolumeType, volume.Size);

      // Determine severity based on cost
      const severity = monthlyCost > 10 ? 'medium' : 'low';

      findings.push({
        resourceType: 'ebs',
        resourceId: volume.VolumeId,
        resourceName: getVolumeName(volume),
        region,
        issueType: 'unused_volume',
        severity,
        currentCost: monthlyCost,
        potentialSaving: monthlyCost, // 100% savings if deleted
        description: `${volume.Size}GB ${volume.VolumeType} volume is not attached to any instance`,
        recommendation: 'Create a snapshot for backup, then delete this volume to save costs',
        resourceDetails: volume,
        metrics: null,
      });
    }

    return findings;
  } catch (error: any) {
    console.error('Error scanning EBS volumes:', error);
    throw new Error(`Failed to scan EBS volumes: ${error.message}`);
  }
}
