import { prisma } from './prisma';
import { assumeRole } from './aws-helpers';
import { scanIdleEC2Instances } from './scanners/ec2-scanner';
import { scanIdleRDSDatabases } from './scanners/rds-scanner';
import { scanUnattachedEBSVolumes } from './scanners/ebs-scanner';
import { scanUnallocatedEIPs } from './scanners/eip-scanner';
import { generateTerraformForFinding } from './terraform-generator';

export interface ScanResult {
  scanId: string;
  status: 'running' | 'completed' | 'failed';
  error?: string;
}

/**
 * Run a complete scan of an AWS account
 */
export async function runCompleteScan(
  awsAccountId: string,
  userId: string
): Promise<ScanResult> {
  try {
    // Get AWS account details
    const awsAccount = await prisma.awsAccount.findUnique({
      where: { id: awsAccountId },
    });

    if (!awsAccount) {
      throw new Error('AWS account not found');
    }

    if (awsAccount.userId !== userId) {
      throw new Error('Unauthorized access to AWS account');
    }

    // Create scan record
    const scan = await prisma.scan.create({
      data: {
        userId,
        awsAccountId,
        status: 'running',
      },
    });

    // Run scan in the background (don't await)
    performScan(scan.id, awsAccount.roleArn, awsAccount.region).catch(async (error) => {
      console.error('Scan failed:', error);
      await prisma.scan.update({
        where: { id: scan.id },
        data: { status: 'failed' },
      });
    });

    return {
      scanId: scan.id,
      status: 'running',
    };
  } catch (error: any) {
    throw new Error(`Failed to start scan: ${error.message}`);
  }
}

/**
 * Perform the actual scanning (runs in background)
 */
async function performScan(
  scanId: string,
  roleArn: string,
  region: string
): Promise<void> {
  try {
    // Assume the role to get temporary credentials
    const credentials = await assumeRole(roleArn, region);

    // Run all scanners in parallel
    const [ec2Findings, rdsFindings, ebsFindings, eipFindings] = await Promise.all([
      scanIdleEC2Instances(credentials, region),
      scanIdleRDSDatabases(credentials, region),
      scanUnattachedEBSVolumes(credentials, region),
      scanUnallocatedEIPs(credentials, region),
    ]);

    // Combine all findings
    const allFindings = [
      ...ec2Findings,
      ...rdsFindings,
      ...ebsFindings,
      ...eipFindings,
    ];

    // Calculate totals
    const totalMonthlyCost = allFindings.reduce((sum, f) => sum + f.currentCost, 0);
    const potentialSavings = allFindings.reduce((sum, f) => sum + f.potentialSaving, 0);
    const savingsPercentage =
      totalMonthlyCost > 0 ? (potentialSavings / totalMonthlyCost) * 100 : 0;

    // Count by type
    const idleInstancesCount = ec2Findings.filter(f => f.issueType === 'idle_instance').length;
    const idleDatabasesCount = rdsFindings.length;
    const unusedVolumesCount = ebsFindings.length;
    const unusedIpsCount = eipFindings.length;

    // Create findings in database
    const findingPromises = allFindings.map(finding => {
      const terraformCode = generateTerraformForFinding(finding as any);

      return prisma.finding.create({
        data: {
          scanId,
          resourceType: finding.resourceType,
          resourceId: finding.resourceId,
          resourceName: finding.resourceName,
          region,
          issueType: finding.issueType,
          severity: finding.severity,
          currentCost: finding.currentCost,
          potentialSaving: finding.potentialSaving,
          description: finding.description,
          recommendation: finding.recommendation,
          resourceDetails: finding.resourceDetails || {},
          metrics: finding.metrics || {},
          terraformCode,
        },
      });
    });

    await Promise.all(findingPromises);

    // Update scan with results
    await prisma.scan.update({
      where: { id: scanId },
      data: {
        status: 'completed',
        totalMonthlyCost,
        potentialSavings,
        savingsPercentage,
        idleInstancesCount,
        idleDatabasesCount,
        unusedVolumesCount,
        unusedIpsCount,
      },
    });

    // Update last scanned timestamp on AWS account
    await prisma.awsAccount.update({
      where: { id: (await prisma.scan.findUnique({ where: { id: scanId } }))!.awsAccountId },
      data: { lastScannedAt: new Date() },
    });

    console.log(`Scan ${scanId} completed successfully. Found ${allFindings.length} findings.`);
  } catch (error: any) {
    console.error(`Scan ${scanId} failed:`, error);
    await prisma.scan.update({
      where: { id: scanId },
      data: { status: 'failed' },
    });
    throw error;
  }
}

/**
 * Get scan status and results
 */
export async function getScanResults(scanId: string, userId: string) {
  const scan = await prisma.scan.findUnique({
    where: { id: scanId },
    include: {
      findings: true,
      awsAccount: true,
    },
  });

  if (!scan) {
    throw new Error('Scan not found');
  }

  if (scan.userId !== userId) {
    throw new Error('Unauthorized access to scan');
  }

  return scan;
}
