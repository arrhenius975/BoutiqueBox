
// src/app/admin/dashboard/page.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, LineChart, DollarSign, ShoppingCart, Users, Activity, Loader2, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";

interface RevenueDataPoint {
  day: string;
  revenue: number;
}
interface SignupDataPoint {
  day: string;
  signup_count: number;
}
interface InventoryStatus {
  category_name: string;
  product_count: number;
  low_stock_count: number;
}

interface ChartRevenueData {
  name: string;
  revenue: number;
}
interface ChartSignupData {
  name: string;
  signups: number;
}

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  activeUsers: number;
  conversionRate: number;
}

interface AnalyticsApiResponse {
  revenue: RevenueDataPoint[] | ChartRevenueData[];
  inventory: InventoryStatus[];
  signups: SignupDataPoint[] | ChartSignupData[];
  stats: DashboardStats;
}


export default function AdminDashboardPage() {
  const [revenueChartData, setRevenueChartData] = useState<ChartRevenueData[]>([]);
  const [signupChartData, setSignupChartData] = useState<ChartSignupData[]>([]);
  // const [inventorySummary, setInventorySummary] = useState<InventoryStatus[]>([]); // For future use

  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalOrders: 0,
    activeUsers: 0,
    conversionRate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/analytics');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch analytics data and parse error response.' }));
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }
      const data: AnalyticsApiResponse = await response.json();

      // Ensure data.revenue and data.signups are arrays before mapping
      const rawRevenueData = Array.isArray(data.revenue) ? data.revenue : [];
      const rawSignupData = Array.isArray(data.signups) ? data.signups : [];

      const processedRevenueData = rawRevenueData.map(item => ({
        name: format(new Date(item.day), 'MMM dd'), // Assuming 'day' is a valid date string
        revenue: (item as RevenueDataPoint).revenue || 0, // Ensure revenue is a number
      })).slice(-30);
      setRevenueChartData(processedRevenueData);

      const processedSignupData = rawSignupData.map(item => ({
        name: format(new Date(item.day), 'MMM dd'), // Assuming 'day' is a valid date string
        signups: (item as SignupDataPoint).signup_count || 0, // Ensure signup_count is a number
      })).slice(-30);
      setSignupChartData(processedSignupData);

      // setInventorySummary(Array.isArray(data.inventory) ? data.inventory : []);
      setStats(data.stats || { totalRevenue: 0, totalOrders: 0, activeUsers: 0, conversionRate: 0 });

    } catch (error) {
      console.error("Error fetching admin analytics:", error);
      const errorMessage = (error as Error).message;
      toast({ title: "Analytics Error", description: errorMessage, variant: "destructive" });
      // Set to default empty/zero states on error
      setRevenueChartData([]);
      setSignupChartData([]);
      setStats({ totalRevenue: 0, totalOrders: 0, activeUsers: 0, conversionRate: 0 });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);


  const chartConfig = {
    revenue: { label: "Revenue", color: "hsl(var(--chart-1))" },
    signups: { label: "Signups", color: "hsl(var(--chart-2))" },
  } satisfies Parameters<typeof ChartContainer>[0]["config"];


  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Admin Dashboard</h1>
            <p className="text-muted-foreground">Overview of your e-commerce operations.</p>
        </div>
        <Button onClick={fetchAnalytics} disabled={isLoading} variant="outline" size="sm">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Refresh Data
        </Button>
      </header>

      {isLoading ? (
        <div className="flex justify-center items-center py-10 h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-3 text-muted-foreground">Loading analytics data...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(stats.totalRevenue || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </div>
                <p className="text-xs text-muted-foreground">(Based on fetched daily data for last 30 days)</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingCart className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(stats.totalOrders || 0).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">(All-time)</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(stats.activeUsers || 0).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">(Signed up in last 30 days)</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <Activity className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(stats.conversionRate || 0).toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">(Orders / Active Users, last 30 days)</p>
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
                        tickFormatter={(value) => `₹${value.toLocaleString('en-IN', {maximumFractionDigits:0})}`}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip content={<ChartTooltipContent formatter={(value) => `₹${Number(value).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} />} />
                      <Legend content={<ChartLegendContent />} />
                      <Line type="monotone" dataKey="revenue" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-10">No revenue data available for the selected period. Ensure 'revenue_over_time' view is set up in Supabase.</p>
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
                   <p className="text-center text-muted-foreground py-10">No signup data available for the selected period. Ensure 'new_signups_over_time' view is set up in Supabase.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
      <Alert className="mt-8">
        <Info className="h-4 w-4" />
        <AlertTitle>Supabase Views Required for Analytics</AlertTitle>
        <AlertDescription>
          For the dashboard analytics to display data correctly, you need to create the following views in your Supabase SQL editor:
          <ul className="list-disc list-inside mt-2 text-xs space-y-1">
            <li>`revenue_over_time` (e.g., daily revenue from delivered orders in the last 30 days)</li>
            <li>`inventory_status` (e.g., product counts per category, low stock items)</li>
            <li>`new_signups_over_time` (e.g., daily new user signups from the `users` table in the last 30 days)</li>
            <li>`active_users_count_last_30_days` (e.g., count of users created in the last 30 days)</li>
            <li>`orders_count_last_30_days` (e.g., count of orders placed in the last 30 days)</li>
          </ul>
          Example SQL for these views can be found in the comments of `/api/admin/analytics/route.ts`.
        </AlertDescription>
      </Alert>
    </div>
  );
}

