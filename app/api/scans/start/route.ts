import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { runCompleteScan } from '@/lib/scan-orchestrator';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { awsAccountId } = body;

    if (!awsAccountId) {
      return NextResponse.json(
        { error: 'AWS account ID is required' },
        { status: 400 }
      );
    }

    const result = await runCompleteScan(awsAccountId, userId);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Scan start error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
