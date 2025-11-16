import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateRoleArn, isValidRoleArn } from '@/lib/aws-helpers';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { roleArn, accountName, region = 'us-east-1' } = body;

    // Validate input
    if (!roleArn || !accountName) {
      return NextResponse.json(
        { error: 'Role ARN and account name are required' },
        { status: 400 }
      );
    }

    // Validate ARN format
    if (!isValidRoleArn(roleArn)) {
      return NextResponse.json(
        { error: 'Invalid role ARN format' },
        { status: 400 }
      );
    }

    // Try to assume the role to validate it
    let awsAccountId: string;
    try {
      awsAccountId = await validateRoleArn(roleArn, region);
    } catch (error: any) {
      return NextResponse.json(
        {
          error: 'Could not assume role. Please check the ARN and trust relationship.',
          details: error.message,
        },
        { status: 400 }
      );
    }

    // Check if this AWS account is already connected
    const existingAccount = await prisma.awsAccount.findFirst({
      where: {
        userId,
        accountId: awsAccountId,
      },
    });

    if (existingAccount) {
      return NextResponse.json(
        { error: 'This AWS account is already connected' },
        { status: 400 }
      );
    }

    // Create AWS account connection
    const awsAccount = await prisma.awsAccount.create({
      data: {
        userId,
        accountId: awsAccountId,
        roleArn,
        accountName,
        region,
      },
    });

    return NextResponse.json({
      success: true,
      account: {
        id: awsAccount.id,
        accountId: awsAccount.accountId,
        accountName: awsAccount.accountName,
        region: awsAccount.region,
        connectedAt: awsAccount.connectedAt,
      },
    });
  } catch (error: any) {
    console.error('AWS connection error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
