import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getScanResults } from '@/lib/scan-orchestrator';
import { generateCompleteTerraformFile, generateTerraformReadme } from '@/lib/terraform-generator';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const scanId = params.id;

    const scan = await getScanResults(scanId, userId);

    // Generate Terraform file
    const terraformContent = generateCompleteTerraformFile(scan.findings as any[]);
    const readmeContent = generateTerraformReadme();

    // Return as downloadable file
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format');

    if (format === 'readme') {
      return new NextResponse(readmeContent, {
        headers: {
          'Content-Type': 'text/markdown',
          'Content-Disposition': 'attachment; filename="README.md"',
        },
      });
    }

    return new NextResponse(terraformContent, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': 'attachment; filename="cloudcut-fixes.tf"',
      },
    });
  } catch (error: any) {
    console.error('Error generating Terraform:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
