import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getScanResults } from '@/lib/scan-orchestrator';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const scanId = params.id;

    const scan = await getScanResults(scanId, userId);

    return NextResponse.json({ scan });
  } catch (error: any) {
    console.error('Error fetching scan results:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
