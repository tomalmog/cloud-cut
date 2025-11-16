'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingDown, AlertCircle, CheckCircle, Plus } from 'lucide-react';

interface AwsAccount {
  id: string;
  accountName: string;
  accountId: string;
  region: string;
  connectedAt: string;
  lastScannedAt: string | null;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [accounts, setAccounts] = useState<AwsAccount[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
        <p className="text-gray-600">
          Manage your AWS accounts and optimize your cloud costs
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected Accounts</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accounts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              AWS accounts connected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Savings Found</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0</div>
            <p className="text-xs text-muted-foreground mt-1">
              Run your first scan to find savings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Cost Reduction</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all scans
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/dashboard/connect-aws">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Plus className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>Connect AWS Account</CardTitle>
                    <CardDescription>
                      Add a new AWS account to scan for cost optimization opportunities
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Link>
          </Card>

          {accounts.length > 0 && (
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <Link href="/dashboard/accounts">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <AlertCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <CardTitle>View All Accounts</CardTitle>
                      <CardDescription>
                        Manage your connected AWS accounts and run scans
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Link>
            </Card>
          )}
        </div>
      </div>

      {/* Connected Accounts */}
      {accounts.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Connected AWS Accounts</h2>
            <Link href="/dashboard/accounts">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accounts.slice(0, 4).map((account) => (
              <Card key={account.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{account.accountName}</CardTitle>
                  <CardDescription>
                    Account ID: {account.accountId} • {account.region}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      {account.lastScannedAt
                        ? `Last scanned: ${new Date(account.lastScannedAt).toLocaleDateString()}`
                        : 'Not scanned yet'}
                    </div>
                    <Link href="/dashboard/accounts">
                      <Button size="sm">Scan Now</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {accounts.length === 0 && (
        <Card className="mt-8">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CloudIcon className="h-16 w-16 text-gray-300 mb-4" />
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
