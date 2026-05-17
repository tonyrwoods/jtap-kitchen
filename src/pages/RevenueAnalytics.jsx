import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { motion } from "framer-motion";
import { DollarSign, TrendingUp, Users, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RevenueAnalytics() {
  const [stats, setStats] = useState({
    thisWeek: 0, thisMonth: 0, thisYear: 0,
    dailyChart: [], topItems: [], avgCheck: 0, byServer: [], taxThisMonth: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const invoices = await base44.entities.Invoice.filter({ status: "Paid" }, "-created_date", 1000);
      const orders = await base44.entities.Order.list("-created_date", 1000);
      
      const now = new Date();
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const yearStart = new Date(now.getFullYear(), 0, 1);

      const thisWeekInv = invoices.filter(i => new Date(i.created_date) >= weekStart && !i.items?.some(it => it.name?.includes("Vendor")));
      const thisMonthInv = invoices.filter(i => new Date(i.created_date) >= monthStart && !i.items?.some(it => it.name?.includes("Vendor")));
      const thisYearInv = invoices.filter(i => new Date(i.created_date) >= yearStart && !i.items?.some(it => it.name?.includes("Vendor")));

      const thisWeekRev = thisWeekInv.reduce((sum, i) => sum + (i.total || 0), 0);
      const thisMonthRev = thisMonthInv.reduce((sum, i) => sum + (i.total || 0), 0);
      const thisYearRev = thisYearInv.reduce((sum, i) => sum + (i.total || 0), 0);
      const taxThisMonth = thisMonthInv.reduce((sum, i) => sum + (i.tax_amount || 0), 0);

      // Daily chart (last 30 days)
      const dailyMap = {};
      for (let i = 0; i < 30; i++) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = d.toISOString().split("T")[0];
        dailyMap[dateStr] = 0;
      }
      thisMonthInv.forEach(i => {
        const dateStr = new Date(i.created_date).toISOString().split("T")[0];
        if (dailyMap[dateStr] !== undefined) dailyMap[dateStr] += i.total || 0;
      });
      const dailyChart = Object.entries(dailyMap).reverse().map(([date, revenue]) => ({ date, revenue: Math.round(revenue * 100) / 100 }));

      // Top items
      const itemMap = {};
      orders.forEach(o => {
        (o.items || []).forEach(it => {
          itemMap[it.name] = (itemMap[it.name] || 0) + 1;
        });
      });
      const topItems = Object.entries(itemMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }));

      // By server
      const serverMap = {};
      thisMonthInv.forEach(i => {
        const key = i.server_name || "No Server";
        if (!serverMap[key]) serverMap[key] = 0;
        serverMap[key] += i.total || 0;
      });
      const byServer = Object.entries(serverMap).map(([name, revenue]) => ({ name, revenue: Math.round(revenue * 100) / 100 }));

      const avgCheck = thisMonthInv.length > 0 ? Math.round((thisMonthRev / thisMonthInv.length) * 100) / 100 : 0;

      setStats({ thisWeek: thisWeekRev, thisMonth: thisMonthRev, thisYear: thisYearRev, dailyChart, topItems, avgCheck, byServer, taxThisMonth });
      setLoading(false);
    };
    load();
  }, []);

  const COLORS = ["#C89B4F", "#8B7355", "#A0826D", "#705344", "#5C4A3D"];

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-heading text-3xl font-bold mb-8">Revenue Analytics</h1>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <DollarSign className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.thisWeek.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <TrendingUp className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.thisMonth.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Year</CardTitle>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.thisYear.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Check</CardTitle>
              <Clock className="w-4 h-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.avgCheck.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Daily revenue */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Daily Revenue (30d)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.dailyChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={v => `$${v}`} />
                  <Bar dataKey="revenue" fill="#C89B4F" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top 5 Items by Frequency</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={stats.topItems} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {stats.topItems.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Server breakdown */}
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Revenue by Server (This Month)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.byServer} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={v => `$${v}`} />
                  <Bar dataKey="revenue" fill="#C89B4F" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tax Collected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">${stats.taxThisMonth.toFixed(2)}</div>
              <p className="text-sm text-muted-foreground mt-2">This month</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}