
// src/app/admin/dashboard/page.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, LineChart, DollarSign, ShoppingCart, Users, Activity } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useEffect, useState } from "react"; // For potential future API calls

// Mock data for initial display
const initialSalesData = [
  { name: 'Jan', sales: 4000, revenue: 2400 },
  { name: 'Feb', sales: 3000, revenue: 1398 },
  { name: 'Mar', sales: 2000, revenue: 9800 },
  { name: 'Apr', sales: 2780, revenue: 3908 },
  { name: 'May', sales: 1890, revenue: 4800 },
  { name: 'Jun', sales: 2390, revenue: 3800 },
];

const initialUserActivityData = [
  { date: '2024-01-01', visits: 200, signups: 20 },
  { date: '2024-01-08', visits: 250, signups: 25 },
  { date: '2024-01-15', visits: 180, signups: 15 },
  { date: '2024-01-22', visits: 300, signups: 30 },
  { date: '2024-01-29', visits: 280, signups: 22 },
];

export default function AdminDashboardPage() {
  // TODO: Replace with state and fetch real data from GET /api/admin/analytics
  const [salesData, setSalesData] = useState(initialSalesData);
  const [userActivityData, setUserActivityData] = useState(initialUserActivityData);
  const [stats, setStats] = useState({
    totalRevenue: 1250350.75,
    totalOrders: 15023,
    activeUsers: 2500,
    conversionRate: 2.5, // Percentage
  });

  // useEffect(() => {
  //   const fetchAnalytics = async () => {
  //     try {
  //       const response = await fetch('/api/admin/analytics');
  //       if (!response.ok) throw new Error('Failed to fetch analytics');
  //       const data = await response.json();
  //       // Assuming data structure: { revenue: [], inventory: [], signups: [] }
  //       // You'll need to transform this data to fit your chart and stats components.
  //       // For example:
  //       // setSalesData(transformRevenueData(data.revenue));
  //       // setUserActivityData(transformSignupsData(data.signups));
  //       // setStats(calculateOverallStats(data));
  //       console.log("Fetched analytics data (TODO: implement data transformation):", data);
  //     } catch (error) {
  //       console.error("Error fetching admin analytics:", error);
  //       // Optionally show a toast message
  //     }
  //   };
  //   // fetchAnalytics(); // Uncomment when API is ready
  // }, []);


  const chartConfig = {
    sales: { label: "Sales", color: "hsl(var(--chart-1))" },
    revenue: { label: "Revenue", color: "hsl(var(--chart-2))" },
    visits: { label: "Visits", color: "hsl(var(--chart-3))" },
    signups: { label: "Signups", color: "hsl(var(--chart-4))" },
  } satisfies Parameters<typeof ChartContainer>[0]["config"];


  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of your e-commerce operations.</p>
      </header>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            <p className="text-xs text-muted-foreground">+10.2% from last month (mock data)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+5.1% from last month (mock data)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+201 since last hour (mock data)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Activity className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">+1.5% from last week (mock data)</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sales & Revenue Overview</CardTitle>
            <CardDescription>Monthly sales and revenue figures. (Currently mock data)</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" orientation="left" stroke="hsl(var(--chart-1))" />
                  <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--chart-2))" />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend content={<ChartLegendContent />} />
                  <Bar yAxisId="left" dataKey="sales" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="revenue" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>User Activity</CardTitle>
            <CardDescription>Weekly site visits and new signups. (Currently mock data)</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userActivityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend content={<ChartLegendContent />} />
                  <Line type="monotone" dataKey="visits" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="signups" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
      <p className="text-sm text-muted-foreground text-center">
        Note: All data displayed is for demonstration purposes. Implement `GET /api/admin/analytics` and related Supabase views/functions for real data.
      </p>
    </div>
  );
}
