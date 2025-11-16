'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';

export default function ConnectAWSPage() {
  const router = useRouter();
  const [roleArn, setRoleArn] = useState('');
  const [accountName, setAccountName] = useState('');
  const [region, setRegion] = useState('us-east-1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/aws/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleArn, accountName, region }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to connect AWS account');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard/accounts');
      }, 2000);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Connect AWS Account</h1>
        <p className="text-gray-600 mt-1">
          Follow the steps below to securely connect your AWS account
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
            <CardDescription>Create a read-only IAM role in your AWS account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div>
                  <p className="font-medium">Go to AWS IAM Console</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Navigate to Roles → Create Role
                  </p>
                  <a
                    href="https://console.aws.amazon.com/iam/home#/roles"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1 mt-2"
                  >
                    Open IAM Console <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium">Select "Another AWS account"</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Choose the trusted entity type
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div>
                  <p className="font-medium">Enter CloudCut Account ID</p>
                  <div className="mt-2 p-2 bg-gray-50 rounded border font-mono text-sm">
                    123456789012
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    This allows CloudCut to assume the role
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                  4
                </div>
                <div>
                  <p className="font-medium">Attach ReadOnlyAccess Policy</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Search for and select: <code className="bg-gray-100 px-1 rounded">ReadOnlyAccess</code>
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                  5
                </div>
                <div>
                  <p className="font-medium">Name the Role</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Example: <code className="bg-gray-100 px-1 rounded">CloudCutReadOnly</code>
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                  6
                </div>
                <div>
                  <p className="font-medium">Copy the Role ARN</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Format: <code className="bg-gray-100 px-1 rounded text-xs">
                      arn:aws:iam::ACCOUNT_ID:role/ROLE_NAME
                    </code>
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium">Security Notice</p>
                  <p className="mt-1">
                    CloudCut only requires ReadOnlyAccess. We never store your AWS credentials
                    and cannot make changes to your resources.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Connection Details</CardTitle>
            <CardDescription>Enter the IAM role information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex gap-2">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <div className="text-sm">{error}</div>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex gap-2">
                  <CheckCircle className="h-5 w-5 flex-shrink-0" />
                  <div className="text-sm">
                    AWS account connected successfully! Redirecting...
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="accountName">Account Name</Label>
                <Input
                  id="accountName"
                  placeholder="Production Account"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  required
                  disabled={loading || success}
                />
                <p className="text-xs text-gray-500">
                  A friendly name to identify this account
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="roleArn">IAM Role ARN</Label>
                <Input
                  id="roleArn"
                  placeholder="arn:aws:iam::123456789012:role/CloudCutReadOnly"
                  value={roleArn}
                  onChange={(e) => setRoleArn(e.target.value)}
                  required
                  disabled={loading || success}
                />
                <p className="text-xs text-gray-500">
                  The ARN of the role you created in step 6
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">AWS Region</Label>
                <select
                  id="region"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  disabled={loading || success}
                >
                  <option value="us-east-1">US East (N. Virginia)</option>
                  <option value="us-east-2">US East (Ohio)</option>
                  <option value="us-west-1">US West (N. California)</option>
                  <option value="us-west-2">US West (Oregon)</option>
                  <option value="eu-west-1">EU (Ireland)</option>
                  <option value="eu-central-1">EU (Frankfurt)</option>
                  <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                  <option value="ap-northeast-1">Asia Pacific (Tokyo)</option>
                </select>
                <p className="text-xs text-gray-500">
                  Primary region to scan
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={loading || success}>
                {loading ? 'Connecting...' : success ? 'Connected!' : 'Connect Account'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
