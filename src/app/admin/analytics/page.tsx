// src/app/admin/analytics/page.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, ShoppingCart, Users, Percent, TrendingUp, Package, Tag, UserCheck, Info, BarChart3, LineChartIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Re-defining interfaces for clarity on this page, matching API response
interface ChartRevenueData {
  name: string; // Formatted date string e.g., "May 14"
  revenue: number;
}
interface ChartSignupData {
  name: string; // Formatted date string e.g., "May 14"
  signups: number;
}
interface DashboardStats {
  totalRevenueLast30Days: number;
  totalOrdersAllTime: number; // Note: This is all-time, for 30-day AOV we need 30-day orders
  activeUsersLast30Days: number;
  conversionRateLast30Days: number;
  ordersLast30Days: number; // This is key for 30-day AOV
}
interface AnalyticsApiResponse {
  revenue: ChartRevenueData[];
  inventory: any[]; // Define more strictly if used
  signups: ChartSignupData[];
  stats: DashboardStats;
}

const COLORS_PIE = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']; // For placeholder pie charts

export default function AdminAnalyticsPage() {
  const [revenueChartData, setRevenueChartData] = useState<ChartRevenueData[]>([]);
  const [signupChartData, setSignupChartData] = useState<ChartSignupData[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [averageOrderValue, setAverageOrderValue] = useState<number>(0);

  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchDetailedAnalytics = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const response = await fetch('/api/admin/analytics');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch analytics data and parse error response.' }));
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }
      const data: AnalyticsApiResponse = await response.json();

      setRevenueChartData(Array.isArray(data.revenue) ? data.revenue : []);
      setSignupChartData(Array.isArray(data.signups) ? data.signups : []);
      
      if (data.stats) {
        setStats(data.stats);
        if (data.stats.ordersLast30Days > 0 && data.stats.totalRevenueLast30Days > 0) {
          setAverageOrderValue(data.stats.totalRevenueLast30Days / data.stats.ordersLast30Days);
        } else {
          setAverageOrderValue(0);
        }
      } else {
        // Set default stats if API response is missing the stats object
        setStats({ totalRevenueLast30Days: 0, totalOrdersAllTime: 0, activeUsersLast30Days: 0, conversionRateLast30Days: 0, ordersLast30Days: 0 });
        setAverageOrderValue(0);
        console.warn("API response was missing stats object. Defaulting stats.");
      }

    } catch (error) {
      console.error("Error fetching detailed admin analytics:", error);
      const errorMessage = (error as Error).message;
      setFetchError(errorMessage);
      toast({ title: "Analytics Error", description: errorMessage, variant: "destructive" });
      setRevenueChartData([]);
      setSignupChartData([]);
      setStats(null);
      setAverageOrderValue(0);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDetailedAnalytics();
  }, [fetchDetailedAnalytics]);

  const chartConfig = {
    revenue: { label: "Revenue", color: "hsl(var(--chart-1))" },
    signups: { label: "Signups", color: "hsl(var(--chart-2))" },
  };

  // Placeholder data for pie charts (will be replaced by actual data later)
  const placeholderPieData = [
    { name: 'Category A', value: 400 },
    { name: 'Category B', value: 300 },
    { name: 'Category C', value: 300 },
    { name: 'Category D', value: 200 },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10 h-[calc(100vh-150px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Loading detailed analytics...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="space-y-6 p-4 md:p-0">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Detailed Analytics</h1>
        </header>
        <Alert variant="destructive" className="max-w-2xl mx-auto">
            <Info className="h-5 w-5" />
            <AlertTitle>Error Loading Analytics</AlertTitle>
            <AlertDescription>
                {fetchError}
                <Button onClick={fetchDetailedAnalytics} variant="link" className="p-0 h-auto ml-2">
                Try again
                </Button>
            </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Detailed Analytics</h1>
            <p className="text-muted-foreground">In-depth look at your store's performance.</p>
        </div>
        <Button onClick={fetchDetailedAnalytics} disabled={isLoading} variant="outline" size="sm">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Refresh Data
        </Button>
      </header>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue (Last 30 Days)</CardTitle>
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">
                    {(stats?.totalRevenueLast30Days || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Orders (Last 30 Days)</CardTitle>
                <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">{(stats?.ordersLast30Days || 0).toLocaleString()}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Order Value (AOV)</CardTitle>
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">
                    {averageOrderValue.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </div>
                <p className="text-xs text-muted-foreground">(Last 30 Days)</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Signups (Last 30 Days)</CardTitle>
                <Users className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">{(stats?.activeUsersLast30Days || 0).toLocaleString()}</div>
                </CardContent>
            </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
                <CardHeader>
                <CardTitle className="flex items-center gap-2"><LineChartIcon className="h-5 w-5" /> Daily Revenue Trend</CardTitle>
                <CardDescription>Revenue over the last 30 days.</CardDescription>
                </CardHeader>
                <CardContent>
                {revenueChartData.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} interval="preserveStartEnd"/>
                        <YAxis
                        tickFormatter={(value) => `₹${Number(value).toLocaleString('en-IN', {maximumFractionDigits:0})}`}
                        tick={{ fontSize: 12 }}
                        />
                        <Tooltip content={<ChartTooltipContent formatter={(value) => `₹${Number(value).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} />} />
                        <Legend content={<ChartLegendContent />} />
                        <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2} dot={false} />
                    </LineChart>
                    </ResponsiveContainer>
                </ChartContainer>
                ) : (
                    <p className="text-center text-muted-foreground py-10">No revenue data to display. Ensure 'revenue_over_time' view is populated.</p>
                )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Daily New Signups Trend</CardTitle>
                <CardDescription>New user signups over the last 30 days.</CardDescription>
                </CardHeader>
                <CardContent>
                {signupChartData.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={signupChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} interval="preserveStartEnd"/>
                        <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                        <Tooltip content={<ChartTooltipContent />} />
                        <Legend content={<ChartLegendContent />} />
                        <Bar dataKey="signups" fill="var(--color-signups)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
                ) : (
                    <p className="text-center text-muted-foreground py-10">No signup data to display. Ensure 'new_signups_over_time' view is populated.</p>
                )}
                </CardContent>
            </Card>
        </div>
        
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5"/>Top Performing Products</CardTitle>
                    <CardDescription>Highest revenue or quantity sold (Placeholder).</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                     <p className="text-muted-foreground text-center">
                        Detailed product performance analytics coming soon! <br/>
                        (Requires `top_selling_products_view` in Supabase)
                    </p>
                </CardContent>
            </Card>
            <Card className="lg:col-span-1">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Tag className="h-5 w-5"/>Revenue by Category</CardTitle>
                    <CardDescription>Breakdown of revenue per product category (Placeholder).</CardDescription>
                </CardHeader>
                 <CardContent className="h-[300px] flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                        <Pie data={placeholderPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                            {placeholderPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS_PIE[index % COLORS_PIE.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                    {/* <p className="text-muted-foreground text-center -mt-8">
                        Category revenue chart coming soon! <br/>
                        (Requires `category_revenue_view` in Supabase)
                    </p> */}
                </CardContent>
            </Card>
            <Card className="lg:col-span-1">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><UserCheck className="h-5 w-5"/>Customer Lifetime Value (CLV)</CardTitle>
                    <CardDescription>Average CLV and trends (Placeholder).</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                     <p className="text-muted-foreground text-center">
                        CLV analytics coming soon! <br/>
                        (Requires advanced customer data analysis)
                    </p>
                </CardContent>
            </Card>
        </div>

      <Alert className="mt-8">
        <Info className="h-4 w-4" />
        <AlertTitle>Supabase Views for Full Analytics</AlertTitle>
        <AlertDescription>
          For some advanced analytics (like Top Products, Category Revenue), you'll need to create specific views in your Supabase SQL editor. 
          Refer to comments in `/api/admin/analytics/route.ts` for examples of `revenue_over_time` and `new_signups_over_time`. 
          Similar views will be needed for more detailed metrics.
        </AlertDescription>
      </Alert>
    </div>
  );
}
