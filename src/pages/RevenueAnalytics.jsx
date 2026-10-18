import { useState } from "react";
import useRevenueReport from "@/hooks/useRevenueReport";
import useRobotsNoindex from "@/hooks/useRobotsNoindex";
import { motion } from "framer-motion";
import { DollarSign, TrendingUp, Utensils, User, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="font-body text-sm text-muted-foreground">{label}</p>
        <p className="font-heading text-2xl font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}

export default function RevenueAnalytics() {
  useRobotsNoindex();
  const [dateRange, setDateRange] = useState("month");
  const { data: report, isPending: loading, error, refetch, isFetching } = useRevenueReport(dateRange);
  const { totalRevenue = 0, taxCollected = 0, transactions = 0, avgCheckSize = 0, dailyRevenue = [], topItems = [], serverData = [], periodLabel = "" } = report || {};

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-heading text-3xl font-bold text-foreground mb-2">Revenue Analytics</h1>
          <p className="font-body text-sm text-muted-foreground">Track sales performance and dining trends</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div role="alert" className="bg-card border border-destructive/30 rounded-2xl p-6 space-y-3">
            <p className="font-body text-destructive">{error.response?.data?.error || error.message || "Unable to calculate revenue."}</p>
            <button onClick={() => refetch()} disabled={isFetching} className="px-4 py-2 rounded-full border border-border font-body text-sm disabled:opacity-50">{isFetching ? "Recalculating…" : "Try again"}</button>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            {/* Range selector */}
            <div className="flex gap-2">
              {["week", "month", "year"].map(range => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-4 py-2 rounded-full font-body text-sm font-medium transition-all ${
                    dateRange === range
                      ? "bg-primary text-primary-foreground"
                      : "border border-border hover:bg-muted"
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>

            <div className="font-body text-sm text-muted-foreground space-y-1">
              <p>{periodLabel} · America/Chicago · Based on receipt/order creation dates.</p>
              <p>Revenue is paid sales after discounts, before tax. Linked receipts and orders count once; unpaid orders and vendor bills are excluded.</p>
              <p>Tax Collected includes recorded tax only; no tax is estimated for orders without a tax record.</p>
              {transactions === 0 && <p>No paid sales are recorded in this period.</p>}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <StatCard
                icon={DollarSign}
                label="Total Revenue"
                value={`$${totalRevenue.toFixed(2)}`}
                color="bg-primary"
              />
              <StatCard
                icon={Calendar}
                label="Transactions"
                value={transactions}
                color="bg-blue-500"
              />
              <StatCard
                icon={TrendingUp}
                label="Average Check"
                value={`$${avgCheckSize.toFixed(2)}`}
                color="bg-green-500"
              />
              <StatCard
                icon={DollarSign}
                label="Tax Collected"
                value={`$${taxCollected.toFixed(2)}`}
                color="bg-purple-500"
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Revenue Chart */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="font-heading text-lg font-semibold mb-4">Daily Revenue ({periodLabel})</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={value => `$${Number(value).toFixed(2)}`} />
                    <Bar dataKey="revenue" fill="#C89B4F" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Top Items */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="font-heading text-lg font-semibold mb-4">Top 5 Menu Items</h3>
                <div className="space-y-3">
                  {topItems.length > 0 ? (
                    topItems.map((item, i) => (
                      <div key={i} className="flex items-center justify-between pb-3 border-b border-border last:border-0">
                        <div className="flex items-center gap-3">
                          <Utensils className="w-4 h-4 text-primary" />
                          <p className="font-body text-sm font-medium">{item.name}</p>
                        </div>
                        <span className="font-heading font-semibold text-primary">{item.count} sold</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">No order data available</p>
                  )}
                </div>
              </div>
            </div>

            {/* Server Revenue */}
            {serverData.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="font-heading text-lg font-semibold mb-4">Revenue by Server</h3>
                <div className="space-y-3">
                  {serverData.map((server, i) => (
                    <div key={i} className="flex items-center justify-between pb-3 border-b border-border last:border-0">
                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-primary" />
                        <p className="font-body text-sm font-medium">{server.name}</p>
                      </div>
                      <span className="font-heading font-semibold">${server.revenue.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}