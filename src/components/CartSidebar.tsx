
"use client";

import Image from 'next/image';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useAppContext } from '@/contexts/AppContext';
import { X, Minus, Plus, Loader2, QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export function CartSidebar() {
  const { cart, isCartOpen, toggleCart, removeFromCart, updateCartQuantity, clearCart } = useAppContext();
  const [selectedDeliverySlot, setSelectedDeliverySlot] = useState<string>('today-pm');
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const deliverySlots = [
    { id: 'today-pm', label: 'Today, 12 PM - 2 PM' },
    { id: 'tomorrow-am', label: 'Tomorrow, 10 AM - 12 PM' },
    { id: 'tomorrow-pm', label: 'Tomorrow, 2 PM - 4 PM' },
  ];

  const handleInitiateCheckout = () => {
    if (cart.length === 0) {
      toast({ title: "Cart Empty", description: "Please add items to your cart before checking out.", variant: "destructive" });
      return;
    }
    if (!selectedDeliverySlot) {
      toast({ title: "Delivery Slot Missing", description: "Please select a delivery slot.", variant: "destructive" });
      return;
    }
    setIsQrModalOpen(true); // Open the QR code modal
  };

  const handleConfirmPaymentAndPlaceOrder = async () => {
    setIsProcessingCheckout(true);
    setIsQrModalOpen(false); // Close QR modal before processing

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItems: cart, deliverySlotId: selectedDeliverySlot }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Checkout failed. Please try again.');
      }

      toast({
        title: "Order Placed Successfully!",
        description: "Your order is 'pending payment confirmation'. Admin will verify and process.",
      });
      clearCart();
      toggleCart(); // Close cart sidebar
      router.push('/account/orders'); // Redirect to order history

    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Checkout Failed",
        description: (error as Error).message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  return (
    <>
      <Sheet open={isCartOpen} onOpenChange={(open) => {
        if (!isProcessingCheckout) toggleCart();
      }}>
        <SheetContent className="flex w-full flex-col sm:max-w-lg">
          <SheetHeader className="pr-6">
            <SheetTitle>Shopping Cart</SheetTitle>
          </SheetHeader>
          {cart.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center">
              <p className="text-muted-foreground">Your cart is empty.</p>
              <SheetClose asChild>
                <Button variant="link" className="mt-4" disabled={isProcessingCheckout}>Continue Shopping</Button>
              </SheetClose>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 pr-6">
                <div className="space-y-4 py-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-start gap-4">
                      <div className="relative h-20 w-20 overflow-hidden rounded-md border">
                        <Image src={item.image} alt={item.name} layout="fill" objectFit="cover" data-ai-hint={item['data-ai-hint'] || 'cart item'} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">${item.price.toFixed(2)}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1 || isProcessingCheckout}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateCartQuantity(item.id, parseInt(e.target.value) || 1)}
                            className="h-7 w-12 p-1 text-center"
                            min="1"
                            disabled={isProcessingCheckout}
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                            disabled={isProcessingCheckout}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => removeFromCart(item.id)} disabled={isProcessingCheckout}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              <div className="my-4 pr-6">
                <h4 className="mb-2 text-sm font-medium">Delivery Options</h4>
                <RadioGroup value={selectedDeliverySlot} onValueChange={setSelectedDeliverySlot} className="space-y-1" disabled={isProcessingCheckout}>
                  {deliverySlots.map(slot => (
                    <div key={slot.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={slot.id} id={slot.id} disabled={isProcessingCheckout} />
                      <Label htmlFor={slot.id} className={`text-sm font-normal ${isProcessingCheckout ? 'cursor-not-allowed opacity-50' : ''}`}>{slot.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <Separator className="my-4" />
              <SheetFooter className="pr-6">
                <div className="flex w-full flex-col gap-4">
                  <div className="flex justify-between font-semibold">
                    <span>Subtotal</span>
                    <span>${totalAmount.toFixed(2)}</span>
                  </div>
                  <Button size="lg" className="w-full" onClick={handleInitiateCheckout} disabled={isProcessingCheckout || cart.length === 0}>
                    {isProcessingCheckout && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Proceed to Payment
                  </Button>
                  <Button variant="outline" size="sm" className="w-full" onClick={clearCart} disabled={isProcessingCheckout || cart.length === 0}>
                    Clear Cart
                  </Button>
                </div>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* QR Code Payment Modal */}
      <Dialog open={isQrModalOpen} onOpenChange={(open) => {
        if (!isProcessingCheckout) setIsQrModalOpen(open);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-6 w-6 text-primary" />
              Complete Your Payment
            </DialogTitle>
            <DialogDescription>
              Scan the QR code below with your preferred payment app to pay 
              <span className="font-bold"> ${totalAmount.toFixed(2)}</span>.
              After payment, click 'Confirm Payment & Place Order'.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 flex flex-col items-center gap-4">
            <div className="relative w-56 h-56 sm:w-64 sm:h-64 border rounded-md p-2 bg-white">
              <Image
                src={`https://placehold.co/250x250.png?text=Scan+to+Pay+\$${totalAmount.toFixed(2)}`}
                alt="Payment QR Code"
                layout="fill"
                objectFit="contain"
                data-ai-hint="QR code payment"
              />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Your order will be marked as 'pending payment confirmation' and processed once payment is verified by admin.
            </p>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsQrModalOpen(false)} disabled={isProcessingCheckout}>
              Cancel
            </Button>
            <Button onClick={handleConfirmPaymentAndPlaceOrder} disabled={isProcessingCheckout}>
              {isProcessingCheckout && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isProcessingCheckout ? 'Placing Order...' : "Confirm Payment & Place Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
