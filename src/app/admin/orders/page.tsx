
// src/app/admin/orders/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from 'lucide-react';
import type { DisplayOrder } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import Link from 'next/link';

const orderStatuses = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];

const getStatusBadgeVariant = (status: DisplayOrder['status']) => {
  const lowerStatus = status.toLowerCase();
  if (lowerStatus === 'delivered' || lowerStatus === 'paid') return 'default';
  if (lowerStatus === 'shipped' || lowerStatus === 'processing') return 'secondary';
  if (lowerStatus === 'cancelled') return 'destructive';
  return 'outline'; // for 'pending' or other statuses
};


export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<DisplayOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const fetchAdminOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/orders');
      if (!response.ok) {
        let errorDetail = `Server responded with status ${response.status}`;
        try {
          const errorData = await response.json();
          errorDetail = errorData.error || errorData.message || errorDetail;
        } catch (e) {
          const textError = await response.text().catch(() => '');
          if (textError) errorDetail += ` - Response: ${textError.substring(0, 100)}...`;
        }
        throw new Error(errorDetail);
      }
      const data: DisplayOrder[] = await response.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch admin orders error:", error);
      toast({ title: "Error Fetching Orders", description: (error as Error).message, variant: "destructive" });
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAdminOrders();
  }, [fetchAdminOrders]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setIsUpdatingStatus(prev => ({ ...prev, [orderId]: true }));
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to update status' }));
        throw new Error(errorData.error);
      }
      toast({ title: "Order Status Updated", description: `Order status changed to ${newStatus}.` });
      // Refetch or update local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? { ...order, status: newStatus as DisplayOrder['status'] } : order
        )
      );
    } catch (error) {
      console.error("Update order status error:", error);
      toast({ title: "Error Updating Status", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsUpdatingStatus(prev => ({ ...prev, [orderId]: false }));
    }
  };


  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Order Management</h1>
        <p className="text-muted-foreground">View and manage all customer orders.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
          <CardDescription>A comprehensive list of all orders placed in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex justify-center items-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
             </div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead className="hidden md:table-cell">Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Update Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length > 0 ? orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    {/* Placeholder for linking to order details page if implemented */}
                    <span title="View order details (Not Implemented)"> 
                        {order.id.substring(0, 8)}...
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {order.user ? (
                        <div className="text-sm">
                            <div>{order.user.name || 'N/A'}</div>
                            <div className="text-xs text-muted-foreground">{order.user.email}</div>
                        </div>
                    ) : (
                        <span className="text-xs text-muted-foreground">Guest</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(order.date), 'MMM dd, yyyy p')}
                  </TableCell>
                  <TableCell>${order.totalAmount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(order.status)} className="capitalize">{order.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {isUpdatingStatus[order.id] ? (
                      <Loader2 className="h-5 w-5 animate-spin ml-auto" />
                    ) : (
                      <Select
                        value={order.status.toLowerCase()}
                        onValueChange={(newStatus) => handleStatusChange(order.id, newStatus)}
                        disabled={isUpdatingStatus[order.id]}
                      >
                        <SelectTrigger className="w-[150px] h-9 text-xs">
                          <SelectValue placeholder="Change status" />
                        </SelectTrigger>
                        <SelectContent>
                          {orderStatuses.map(statusVal => (
                            <SelectItem key={statusVal} value={statusVal} className="capitalize text-xs">
                              {statusVal}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">
                    No orders found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>
       <p className="text-sm text-muted-foreground text-center">
        Order details view (e.g., individual items in an order) is not yet implemented.
      </p>
    </div>
  );
}
