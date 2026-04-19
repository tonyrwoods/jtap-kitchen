import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  DollarSign, 
  TrendingUp, 
  FileText,
  RefreshCw,
  BarChart3,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OverchargeAlertCard from "@/components/vendor/OverchargeAlertCard";
import { toast } from "sonner";

const THRESHOLDS = {
  HIGH_VARIANCE: 20,
  MEDIUM_VARIANCE: 10,
  LOW_VARIANCE: 5
};

export default function VendorOverchargeAnalysis() {
  const [activeTab, setActiveTab] = useState("overview");
  const [alerts, setAlerts] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const queryClient = useQueryClient();

  // Fetch invoices
  const { data: invoices = [], isLoading: isLoadingInvoices } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.Invoice.list(),
  });

  // Fetch price history
  const { data: priceHistory = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['vendorPriceHistory'],
    queryFn: () => base44.entities.VendorPriceHistory.list(),
  });

  // Run analysis using the agent
  const runAnalysisMutation = useMutation({
    mutationFn: async () => {
      setIsAnalyzing(true);
      // Invoke the AI agent to analyze invoices
      const response = await base44.functions.invoke('analyzeVendorOvercharges', {});
      return response.data;
    },
    onSuccess: (data) => {
      setAlerts(data.alerts || []);
      setIsAnalyzing(false);
      toast.success(`Analysis complete: ${data.alerts?.length || 0} potential overcharges found`);
      queryClient.invalidateQueries({ queryKey: ['vendorPriceHistory'] });
    },
    onError: (error) => {
      setIsAnalyzing(false);
      toast.error(`Analysis failed: ${error.message}`);
    }
  });

  // Dismiss alert
  const dismissAlertMutation = useMutation({
    mutationFn: async (alertId) => {
      setAlerts(prev => prev.filter(a => a.id !== alertId));
    },
    onSuccess: () => {
      toast.success("Alert dismissed");
    }
  });

  // Calculate summary statistics
  const calculateStats = () => {
    const totalAlerts = alerts.length;
    const highSeverity = alerts.filter(a => a.severity === 'high').length;
    const mediumSeverity = alerts.filter(a => a.severity === 'medium').length;
    const totalOvercharge = alerts.reduce((sum, a) => sum + (a.overcharge_amount || 0), 0);
    const avgVariance = alerts.length > 0 
      ? alerts.reduce((sum, a) => sum + (a.variance_percent || 0), 0) / alerts.length 
      : 0;

    return { totalAlerts, highSeverity, mediumSeverity, totalOvercharge, avgVariance };
  };

  const stats = calculateStats();

  // Group alerts by severity
  const getAlertsBySeverity = (severity) => {
    return alerts.filter(a => a.severity === severity);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground mb-2">
              Vendor Overcharge Analysis
            </h1>
            <p className="font-body text-muted-foreground">
              AI-powered detection of pricing anomalies and potential vendor overcharges
            </p>
          </div>
          <Button
            onClick={() => runAnalysisMutation.mutate()}
            disabled={isAnalyzing || isLoadingInvoices || isLoadingHistory}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
              <AlertTriangle className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAlerts}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.highSeverity} high priority
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Severity</CardTitle>
              <AlertCircle className="w-4 h-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.highSeverity}</div>
              <p className="text-xs text-muted-foreground mt-1">
                &gt;{THRESHOLDS.HIGH_VARIANCE}% variance
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Est. Overcharges</CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalOvercharge.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Total potential savings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Variance</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgVariance.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                Across all alerts
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="alerts">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Alerts ({alerts.length})
            </TabsTrigger>
            <TabsTrigger value="history">
              <FileText className="w-4 h-4 mr-2" />
              Price History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Analysis Summary
                </CardTitle>
                <CardDescription>
                  Overview of vendor pricing analysis and recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {alerts.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                    <h3 className="font-heading text-xl font-semibold mb-2">
                      No Overcharges Detected
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      All vendor invoices appear to be within normal pricing ranges.
                    </p>
                    <Button onClick={() => runAnalysisMutation.mutate()}>
                      Run New Analysis
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-sm text-red-800 font-medium">High Priority</p>
                        <p className="text-2xl font-bold text-red-600">{stats.highSeverity}</p>
                        <p className="text-xs text-red-700 mt-1">
                          Immediate review recommended
                        </p>
                      </div>
                      <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                        <p className="text-sm text-orange-800 font-medium">Medium Priority</p>
                        <p className="text-2xl font-bold text-orange-600">{stats.mediumSeverity}</p>
                        <p className="text-xs text-orange-700 mt-1">
                          Review within 7 days
                        </p>
                      </div>
                      <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <p className="text-sm text-yellow-800 font-medium">Low Priority</p>
                        <p className="text-2xl font-bold text-yellow-600">
                          {stats.totalAlerts - stats.highSeverity - stats.mediumSeverity}
                        </p>
                        <p className="text-xs text-yellow-700 mt-1">
                          Monitor for trends
                        </p>
                      </div>
                    </div>

                    <div className="mt-6">
                      <h4 className="font-semibold mb-3">Recommended Actions:</h4>
                      <ul className="space-y-2 text-sm">
                        {stats.highSeverity > 0 && (
                          <li className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                            <span>
                              Contact vendors for high-variance invoices immediately to request clarification or credits
                            </span>
                          </li>
                        )}
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                          <span>
                            Review vendor contracts and negotiate better pricing for frequently overcharged items
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <FileText className="w-4 h-4 text-blue-600 mt-0.5" />
                          <span>
                            Update VendorPriceHistory records with corrected market prices
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            <AnimatePresence>
              {alerts.length > 0 ? (
                <>
                  {getAlertsBySeverity('high').map(alert => (
                    <OverchargeAlertCard
                      key={alert.id}
                      alert={alert}
                      onDismiss={(id) => dismissAlertMutation.mutate(id)}
                      onViewInvoice={(invoiceId) => console.log('View invoice:', invoiceId)}
                    />
                  ))}
                  {getAlertsBySeverity('medium').map(alert => (
                    <OverchargeAlertCard
                      key={alert.id}
                      alert={alert}
                      onDismiss={(id) => dismissAlertMutation.mutate(id)}
                      onViewInvoice={(invoiceId) => console.log('View invoice:', invoiceId)}
                    />
                  ))}
                  {getAlertsBySeverity('low').map(alert => (
                    <OverchargeAlertCard
                      key={alert.id}
                      alert={alert}
                      onDismiss={(id) => dismissAlertMutation.mutate(id)}
                      onViewInvoice={(invoiceId) => console.log('View invoice:', invoiceId)}
                    />
                  ))}
                </>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">
                      No alerts found. Run an analysis to check for overcharges.
                    </p>
                  </CardContent>
                </Card>
              )}
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Vendor Price History</CardTitle>
                <CardDescription>
                  Historical pricing data used for analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                {priceHistory.length > 0 ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {priceHistory.length} price records tracked across {new Set(priceHistory.map(p => p.vendor_name)).size} vendors
                    </p>
                    {/* Add price history table or chart here */}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      No price history records found. Data will be populated as invoices are analyzed.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}