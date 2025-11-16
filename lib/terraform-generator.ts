import { formatCurrency } from './aws-pricing';

export interface Finding {
  resourceType: string;
  resourceId: string;
  resourceName: string | null;
  region: string;
  issueType: string;
  currentCost: number;
  potentialSaving: number;
  description: string;
  recommendation: string;
  resourceDetails: any;
}

/**
 * Generate Terraform code for an EC2 idle instance finding
 */
function generateEC2IdleTerraform(finding: Finding): string {
  const instanceId = finding.resourceId;
  const safeId = instanceId.replace(/-/g, '_');

  return `# CloudCut: Terminate idle instance ${instanceId}
# ${finding.description}
# Current cost: ${formatCurrency(finding.currentCost)}/month | Savings: ${formatCurrency(finding.potentialSaving)}/month

# OPTION 1: Stop the instance (can be restarted if needed)
# To use this option, first import the existing instance:
# terraform import aws_instance.idle_instance_${safeId} ${instanceId}

resource "aws_instance" "idle_instance_${safeId}" {
  # After importing, apply this configuration to stop the instance
  # Note: This is a simplified example. You'll need to add all required attributes
  # after importing to match your existing instance configuration.

  # To stop: uncomment the lifecycle block below
  # lifecycle {
  #   prevent_destroy = false
  # }

  # Then run: aws ec2 stop-instances --instance-ids ${instanceId} --region ${finding.region}
}

# OPTION 2: Terminate immediately (more aggressive)
# Uncomment to destroy:
# terraform {
#   # Ensure you have a backup or snapshot before running this!
# }
#
# resource "null_resource" "terminate_${safeId}" {
#   provisioner "local-exec" {
#     command = "aws ec2 terminate-instances --instance-ids ${instanceId} --region ${finding.region}"
#   }
# }

# RECOMMENDED: Create AMI backup before termination
# resource "null_resource" "backup_${safeId}" {
#   provisioner "local-exec" {
#     command = "aws ec2 create-image --instance-id ${instanceId} --name 'CloudCut-Backup-${instanceId}-\${timestamp()}' --region ${finding.region}"
#   }
# }
`;
}

/**
 * Generate Terraform code for an RDS idle database finding
 */
function generateRDSIdleTerraform(finding: Finding): string {
  const dbId = finding.resourceId;
  const safeId = dbId.replace(/-/g, '_');

  return `# CloudCut: Delete idle RDS database ${dbId}
# ${finding.description}
# Current cost: ${formatCurrency(finding.currentCost)}/month | Savings: ${formatCurrency(finding.potentialSaving)}/month

# STEP 1: Create final snapshot (REQUIRED before deletion)
resource "aws_db_snapshot" "final_snapshot_${safeId}" {
  db_instance_identifier = "${dbId}"
  db_snapshot_identifier = "cloudcut-final-snapshot-${dbId}-\${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  tags = {
    Name        = "CloudCut Final Snapshot - ${dbId}"
    CreatedBy   = "CloudCut"
    DeleteAfter = "\${formatdate("YYYY-MM-DD", timeadd(timestamp(), "2160h"))}" # 90 days
  }
}

# STEP 2: Delete the database instance
# Uncomment after snapshot is created:
# resource "aws_db_instance" "delete_${safeId}" {
#   # First import: terraform import aws_db_instance.delete_${safeId} ${dbId}
#   # Then set skip_final_snapshot and apply to delete
#
#   identifier = "${dbId}"
#   skip_final_snapshot = false
#   final_snapshot_identifier = "cloudcut-final-${dbId}-\${formatdate("YYYY-MM-DD-hhmm", timestamp())}"
#
#   # Add other required attributes from your current configuration
#   # Then run: terraform destroy -target=aws_db_instance.delete_${safeId}
# }

# ALTERNATIVE: Use AWS CLI to delete with final snapshot
# resource "null_resource" "delete_rds_${safeId}" {
#   depends_on = [aws_db_snapshot.final_snapshot_${safeId}]
#
#   provisioner "local-exec" {
#     command = <<-EOT
#       aws rds delete-db-instance \\
#         --db-instance-identifier ${dbId} \\
#         --final-db-snapshot-identifier cloudcut-final-${dbId}-$(date +%Y%m%d%H%M) \\
#         --region ${finding.region}
#     EOT
#   }
# }
`;
}

/**
 * Generate Terraform code for an EBS unattached volume finding
 */
function generateEBSUnusedTerraform(finding: Finding): string {
  const volumeId = finding.resourceId;
  const safeId = volumeId.replace(/-/g, '_');

  return `# CloudCut: Delete unattached EBS volume ${volumeId}
# ${finding.description}
# Current cost: ${formatCurrency(finding.currentCost)}/month | Savings: ${formatCurrency(finding.potentialSaving)}/month

# STEP 1: Create snapshot before deletion (recommended)
resource "aws_ebs_snapshot" "backup_${safeId}" {
  volume_id   = "${volumeId}"
  description = "CloudCut backup before deletion - ${volumeId}"

  tags = {
    Name        = "CloudCut Backup - ${volumeId}"
    CreatedBy   = "CloudCut"
    DeleteAfter = "\${formatdate("YYYY-MM-DD", timeadd(timestamp(), "720h"))}" # 30 days
  }
}

# STEP 2: Delete the volume
# Uncomment after snapshot is created:
# resource "null_resource" "delete_volume_${safeId}" {
#   depends_on = [aws_ebs_snapshot.backup_${safeId}]
#
#   provisioner "local-exec" {
#     command = "aws ec2 delete-volume --volume-id ${volumeId} --region ${finding.region}"
#   }
# }

# ALTERNATIVE: Delete immediately without snapshot (not recommended)
# resource "null_resource" "delete_volume_immediate_${safeId}" {
#   provisioner "local-exec" {
#     command = "aws ec2 delete-volume --volume-id ${volumeId} --region ${finding.region}"
#   }
# }
`;
}

/**
 * Generate Terraform code for an EIP unallocated finding
 */
function generateEIPUnusedTerraform(finding: Finding): string {
  const allocationId = finding.resourceId;
  const safeId = allocationId.replace(/-/g, '_');

  return `# CloudCut: Release unused Elastic IP ${allocationId}
# ${finding.description}
# Current cost: ${formatCurrency(finding.currentCost)}/month | Savings: ${formatCurrency(finding.potentialSaving)}/month

# Release the Elastic IP
# WARNING: Once released, you cannot get the same IP address back
resource "null_resource" "release_eip_${safeId}" {
  provisioner "local-exec" {
    command = "aws ec2 release-address --allocation-id ${allocationId} --region ${finding.region}"
  }
}

# ALTERNATIVE: Manage via Terraform resource
# First import: terraform import aws_eip.unused_${safeId} ${allocationId}
# Then destroy: terraform destroy -target=aws_eip.unused_${safeId}
#
# resource "aws_eip" "unused_${safeId}" {
#   # This will be populated after import
# }
`;
}

/**
 * Generate Terraform code for a single finding
 */
export function generateTerraformForFinding(finding: Finding): string {
  if (finding.issueType === 'idle_instance') {
    return generateEC2IdleTerraform(finding);
  } else if (finding.issueType === 'idle_database') {
    return generateRDSIdleTerraform(finding);
  } else if (finding.issueType === 'unused_volume') {
    return generateEBSUnusedTerraform(finding);
  } else if (finding.issueType === 'unused_ip') {
    return generateEIPUnusedTerraform(finding);
  } else if (finding.issueType === 'oversized_instance') {
    // For oversized instances, provide a recommendation but no auto-fix
    return `# CloudCut: Consider downsizing instance ${finding.resourceId}
# ${finding.description}
# Current cost: ${formatCurrency(finding.currentCost)}/month | Potential savings: ${formatCurrency(finding.potentialSaving)}/month
#
# This instance may be oversized for its workload.
# Manual action required: Review the instance type and consider downsizing.
#
# Current type: ${finding.resourceDetails?.InstanceType || 'unknown'}
# Recommendation: ${finding.recommendation}
`;
  }

  return `# CloudCut: ${finding.issueType} - ${finding.resourceId}
# ${finding.description}
# No automatic Terraform fix available for this finding type.
`;
}

/**
 * Generate a complete Terraform file with all findings
 */
export function generateCompleteTerraformFile(findings: Finding[]): string {
  const header = `# CloudCut - AWS Cost Optimization Terraform Configuration
# Generated on: ${new Date().toISOString()}
#
# IMPORTANT: Review this file carefully before applying!
# - Always create backups (snapshots, AMIs) before destroying resources
# - Test in a non-production environment first
# - Uncomment the sections you want to apply
#
# Total findings: ${findings.length}
# Total potential monthly savings: ${formatCurrency(
    findings.reduce((sum, f) => sum + f.potentialSaving, 0)
  )}

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Configure the AWS Provider
# Update the region as needed
provider "aws" {
  region = "us-east-1"
}

# ========================================
# FINDINGS
# ========================================

`;

  const terraformSections = findings.map((finding, index) => {
    return `
# ----------------------------------------
# Finding #${index + 1}: ${finding.issueType}
# Resource: ${finding.resourceType} - ${finding.resourceId}
# ----------------------------------------

${generateTerraformForFinding(finding)}
`;
  });

  const footer = `
# ========================================
# INSTRUCTIONS
# ========================================
#
# 1. Review each section above
# 2. Uncomment the resources you want to apply
# 3. Run: terraform init
# 4. Run: terraform plan
# 5. Review the plan carefully
# 6. Run: terraform apply
#
# For manual cleanup via AWS CLI, you can also use the commands in comments above.
`;

  return header + terraformSections.join('\n') + footer;
}

/**
 * Generate a README file with instructions
 */
export function generateTerraformReadme(): string {
  return `# CloudCut Terraform Configuration

This directory contains Terraform configuration files generated by CloudCut to help you optimize your AWS costs.

## Before You Begin

**IMPORTANT**: These Terraform configurations will destroy AWS resources. Always ensure you have:

1. Backups of any important data
2. Snapshots of EBS volumes
3. AMIs of EC2 instances
4. Final snapshots of RDS databases
5. Tested in a non-production environment first

## How to Use

### Option 1: Apply All Fixes

\`\`\`bash
# Initialize Terraform
terraform init

# Review what will be changed
terraform plan

# Apply the changes
terraform apply
\`\`\`

### Option 2: Apply Specific Fixes

Edit the \`main.tf\` file and uncomment only the resources you want to apply, then:

\`\`\`bash
terraform init
terraform plan
terraform apply
\`\`\`

### Option 3: Manual AWS CLI

Instead of Terraform, you can use the AWS CLI commands included in the comments of each resource.

## Rollback

If you need to rollback:

1. For EC2 instances: You can restart stopped instances or restore from AMI
2. For RDS: Restore from the final snapshot
3. For EBS: Restore from snapshot
4. For Elastic IPs: You cannot get the same IP back once released

## Support

For issues or questions, please refer to the CloudCut documentation or contact support.

## Generated By

CloudCut - AWS Cost Optimization Tool
Generated on: ${new Date().toISOString()}
`;
}
