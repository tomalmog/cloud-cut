'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Loader2, TrendingDown, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface Finding {
  id: string;
  resourceType: string;
  resourceId: string;
  resourceName: string | null;
  issueType: string;
  severity: string;
  currentCost: number;
  potentialSaving: number;
  description: string;
  recommendation: string;
}

interface Scan {
  id: string;
  status: string;
  createdAt: string;
  totalMonthlyCost: number | null;
  potentialSavings: number | null;
  savingsPercentage: number | null;
  idleInstancesCount: number;
  idleDatabasesCount: number;
  unusedVolumesCount: number;
  unusedIpsCount: number;
  findings: Finding[];
  awsAccount: {
    accountName: string;
    accountId: string;
  };
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'high':
      return 'text-red-600 bg-red-50';
    case 'medium':
      return 'text-orange-600 bg-orange-50';
    case 'low':
      return 'text-yellow-600 bg-yellow-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

const getIssueTypeLabel = (issueType: string) => {
  const labels: Record<string, string> = {
    idle_instance: 'Idle Instance',
    idle_database: 'Idle Database',
    unused_volume: 'Unused Volume',
    unused_ip: 'Unused IP',
    oversized_instance: 'Oversized Instance',
  };
  return labels[issueType] || issueType;
};

export default function ScanResultsPage() {
  const params = useParams();
  const scanId = params.id as string;
  const [scan, setScan] = useState<Scan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingTerraform, setDownloadingTerraform] = useState(false);

  useEffect(() => {
    if (scanId) {
      fetchScanResults();
      // Poll for updates if scan is still running
      const interval = setInterval(() => {
        if (scan?.status === 'running') {
          fetchScanResults();
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [scanId, scan?.status]);

  const fetchScanResults = async () => {
    try {
      const response = await fetch(`/api/scans/${scanId}`);
      if (response.ok) {
        const data = await response.json();
        setScan(data.scan);
      } else {
        setError('Failed to load scan results');
      }
    } catch (err) {
      setError('An error occurred while loading scan results');
    } finally {
      setLoading(false);
    }
  };

  const downloadTerraform = async () => {
    setDownloadingTerraform(true);
    try {
      const response = await fetch(`/api/scans/${scanId}/terraform`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'cloudcut-fixes.tf';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      alert('Failed to download Terraform file');
    } finally {
      setDownloadingTerraform(false);
    }
  };

  const downloadReadme = async () => {
    try {
      const response = await fetch(`/api/scans/${scanId}/terraform?format=readme`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'README.md';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      alert('Failed to download README');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !scan) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-12 w-12 text-red-600 mb-4" />
        <p className="text-gray-600">{error || 'Scan not found'}</p>
      </div>
    );
  }

  // Prepare chart data
  const categoryData = [
    { name: 'Idle EC2', value: scan.idleInstancesCount, color: COLORS[0] },
    { name: 'Idle RDS', value: scan.idleDatabasesCount, color: COLORS[1] },
    { name: 'Unused EBS', value: scan.unusedVolumesCount, color: COLORS[2] },
    { name: 'Unused IPs', value: scan.unusedIpsCount, color: COLORS[3] },
  ].filter(item => item.value > 0);

  const savingsByType = scan.findings.reduce((acc, finding) => {
    const type = getIssueTypeLabel(finding.issueType);
    if (!acc[type]) {
      acc[type] = 0;
    }
    acc[type] += finding.potentialSaving;
    return acc;
  }, {} as Record<string, number>);

  const savingsData = Object.entries(savingsByType).map(([name, value]) => ({
    name,
    savings: value,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Scan Results</h1>
          <p className="text-gray-600 mt-1">
            {scan.awsAccount.accountName} ({scan.awsAccount.accountId})
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Scanned on {new Date(scan.createdAt).toLocaleString()}
          </p>
        </div>
        {scan.status === 'completed' && scan.findings.length > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadReadme}>
              <Download className="h-4 w-4 mr-2" />
              README
            </Button>
            <Button onClick={downloadTerraform} disabled={downloadingTerraform}>
              {downloadingTerraform ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download Terraform
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Status */}
      {scan.status === 'running' && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="flex items-center gap-3 py-4">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <div>
              <p className="font-medium text-blue-900">Scan in Progress</p>
              <p className="text-sm text-blue-700">
                This page will update automatically when the scan completes
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {scan.status === 'failed' && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <p className="font-medium text-red-900">Scan Failed</p>
              <p className="text-sm text-red-700">
                An error occurred while scanning your AWS account
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      {scan.status === 'completed' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Monthly Cost</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(scan.totalMonthlyCost || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  For analyzed resources
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Potential Savings</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(scan.potentialSavings || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {(scan.savingsPercentage || 0).toFixed(1)}% reduction
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Issues Found</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{scan.findings.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Cost optimization opportunities
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          {scan.findings.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Issues by Category</CardTitle>
                  <CardDescription>Distribution of findings</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Savings by Type</CardTitle>
                  <CardDescription>Potential monthly savings</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={savingsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Bar dataKey="savings" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Findings Table */}
          {scan.findings.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Detailed Findings</CardTitle>
                <CardDescription>
                  {scan.findings.length} optimization {scan.findings.length === 1 ? 'opportunity' : 'opportunities'} found
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Resource</TableHead>
                      <TableHead>Issue Type</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead className="text-right">Current Cost</TableHead>
                      <TableHead className="text-right">Potential Saving</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scan.findings.map((finding) => (
                      <TableRow key={finding.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{finding.resourceId}</p>
                            {finding.resourceName && (
                              <p className="text-sm text-gray-500">{finding.resourceName}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getIssueTypeLabel(finding.issueType)}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(
                              finding.severity
                            )}`}
                          >
                            {finding.severity}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(finding.currentCost)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {formatCurrency(finding.potentialSaving)}
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
                <CheckCircle className="h-16 w-16 text-green-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Issues Found!</h3>
                <p className="text-gray-600 text-center max-w-md">
                  Great news! We didn't find any obvious cost optimization opportunities in this scan.
                  Your AWS account appears to be well-optimized.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
