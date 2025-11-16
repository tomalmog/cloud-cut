import { EC2Client, DescribeInstancesCommand, Instance } from '@aws-sdk/client-ec2';
import { CloudWatchClient, GetMetricStatisticsCommand } from '@aws-sdk/client-cloudwatch';
import { calculateEC2MonthlyCost } from '../aws-pricing';
import { AWSCredentials, createEC2Client, createCloudWatchClient } from '../aws-helpers';

export interface EC2Finding {
  resourceType: 'ec2';
  resourceId: string;
  resourceName: string | null;
  region: string;
  issueType: 'idle_instance' | 'oversized_instance';
  severity: 'high' | 'medium' | 'low';
  currentCost: number;
  potentialSaving: number;
  description: string;
  recommendation: string;
  resourceDetails: any;
  metrics: any;
}

/**
 * Get the Name tag from an EC2 instance
 */
function getInstanceName(instance: Instance): string | null {
  const nameTag = instance.Tags?.find(tag => tag.Key === 'Name');
  return nameTag?.Value || null;
}

/**
 * Get average CPU utilization for an instance over the past 7 days
 */
async function getAverageCPU(
  cloudWatchClient: CloudWatchClient,
  instanceId: string
): Promise<number> {
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

  const command = new GetMetricStatisticsCommand({
    Namespace: 'AWS/EC2',
    MetricName: 'CPUUtilization',
    Dimensions: [
      {
        Name: 'InstanceId',
        Value: instanceId,
      },
    ],
    StartTime: startTime,
    EndTime: endTime,
    Period: 3600, // 1 hour
    Statistics: ['Average'],
  });

  try {
    const response = await cloudWatchClient.send(command);

    if (!response.Datapoints || response.Datapoints.length === 0) {
      return 0; // No data available
    }

    // Calculate average of all datapoints
    const sum = response.Datapoints.reduce((acc, dp) => acc + (dp.Average || 0), 0);
    return sum / response.Datapoints.length;
  } catch (error) {
    console.error(`Error fetching CPU metrics for ${instanceId}:`, error);
    return 0;
  }
}

/**
 * Scan for idle EC2 instances
 */
export async function scanIdleEC2Instances(
  credentials: AWSCredentials,
  region: string = 'us-east-1'
): Promise<EC2Finding[]> {
  const ec2Client = createEC2Client(credentials, region);
  const cloudWatchClient = createCloudWatchClient(credentials, region);
  const findings: EC2Finding[] = [];

  try {
    // Get all EC2 instances
    const command = new DescribeInstancesCommand({});
    const response = await ec2Client.send(command);

    if (!response.Reservations) {
      return findings;
    }

    // Flatten all instances from all reservations
    const instances: Instance[] = [];
    for (const reservation of response.Reservations) {
      if (reservation.Instances) {
        instances.push(...reservation.Instances);
      }
    }

    // Check each running instance
    for (const instance of instances) {
      // Skip terminated, stopped, or stopping instances
      if (instance.State?.Name !== 'running') {
        continue;
      }

      if (!instance.InstanceId || !instance.InstanceType) {
        continue;
      }

      // Get CPU utilization
      const avgCPU = await getAverageCPU(cloudWatchClient, instance.InstanceId);

      // If CPU < 5% for 7 days, mark as idle
      if (avgCPU < 5) {
        const monthlyCost = calculateEC2MonthlyCost(instance.InstanceType);

        findings.push({
          resourceType: 'ec2',
          resourceId: instance.InstanceId,
          resourceName: getInstanceName(instance),
          region,
          issueType: 'idle_instance',
          severity: 'high',
          currentCost: monthlyCost,
          potentialSaving: monthlyCost, // 100% savings if terminated
          description: `Instance has been running with ${avgCPU.toFixed(1)}% average CPU utilization for 7 days`,
          recommendation: 'Consider terminating this instance if it is no longer needed, or stop it to save costs',
          resourceDetails: instance,
          metrics: {
            avgCpu: avgCPU,
            period: '7d',
          },
        });
      }
      // If CPU < 20%, consider it oversized
      else if (avgCPU < 20) {
        const monthlyCost = calculateEC2MonthlyCost(instance.InstanceType);
        // Estimate 50% savings by downsizing
        const potentialSaving = monthlyCost * 0.5;

        findings.push({
          resourceType: 'ec2',
          resourceId: instance.InstanceId,
          resourceName: getInstanceName(instance),
          region,
          issueType: 'oversized_instance',
          severity: 'medium',
          currentCost: monthlyCost,
          potentialSaving,
          description: `Instance is running with ${avgCPU.toFixed(1)}% average CPU, which may indicate it's oversized`,
          recommendation: 'Consider downsizing to a smaller instance type to reduce costs',
          resourceDetails: instance,
          metrics: {
            avgCpu: avgCPU,
            period: '7d',
          },
        });
      }
    }

    return findings;
  } catch (error: any) {
    console.error('Error scanning EC2 instances:', error);
    throw new Error(`Failed to scan EC2 instances: ${error.message}`);
  }
}
