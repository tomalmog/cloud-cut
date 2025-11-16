import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CloudIcon, DollarSign, Zap, Shield, CheckCircle } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <CloudIcon className="h-8 w-8 text-blue-600" />
          <h1 className="text-2xl font-bold">CloudCut</h1>
        </div>
        <nav className="flex gap-4">
          <Link href="/login">
            <Button variant="ghost">Login</Button>
          </Link>
          <Link href="/signup">
            <Button>Get Started</Button>
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          Find <span className="text-blue-600">$1000s</span> in AWS Waste<br />
          <span className="text-3xl md:text-4xl text-gray-600">in 2 Minutes</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          CloudCut automatically scans your AWS account for idle resources, oversized instances,
          and other cost optimization opportunities. Get actionable Terraform code to fix issues instantly.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/signup">
            <Button size="lg" className="text-lg px-8 py-6">
              Start Free Audit
            </Button>
          </Link>
          <Link href="#how-it-works">
            <Button size="lg" variant="outline" className="text-lg px-8 py-6">
              How It Works
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600">2 min</div>
            <div className="text-gray-600 mt-2">Average scan time</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600">$1,200</div>
            <div className="text-gray-600 mt-2">Average monthly savings</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600">20-40%</div>
            <div className="text-gray-600 mt-2">Typical cost reduction</div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="container mx-auto px-4 py-20 bg-white rounded-lg shadow-lg my-12">
        <h2 className="text-4xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <CardTitle>Connect AWS Account</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Create a read-only IAM role in your AWS account and provide the ARN.
                We never store your credentials or make any changes to your resources.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <CardTitle>Scan for Waste</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                CloudCut analyzes your EC2 instances, RDS databases, EBS volumes, and Elastic IPs.
                Get a detailed report in under 3 minutes.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-blue-600">3</span>
              </div>
              <CardTitle>Download & Apply Fixes</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Download ready-to-use Terraform code to fix issues.
                Review, test, and apply fixes to start saving immediately.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* What We Check */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-12">What We Check</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {[
            {
              title: 'Idle EC2 Instances',
              desc: 'Instances running with <5% CPU utilization for 7+ days',
              icon: <Zap className="h-6 w-6 text-blue-600" />
            },
            {
              title: 'Idle RDS Databases',
              desc: 'Databases with no connections over the past week',
              icon: <DollarSign className="h-6 w-6 text-blue-600" />
            },
            {
              title: 'Unattached EBS Volumes',
              desc: 'Storage volumes not connected to any instance',
              icon: <CheckCircle className="h-6 w-6 text-blue-600" />
            },
            {
              title: 'Unallocated Elastic IPs',
              desc: 'Reserved IP addresses not attached to resources',
              icon: <CheckCircle className="h-6 w-6 text-blue-600" />
            },
            {
              title: 'Oversized Instances',
              desc: 'Resources running at <20% capacity that can be downsized',
              icon: <DollarSign className="h-6 w-6 text-blue-600" />
            },
            {
              title: 'More Coming Soon',
              desc: 'Load balancers, snapshots, and more optimization checks',
              icon: <Zap className="h-6 w-6 text-blue-600" />
            },
          ].map((item, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="mt-1">{item.icon}</div>
                  <div>
                    <CardTitle className="text-xl">{item.title}</CardTitle>
                    <CardDescription className="mt-2 text-base">{item.desc}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Security */}
      <section className="container mx-auto px-4 py-20 bg-gray-50 rounded-lg my-12">
        <div className="max-w-3xl mx-auto text-center">
          <Shield className="h-16 w-16 text-blue-600 mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-6">Security First</h2>
          <div className="text-left space-y-4 text-gray-700">
            <p className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
              <span><strong>Read-Only Access:</strong> CloudCut only requires ReadOnlyAccess policy. We cannot make any changes to your resources.</span>
            </p>
            <p className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
              <span><strong>No Credentials Stored:</strong> We never store your AWS access keys. Only the IAM role ARN is saved.</span>
            </p>
            <p className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
              <span><strong>Temporary Credentials:</strong> All API calls use short-lived STS credentials that expire in 1 hour.</span>
            </p>
            <p className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
              <span><strong>You Stay in Control:</strong> Review all Terraform changes before applying. Nothing happens automatically.</span>
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-4xl font-bold mb-6">Ready to Cut Your Cloud Costs?</h2>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Join hundreds of companies saving thousands per month on AWS costs.
        </p>
        <Link href="/signup">
          <Button size="lg" className="text-lg px-12 py-6">
            Start Your Free Audit
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-gray-600 border-t">
        <p>CloudCut - AWS Cost Optimization Tool</p>
        <p className="mt-2 text-sm">Built to help you save money on cloud infrastructure</p>
      </footer>
    </div>
  );
}
