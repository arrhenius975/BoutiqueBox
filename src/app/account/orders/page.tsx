
// src/app/account/orders/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Package, Receipt, HelpCircle, Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { DisplayOrder } from '@/types';
import { useAppContext } from '@/contexts/AppContext';

const getStatusBadgeVariant = (status: DisplayOrder['status']) => {
  switch (status) {
    case 'Delivered': return 'default';
    case 'Shipped': return 'secondary';
    case 'Processing': return 'outline';
    case 'Cancelled': return 'destructive';
    case 'pending': return 'outline'; // explicitly handle pending
    case 'paid': return 'default'; // if you use 'paid'
    default: return 'outline';
  }
};

export default function OrderHistoryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [orders, setOrders] = useState<DisplayOrder[]>([]);
  const [isFetchingOrders, setIsFetchingOrders] = useState(false); // Set to false initially
  const [fetchError, setFetchError] = useState<string | null>(null);
  const { authUser, isLoadingAuth } = useAppContext();

  const fetchOrders = useCallback(async () => {
    if (!authUser) { 
        setIsFetchingOrders(false);
        setFetchError("User not authenticated. Please sign in.");
        return;
    }
    setIsFetchingOrders(true);
    setFetchError(null);
    try {
      const response = await fetch('/api/orders');
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
    } catch (err: any) {
      console.error("Fetch orders error on client:", err);
      setFetchError(err.message || 'An unexpected error occurred while fetching orders.');
      if (authUser) { 
        toast({
          title: "Error Fetching Orders",
          description: err.message || 'Could not load your order history.',
          variant: "destructive",
        });
      }
    } finally {
      setIsFetchingOrders(false);
    }
  }, [toast, authUser]);

  useEffect(() => {
    if (!isLoadingAuth) { 
      if (authUser) {
        if (orders.length === 0 && !fetchError) { 
             fetchOrders();
        } else if (fetchError && orders.length === 0) {
            fetchOrders();
        }
      } else {
        setOrders([]); 
        setFetchError("Please log in to view your order history.");
        setIsFetchingOrders(false); 
      }
    }
  }, [authUser, isLoadingAuth, fetchOrders, orders.length, fetchError]);


  if (isLoadingAuth || (authUser && isFetchingOrders && !fetchError)) {
    return (
      <div className="container mx-auto py-8 px-4 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">
          {isLoadingAuth ? "Verifying authentication..." : (isFetchingOrders ? "Loading your orders..." : "Please wait...")}
        </p>
      </div>
    );
  }
  
  if (fetchError) {
    return (
      <div className="container mx-auto py-8 px-4">
         <header className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" onClick={() => router.back()} className="h-9 w-9">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="font-headline text-3xl font-bold text-primary">Order History</h1>
            </div>
        </header>
        <Alert variant={!authUser || fetchError === "Please log in to view your order history." ? "default" : "destructive"} className="max-w-2xl mx-auto">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>{!authUser && fetchError === "Please log in to view your order history." ? "Access Denied" : "Error Loading Orders"}</AlertTitle>
          <AlertDescription>
            {fetchError}
            {authUser && fetchError !== "Please log in to view your order history." && (
                <Button onClick={fetchOrders} variant="link" className="p-0 h-auto ml-2" disabled={isFetchingOrders}>
                    {isFetchingOrders ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Try again
                </Button>
            )}
            {fetchError === "Please log in to view your order history." && (
                <Button asChild variant="link" className="p-0 h-auto ml-2">
                    <Link href={`/signin?redirect=/account/orders`}>Sign In</Link>
                </Button>
            )}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => router.back()} className="h-9 w-9">
                <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-headline text-3xl font-bold text-primary">Order History</h1>
        </div>
         <Button variant="outline" asChild>
            <Link href="/help">
                <HelpCircle className="mr-2 h-4 w-4" /> Need Help?
            </Link>
        </Button>
      </header>

      {!authUser && !isLoadingAuth ? ( 
           <Card className="text-center py-12">
            <CardHeader>
                <Package className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <CardTitle className="text-2xl">Access Denied</CardTitle>
                <CardDescription>Please log in to view your order history.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild size="lg">
                <Link href={`/signin?redirect=/account/orders`}>Sign In</Link>
                </Button>
            </CardContent>
           </Card>
      ) : orders.length === 0 ? (
        <Card className="text-center py-12">
          <CardHeader>
            <Package className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <CardTitle className="text-2xl">No Orders Yet</CardTitle>
            <CardDescription>You haven't placed any orders. Start shopping to see your history here!</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="lg">
              <Link href="/sections">Explore Products</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {orders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="bg-muted/50 dark:bg-muted/20 p-4 border-b">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                        <h2 className="text-lg font-semibold">Order ID: {order.id.substring(0, 8)}...</h2>
                        <p className="text-sm text-muted-foreground">Placed on: {new Date(order.date).toLocaleDateString()}</p>
                    </div>
                    <Badge variant={getStatusBadgeVariant(order.status)} className="text-sm px-3 py-1 capitalize">{order.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4">
                      <div className="relative h-16 w-16 rounded-md border overflow-hidden bg-white">
                         <Image 
                            src={item.image || `https://placehold.co/80x80.png?text=${item.name.substring(0,1)}`} 
                            alt={item.name} 
                            layout="fill" 
                            objectFit="contain" 
                            data-ai-hint={item['data-ai-hint'] || 'product item'}
                          />
                      </div>
                      <div className="flex-grow">
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity} &bull; Price: ${item.price.toFixed(2)}</p>
                      </div>
                      <p className="font-semibold">${(item.quantity * item.price).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
                <Separator className="my-4 md:my-6" />
                <div className="flex justify-end items-center">
                  <p className="text-lg font-semibold">Total: ${order.totalAmount.toFixed(2)}</p>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/50 dark:bg-muted/20 p-4 border-t flex flex-col sm:flex-row justify-end items-center gap-2">
                <Button variant="outline" size="sm" disabled>
                    <Receipt className="mr-2 h-4 w-4" /> View Invoice (Soon)
                </Button>
                <Button variant="outline" size="sm" disabled>
                    <Package className="mr-2 h-4 w-4" /> Track Package (Soon)
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
