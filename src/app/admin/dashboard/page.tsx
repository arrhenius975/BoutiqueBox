
// src/app/admin/dashboard/page.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, LineChart, DollarSign, ShoppingCart, Users, Activity, Loader2 } from 'lucide-react'; // Added Loader2
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast"; // Added useToast
import { format } from 'date-fns'; // For formatting dates

// Define types for fetched analytics data
interface RevenueDataPoint {
  day: string; // YYYY-MM-DD
  revenue: number;
}
interface SignupDataPoint {
  day: string; // YYYY-MM-DD
  signup_count: number;
}
interface InventoryStatus {
  category_name: string;
  product_count: number;
  low_stock_count: number;
}

// Chart data format
interface ChartRevenueData {
  name: string; // e.g., 'Jan 01'
  revenue: number;
}
interface ChartSignupData {
  name: string; // e.g., 'Jan 01'
  signups: number;
}


export default function AdminDashboardPage() {
  const [revenueChartData, setRevenueChartData] = useState<ChartRevenueData[]>([]);
  const [signupChartData, setSignupChartData] = useState<ChartSignupData[]>([]);
  // const [inventorySummary, setInventorySummary] = useState<InventoryStatus[]>([]); // For future use
  
  const [stats, setStats] = useState({ // These will remain mock for now or be updated by a dedicated stats endpoint
    totalRevenue: 0, // Will be calculated or fetched
    totalOrders: 0, // Example, fetch from orders table count
    activeUsers: 0, // Example, fetch from users table count
    conversionRate: 0, // Example, calculated
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/admin/analytics');
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to fetch analytics data.' }));
          throw new Error(errorData.error);
        }
        const data: { revenue: RevenueDataPoint[], inventory: InventoryStatus[], signups: SignupDataPoint[] } = await response.json();
        
        // Process revenue data for chart
        const processedRevenueData = data.revenue.map(item => ({
          name: format(new Date(item.day), 'MMM dd'), // Format date for X-axis label
          revenue: item.revenue,
        })).slice(-30); // Show last 30 days for example
        setRevenueChartData(processedRevenueData);

        // Process signup data for chart
        const processedSignupData = data.signups.map(item => ({
          name: format(new Date(item.day), 'MMM dd'), // Format date for X-axis label
          signups: item.signup_count,
        })).slice(-30); // Show last 30 days for example
        setSignupChartData(processedSignupData);

        // setInventorySummary(data.inventory); // Store for future use

        // Calculate total revenue for stats card (example)
        const totalRev = data.revenue.reduce((sum, item) => sum + item.revenue, 0);
        setStats(prev => ({ ...prev, totalRevenue: totalRev, /* Update other stats as needed */ }));

        toast({ title: "Analytics Loaded", description: "Dashboard data has been updated." });
      } catch (error) {
        console.error("Error fetching admin analytics:", error);
        toast({ title: "Analytics Error", description: (error as Error).message, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, [toast]);


  const chartConfig = {
    revenue: { label: "Revenue", color: "hsl(var(--chart-1))" },
    signups: { label: "Signups", color: "hsl(var(--chart-2))" },
    // sales: { label: "Sales", color: "hsl(var(--chart-1))" },
    // visits: { label: "Visits", color: "hsl(var(--chart-3))" },
  } satisfies Parameters<typeof ChartContainer>[0]["config"];


  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of your e-commerce operations.</p>
      </header>

      {isLoading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-3 text-muted-foreground">Loading analytics data...</p>
        </div>
      )}

      {!isLoading && (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                <p className="text-xs text-muted-foreground">(Based on fetched daily data for last 30 days)</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingCart className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalOrders.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">(Mock data - implement fetching)</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeUsers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">(Mock data - implement fetching)</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <Activity className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">(Mock data - implement calculation)</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Daily Revenue (Last 30 Days)</CardTitle>
                <CardDescription>Revenue figures from the analytics API.</CardDescription>
              </CardHeader>
              <CardContent>
                {revenueChartData.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} interval="preserveStartEnd"/>
                      <YAxis 
                        tickFormatter={(value) => `$${value.toLocaleString()}`}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip content={<ChartTooltipContent formatter={(value) => `$${Number(value).toLocaleString()}`} />} />
                      <Legend content={<ChartLegendContent />} />
                      <Line type="monotone" dataKey="revenue" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-10">No revenue data available for the selected period.</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Daily New Signups (Last 30 Days)</CardTitle>
                <CardDescription>New user signups from the analytics API.</CardDescription>
              </CardHeader>
              <CardContent>
               {signupChartData.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={signupChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} interval="preserveStartEnd"/>
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip content={<ChartTooltipContent />} />
                      <Legend content={<ChartLegendContent />} />
                      <Line type="monotone" dataKey="signups" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
                ) : (
                   <p className="text-center text-muted-foreground py-10">No signup data available for the selected period.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
      <p className="text-sm text-muted-foreground text-center">
        Note: Ensure Supabase views for `revenue_over_time`, `inventory_status`, and `new_signups_over_time` are created and populated for accurate data.
      </p>
    </div>
  );
}
