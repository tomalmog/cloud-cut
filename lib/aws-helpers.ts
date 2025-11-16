import { STSClient, AssumeRoleCommand, GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import { EC2Client } from '@aws-sdk/client-ec2';
import { RDSClient } from '@aws-sdk/client-rds';
import { CloudWatchClient } from '@aws-sdk/client-cloudwatch';

export interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
}

/**
 * Assume an AWS IAM role and get temporary credentials
 */
export async function assumeRole(roleArn: string, region: string = 'us-east-1'): Promise<AWSCredentials> {
  const stsClient = new STSClient({
    region,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  const command = new AssumeRoleCommand({
    RoleArn: roleArn,
    RoleSessionName: `CloudCut-${Date.now()}`,
    DurationSeconds: 3600, // 1 hour
  });

  try {
    const response = await stsClient.send(command);

    if (!response.Credentials) {
      throw new Error('No credentials returned from AssumeRole');
    }

    return {
      accessKeyId: response.Credentials.AccessKeyId!,
      secretAccessKey: response.Credentials.SecretAccessKey!,
      sessionToken: response.Credentials.SessionToken!,
    };
  } catch (error: any) {
    throw new Error(`Failed to assume role: ${error.message}`);
  }
}

/**
 * Validate that a role ARN is accessible and get the AWS account ID
 */
export async function validateRoleArn(roleArn: string, region: string = 'us-east-1'): Promise<string> {
  const credentials = await assumeRole(roleArn, region);

  const stsClient = new STSClient({
    region,
    credentials,
  });

  const command = new GetCallerIdentityCommand({});
  const response = await stsClient.send(command);

  if (!response.Account) {
    throw new Error('Could not determine AWS account ID');
  }

  return response.Account;
}

/**
 * Create an EC2 client with temporary credentials
 */
export function createEC2Client(credentials: AWSCredentials, region: string = 'us-east-1'): EC2Client {
  return new EC2Client({
    region,
    credentials,
  });
}

/**
 * Create an RDS client with temporary credentials
 */
export function createRDSClient(credentials: AWSCredentials, region: string = 'us-east-1'): RDSClient {
  return new RDSClient({
    region,
    credentials,
  });
}

/**
 * Create a CloudWatch client with temporary credentials
 */
export function createCloudWatchClient(credentials: AWSCredentials, region: string = 'us-east-1'): CloudWatchClient {
  return new CloudWatchClient({
    region,
    credentials,
  });
}

/**
 * Extract AWS account ID from ARN
 */
export function extractAccountIdFromArn(arn: string): string | null {
  const match = arn.match(/arn:aws:iam::(\d+):/);
  return match ? match[1] : null;
}

/**
 * Validate ARN format
 */
export function isValidRoleArn(arn: string): boolean {
  const arnPattern = /^arn:aws:iam::\d{12}:role\/[\w+=,.@-]+$/;
  return arnPattern.test(arn);
}
