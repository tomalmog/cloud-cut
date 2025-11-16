'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Play, Loader2 } from 'lucide-react';

interface AwsAccount {
  id: string;
  accountName: string;
  accountId: string;
  region: string;
  connectedAt: string;
  lastScannedAt: string | null;
}

export default function AccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<AwsAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanningAccountId, setScanningAccountId] = useState<string | null>(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/aws/accounts');
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const startScan = async (accountId: string) => {
    setScanningAccountId(accountId);
    try {
      const response = await fetch('/api/scans/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ awsAccountId: accountId }),
      });

      if (response.ok) {
        const data = await response.json();
        // Redirect to scan results page
        router.push(`/dashboard/scans/${data.scanId}`);
      } else {
        const data = await response.json();
        alert(`Failed to start scan: ${data.error}`);
      }
    } catch (error) {
      console.error('Error starting scan:', error);
      alert('An error occurred while starting the scan');
    } finally {
      setScanningAccountId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">AWS Accounts</h1>
          <p className="text-gray-600 mt-1">
            Manage your connected AWS accounts and run cost optimization scans
          </p>
        </div>
        <Link href="/dashboard/connect-aws">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Connect Account
          </Button>
        </Link>
      </div>

      {/* Accounts List */}
      {accounts.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Connected Accounts</CardTitle>
            <CardDescription>
              {accounts.length} AWS {accounts.length === 1 ? 'account' : 'accounts'} connected
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account Name</TableHead>
                  <TableHead>Account ID</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Last Scanned</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">{account.accountName}</TableCell>
                    <TableCell>{account.accountId}</TableCell>
                    <TableCell>{account.region}</TableCell>
                    <TableCell>
                      {account.lastScannedAt
                        ? new Date(account.lastScannedAt).toLocaleString()
                        : 'Never'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => startScan(account.id)}
                        disabled={scanningAccountId === account.id}
                      >
                        {scanningAccountId === account.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Starting...
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Scan Now
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <h3 className="text-xl font-semibold mb-2">No AWS Accounts Connected</h3>
            <p className="text-gray-600 mb-6 text-center max-w-md">
              Connect your first AWS account to start finding cost optimization opportunities
            </p>
            <Link href="/dashboard/connect-aws">
              <Button size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Connect AWS Account
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
