import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, User, CheckCircle, AlertCircle, Trash2, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function PostedShifts() {
  const [activeTab, setActiveTab] = useState("available");
  const [filterReason, setFilterReason] = useState("all");
  const queryClient = useQueryClient();

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

  // Fetch open shifts
  const { data: openShifts = [], isLoading: loadingOpenShifts } = useQuery({
    queryKey: ['openShifts'],
    queryFn: () => base44.entities.OpenShift.list(),
  });

  // Fetch my posted shifts
  const { data: myPostedShifts = [] } = useQuery({
    queryKey: ['myPostedShifts'],
    queryFn: async () => {
      const all = await base44.entities.OpenShift.list();
      return all.filter(s => s.posted_by_email === user?.email);
    },
    enabled: !!user?.email
  });

  // Fetch shift claims
  const { data: myClaims = [] } = useQuery({
    queryKey: ['myClaims'],
    queryFn: async () => {
      const all = await base44.entities.ShiftClaim.list();
      return all.filter(c => c.claimed_by_email === user?.email);
    },
    enabled: !!user?.email
  });

  // Fetch all claims (admin)
  const { data: allClaims = [] } = useQuery({
    queryKey: ['allClaims'],
    queryFn: () => base44.entities.ShiftClaim.list(),
    enabled: user?.role === 'admin'
  });

  // Claim shift
  const claimMutation = useMutation({
    mutationFn: async (openShift) => {
      return base44.entities.ShiftClaim.create({
        open_shift_id: openShift.id,
        claimed_by: user?.full_name,
        claimed_by_email: user?.email,
        original_owner: openShift.posted_by,
        original_owner_email: openShift.posted_by_email,
        shift_date: openShift.shift_date,
        shift_start_time: openShift.shift_start_time,
        shift_end_time: openShift.shift_end_time,
        claim_date: new Date().toISOString().split('T')[0]
      });
    },
    onSuccess: async (claim) => {
      // Update open shift status
      await base44.entities.OpenShift.update(claim.open_shift_id, { status: 'Claimed' });
      toast.success("Shift claimed! Awaiting admin approval.");
      queryClient.invalidateQueries({ queryKey: ['openShifts', 'myClaims'] });
    },
    onError: () => {
      toast.error("Failed to claim shift");
    }
  });

  // Cancel posted shift
  const cancelMutation = useMutation({
    mutationFn: async (shiftId) => {
      return base44.entities.OpenShift.update(shiftId, { status: 'Cancelled' });
    },
    onSuccess: () => {
      toast.success("Shift cancelled");
      queryClient.invalidateQueries({ queryKey: ['openShifts', 'myPostedShifts'] });
    }
  });

  // Approve claim (admin)
  const approveMutation = useMutation({
    mutationFn: async ({ claimId, openShiftId }) => {
      await base44.entities.ShiftClaim.update(claimId, {
        status: 'Approved',
        approved_by: user?.email,
        approval_date: new Date().toISOString().split('T')[0]
      });
      await base44.entities.OpenShift.update(openShiftId, { status: 'Approved' });
    },
    onSuccess: () => {
      toast.success("Shift swap approved");
      queryClient.invalidateQueries({ queryKey: ['allClaims', 'openShifts'] });
    }
  });

  // Reject claim (admin)
  const rejectMutation = useMutation({
    mutationFn: async ({ claimId, openShiftId }) => {
      await base44.entities.ShiftClaim.update(claimId, {
        status: 'Rejected',
        approved_by: user?.email,
        approval_date: new Date().toISOString().split('T')[0]
      });
      await base44.entities.OpenShift.update(openShiftId, { status: 'Open' });
    },
    onSuccess: () => {
      toast.success("Claim rejected");
      queryClient.invalidateQueries({ queryKey: ['allClaims', 'openShifts'] });
    }
  });

  const availableShifts = openShifts.filter(s => s.status === 'Open' && s.posted_by_email !== user?.email);
  const filteredAvailable = filterReason === 'all' 
    ? availableShifts 
    : availableShifts.filter(s => s.reason === filterReason);

  const statusColor = {
    'Open': 'bg-blue-100 text-blue-800',
    'Claimed': 'bg-yellow-100 text-yellow-800',
    'Approved': 'bg-green-100 text-green-800',
    'Pending Admin Approval': 'bg-orange-100 text-orange-800',
    'Rejected': 'bg-red-100 text-red-800'
  };

  const ShiftCard = ({ shift, showActions, onClaim, onCancel, claimed = false }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-lg p-4"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold">{shift.posted_by}</h3>
          <p className="text-sm text-muted-foreground">{shift.position || 'Shift'}</p>
        </div>
        <Badge className={statusColor[shift.status]}>{shift.status}</Badge>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span>{shift.shift_date}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span>{shift.shift_start_time} - {shift.shift_end_time}</span>
        </div>
        {shift.reason && (
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs">{shift.reason}</span>
          </div>
        )}
      </div>

      {showActions && shift.status === 'Open' && !claimed && (
        <Button
          onClick={() => onClaim(shift)}
          disabled={claimMutation.isPending}
          className="w-full gap-2"
          size="sm"
        >
          <CheckCircle className="w-4 h-4" />
          Claim Shift
        </Button>
      )}

      {onCancel && shift.status === 'Open' && (
        <Button
          onClick={() => onCancel(shift.id)}
          variant="destructive"
          disabled={cancelMutation.isPending}
          className="w-full gap-2"
          size="sm"
        >
          <Trash2 className="w-4 h-4" />
          Cancel Posting
        </Button>
      )}
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="font-heading text-3xl font-bold text-foreground mb-2">Posted Shifts</h1>
        <p className="text-muted-foreground mb-8">
          Browse available shifts or manage your postings
        </p>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="available">Available ({filteredAvailable.length})</TabsTrigger>
            <TabsTrigger value="my-claims">My Claims ({myClaims.length})</TabsTrigger>
            <TabsTrigger value="my-posts">My Postings ({myPostedShifts.length})</TabsTrigger>
            {user?.role === 'admin' && (
              <TabsTrigger value="pending-approval">Pending Approval</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="available" className="mt-6">
            <div className="mb-4">
              <Select value={filterReason} onValueChange={setFilterReason}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by reason..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reasons</SelectItem>
                  <SelectItem value="Personal">Personal</SelectItem>
                  <SelectItem value="Medical">Medical</SelectItem>
                  <SelectItem value="Family">Family</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loadingOpenShifts ? (
              <div className="text-center py-8">Loading...</div>
            ) : filteredAvailable.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No available shifts at the moment</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {filteredAvailable.map(shift => (
                    <ShiftCard
                      key={shift.id}
                      shift={shift}
                      showActions={true}
                      onClaim={claimMutation.mutate}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-claims" className="mt-6">
            {myClaims.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">You haven't claimed any shifts yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {myClaims.map(claim => {
                    const openShift = openShifts.find(s => s.id === claim.open_shift_id);
                    return openShift ? (
                      <div key={claim.id} className="bg-card border border-border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold">{claim.original_owner}</h3>
                            <p className="text-sm text-muted-foreground">{openShift.position || 'Shift'}</p>
                          </div>
                          <Badge className={statusColor[claim.status]}>{claim.status}</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span>{claim.shift_date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span>{claim.shift_start_time} - {claim.shift_end_time}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Claimed: {claim.claim_date}
                          </div>
                        </div>
                      </div>
                    ) : null;
                  })}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-posts" className="mt-6">
            {myPostedShifts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">You haven't posted any shifts yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {myPostedShifts.map(shift => (
                    <ShiftCard
                      key={shift.id}
                      shift={shift}
                      onCancel={shift.status === 'Open' ? cancelMutation.mutate : null}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          {user?.role === 'admin' && (
            <TabsContent value="pending-approval" className="mt-6">
              {allClaims.filter(c => c.status === 'Pending Admin Approval').length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No pending approvals</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {allClaims
                      .filter(c => c.status === 'Pending Admin Approval')
                      .map(claim => (
                        <motion.div
                          key={claim.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-card border border-border rounded-lg p-4"
                        >
                          <div className="mb-3">
                            <h3 className="font-semibold">
                              {claim.original_owner} → {claim.claimed_by}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {claim.shift_date} • {claim.shift_start_time} - {claim.shift_end_time}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => approveMutation.mutate({ claimId: claim.id, openShiftId: claim.open_shift_id })}
                              disabled={approveMutation.isPending}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => rejectMutation.mutate({ claimId: claim.id, openShiftId: claim.open_shift_id })}
                              disabled={rejectMutation.isPending}
                            >
                              Reject
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                  </AnimatePresence>
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}