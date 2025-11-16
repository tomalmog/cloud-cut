import { RDSClient, DescribeDBInstancesCommand, DBInstance } from '@aws-sdk/client-rds';
import { CloudWatchClient, GetMetricStatisticsCommand } from '@aws-sdk/client-cloudwatch';
import { calculateRDSMonthlyCost } from '../aws-pricing';
import { AWSCredentials, createRDSClient, createCloudWatchClient } from '../aws-helpers';

export interface RDSFinding {
  resourceType: 'rds';
  resourceId: string;
  resourceName: string | null;
  region: string;
  issueType: 'idle_database';
  severity: 'high' | 'medium' | 'low';
  currentCost: number;
  potentialSaving: number;
  description: string;
  recommendation: string;
  resourceDetails: any;
  metrics: any;
}

/**
 * Get average database connections over the past 7 days
 */
async function getAverageDatabaseConnections(
  cloudWatchClient: CloudWatchClient,
  dbInstanceIdentifier: string
): Promise<number> {
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

  const command = new GetMetricStatisticsCommand({
    Namespace: 'AWS/RDS',
    MetricName: 'DatabaseConnections',
    Dimensions: [
      {
        Name: 'DBInstanceIdentifier',
        Value: dbInstanceIdentifier,
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
    console.error(`Error fetching connection metrics for ${dbInstanceIdentifier}:`, error);
    return 0;
  }
}

/**
 * Scan for idle RDS databases
 */
export async function scanIdleRDSDatabases(
  credentials: AWSCredentials,
  region: string = 'us-east-1'
): Promise<RDSFinding[]> {
  const rdsClient = createRDSClient(credentials, region);
  const cloudWatchClient = createCloudWatchClient(credentials, region);
  const findings: RDSFinding[] = [];

  try {
    // Get all RDS instances
    const command = new DescribeDBInstancesCommand({});
    const response = await rdsClient.send(command);

    if (!response.DBInstances) {
      return findings;
    }

    // Check each database instance
    for (const dbInstance of response.DBInstances) {
      // Skip databases that are not available
      if (dbInstance.DBInstanceStatus !== 'available') {
        continue;
      }

      if (!dbInstance.DBInstanceIdentifier || !dbInstance.DBInstanceClass) {
        continue;
      }

      // Get average connections
      const avgConnections = await getAverageDatabaseConnections(
        cloudWatchClient,
        dbInstance.DBInstanceIdentifier
      );

      // If average connections < 1 (essentially 0), mark as idle
      if (avgConnections < 1) {
        const monthlyCost = calculateRDSMonthlyCost(dbInstance.DBInstanceClass);

        findings.push({
          resourceType: 'rds',
          resourceId: dbInstance.DBInstanceIdentifier,
          resourceName: dbInstance.DBInstanceIdentifier,
          region,
          issueType: 'idle_database',
          severity: 'high',
          currentCost: monthlyCost,
          potentialSaving: monthlyCost, // 100% savings if deleted
          description: `Database has had ${avgConnections.toFixed(2)} average connections over the past 7 days`,
          recommendation: 'Consider taking a final snapshot and deleting this database if it is no longer needed',
          resourceDetails: dbInstance,
          metrics: {
            avgConnections,
            period: '7d',
          },
        });
      }
    }

    return findings;
  } catch (error: any) {
    console.error('Error scanning RDS databases:', error);
    throw new Error(`Failed to scan RDS databases: ${error.message}`);
  }
}
