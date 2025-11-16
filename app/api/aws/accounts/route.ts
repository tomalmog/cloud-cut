import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const accounts = await prisma.awsAccount.findMany({
      where: { userId },
      orderBy: { connectedAt: 'desc' },
    });

    return NextResponse.json({ accounts });
  } catch (error: any) {
    console.error('Error fetching AWS accounts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
