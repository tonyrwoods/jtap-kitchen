import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import useRobotsNoindex from "@/hooks/useRobotsNoindex";
import { motion } from "framer-motion";
import { DollarSign, TrendingUp, Users, Utensils, User, Calendar } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#C89B4F", "#9D7A4F", "#6B5840", "#4A3F35", "#2D2416"];

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
  const [invoices, setInvoices] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("month"); // week, month, year

  useEffect(() => {
    Promise.all([
      base44.entities.Invoice.filter({ status: "Paid", is_vendor_invoice: false }),
      base44.entities.Order.list("-created_date", 500),
    ]).then(([invs, ords]) => {
      setInvoices(invs);
      setOrders(ords);
      setLoading(false);
    });
  }, []);

  const getDateRange = () => {
    const now = new Date();
    const ranges = {
      week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      month: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      year: new Date(now.getFullYear(), 0, 1),
    };
    return ranges[dateRange];
  };

  const filteredInvoices = invoices.filter(inv => {
    const invDate = new Date(inv.created_date);
    return invDate >= getDateRange();
  });

  const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const avgCheckSize = filteredInvoices.length > 0 ? totalRevenue / filteredInvoices.length : 0;
  const taxCollected = filteredInvoices.reduce((sum, inv) => sum + (inv.tax || 0), 0);

  // Daily revenue chart (last 30 days)
  const last30Days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const dateStr = d.toISOString().split("T")[0];
    const dayRevenue = invoices
      .filter(inv => inv.created_date.startsWith(dateStr))
      .reduce((sum, inv) => sum + (inv.total || 0), 0);
    last30Days.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      revenue: dayRevenue,
    });
  }

  // Top 5 menu items
  const itemCounts = {};
  orders.forEach(order => {
    if (order.items) {
      order.items.forEach(item => {
        itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
      });
    }
  });
  const topItems = Object.entries(itemCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  // Revenue by server
  const serverRevenue = {};
  invoices.forEach(inv => {
    if (inv.server_name) {
      serverRevenue[inv.server_name] = (serverRevenue[inv.server_name] || 0) + (inv.total || 0);
    }
  });
  const serverData = Object.entries(serverRevenue)
    .sort((a, b) => b[1] - a[1])
    .map(([name, revenue]) => ({ name, revenue }));

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
                label="Invoices"
                value={filteredInvoices.length}
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
                <h3 className="font-heading text-lg font-semibold mb-4">Daily Revenue (30 Days)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={last30Days}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={value => `$${value.toFixed(2)}`} />
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
                        <span className="font-heading font-semibold text-primary">{item.count} orders</span>
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