import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { MapPin, Plus, CheckCircle, Clock, AlertCircle, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

let REIMBURSEMENT_RATE = 0.67;

const initRate = async () => {
  try {
    const settings = await base44.entities.AppSettings.list().then(data => data[0]);
    if (settings?.mileage_rate) REIMBURSEMENT_RATE = settings.mileage_rate;
  } catch (error) {
    console.error("Failed to load mileage rate from AppSettings");
  }
};

initRate();

export default function MileageTracking() {
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState("my-records");
  const [formData, setFormData] = useState({
    trip_date: new Date().toISOString().split('T')[0],
    purpose: "Vendor Pickup",
    start_location: "",
    end_location: "",
    miles: "",
    notes: ""
  });

  const queryClient = useQueryClient();

  // Fetch current user
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch {
        return null;
      }
    }
  });

  // Fetch mileage records (staff sees only their own, admins see all)
  const { data: records = [], isLoading } = useQuery({
    queryKey: ['mileageRecords'],
    queryFn: async () => {
      const all = await base44.entities.MileageRecord.list();
      return user?.role === 'admin' ? all : all.filter(r => r.staff_email === user?.email);
    },
    enabled: !!user
  });

  // Create mileage record
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const reimbursement = data.miles * REIMBURSEMENT_RATE;
      return base44.entities.MileageRecord.create({
        ...data,
        staff_name: user?.full_name,
        staff_email: user?.email,
        reimbursement_amount: parseFloat(reimbursement.toFixed(2))
      });
    },
    onSuccess: () => {
      toast.success("Mileage record logged successfully");
      queryClient.invalidateQueries({ queryKey: ['mileageRecords'] });
      setFormData({
        trip_date: new Date().toISOString().split('T')[0],
        purpose: "Vendor Pickup",
        start_location: "",
        end_location: "",
        miles: "",
        notes: ""
      });
      setShowForm(false);
    },
    onError: () => {
      toast.error("Failed to log mileage");
    }
  });

  // Update status (admin only)
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      return base44.entities.MileageRecord.update(id, { 
        status,
        approved_by: user?.email,
        approval_date: new Date().toISOString().split('T')[0]
      });
    },
    onSuccess: () => {
      toast.success("Record updated");
      queryClient.invalidateQueries({ queryKey: ['mileageRecords'] });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.miles || !formData.trip_date) {
      toast.error("Please fill in all required fields");
      return;
    }
    createMutation.mutate(formData);
  };

  const stats = {
    total_miles: records.reduce((sum, r) => sum + (r.miles || 0), 0),
    pending_reimbursement: records
      .filter(r => r.status === 'Pending Review')
      .reduce((sum, r) => sum + (r.reimbursement_amount || 0), 0),
    total_reimbursed: records
      .filter(r => r.status === 'Reimbursed')
      .reduce((sum, r) => sum + (r.reimbursement_amount || 0), 0)
  };

  const statusColor = {
    'Pending Review': 'bg-yellow-100 text-yellow-800',
    'Approved': 'bg-blue-100 text-blue-800',
    'Reimbursed': 'bg-green-100 text-green-800',
    'Rejected': 'bg-red-100 text-red-800'
  };

  const statusIcon = {
    'Pending Review': Clock,
    'Approved': CheckCircle,
    'Reimbursed': CheckCircle,
    'Rejected': AlertCircle
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground mb-2">
              Mileage Tracking
            </h1>
            <p className="font-body text-muted-foreground">
              Log and track mileage for reimbursement
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <Plus className="w-4 h-4" />
            Log Mileage
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Miles</CardTitle>
              <MapPin className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_miles}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Across all trips
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Reimbursement</CardTitle>
              <Clock className="w-4 h-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.pending_reimbursement.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Awaiting approval
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reimbursed</CardTitle>
              <TrendingUp className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.total_reimbursed.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Processed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-lg p-6 mb-8"
          >
            <h2 className="font-heading text-xl font-semibold mb-4">Log New Mileage</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Trip Date *</label>
                  <Input
                    type="date"
                    value={formData.trip_date}
                    onChange={(e) => setFormData({ ...formData, trip_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Purpose *</label>
                  <Select value={formData.purpose} onValueChange={(value) => setFormData({ ...formData, purpose: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Vendor Pickup">Vendor Pickup</SelectItem>
                      <SelectItem value="Supply Run">Supply Run</SelectItem>
                      <SelectItem value="Bank Deposit">Bank Deposit</SelectItem>
                      <SelectItem value="Marketing Event">Marketing Event</SelectItem>
                      <SelectItem value="Staff Training">Staff Training</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Start Location</label>
                  <Input
                    placeholder="e.g., Restaurant"
                    value={formData.start_location}
                    onChange={(e) => setFormData({ ...formData, start_location: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">End Location</label>
                  <Input
                    placeholder="e.g., Vendor Name"
                    value={formData.end_location}
                    onChange={(e) => setFormData({ ...formData, end_location: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Miles *</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.miles}
                    onChange={(e) => setFormData({ ...formData, miles: parseFloat(e.target.value) })}
                    placeholder="0.0"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Reimbursement</label>
                  <div className="flex items-center gap-2 pt-2">
                    <span className="text-lg font-bold">
                      ${((formData.miles || 0) * REIMBURSEMENT_RATE).toFixed(2)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Current rate: ${REIMBURSEMENT_RATE.toFixed(2)}/mile
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Notes</label>
                <Input
                  placeholder="Additional details..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Logging..." : "Log Mileage"}
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Records Table */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my-records">My Records</TabsTrigger>
            {user?.role === 'admin' && (
              <TabsTrigger value="all-records">All Staff</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="my-records" className="mt-6">
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : records.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No mileage records yet. Start logging!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {records.map((record) => {
                  const Icon = statusIcon[record.status];
                  return (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-card border border-border rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{record.purpose}</h3>
                            <Badge className={statusColor[record.status]}>
                              {record.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground text-xs">Date</p>
                              <p className="font-medium">{record.trip_date}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Miles</p>
                              <p className="font-medium">{record.miles}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Route</p>
                              <p className="font-medium text-xs">
                                {record.start_location} → {record.end_location}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Reimbursement</p>
                              <p className="font-bold text-green-600">
                                ${record.reimbursement_amount?.toFixed(2) || "0.00"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {user?.role === 'admin' && (
            <TabsContent value="all-records" className="mt-6">
              {isLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : records.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No records to review</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {records.map((record) => (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-card border border-border rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{record.staff_name}</h3>
                            <span className="text-sm text-muted-foreground">• {record.purpose}</span>
                            <Badge className={statusColor[record.status]}>
                              {record.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 md:grid-cols-5 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground text-xs">Date</p>
                              <p className="font-medium">{record.trip_date}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Miles</p>
                              <p className="font-medium">{record.miles}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Amount</p>
                              <p className="font-bold text-green-600">
                                ${record.reimbursement_amount?.toFixed(2) || "0.00"}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Route</p>
                              <p className="text-xs truncate">{record.start_location}</p>
                            </div>
                          </div>
                        </div>
                        {record.status === 'Pending Review' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatusMutation.mutate({ id: record.id, status: 'Approved' })}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateStatusMutation.mutate({ id: record.id, status: 'Rejected' })}
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}