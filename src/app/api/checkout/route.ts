
// src/app/api/checkout/route.ts
import { supabase } from '@/data/supabase';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { CartItem } from '@/types'; // Assuming client sends cart items

export async function POST(req: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    const userId = user.id;

    const body = await req.json();
    const clientCartItems: CartItem[] = body.cartItems; // Client sends its cart state
    const deliverySlotId: string = body.deliverySlotId; // Client sends selected delivery slot

    if (!clientCartItems || clientCartItems.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }
    if (!deliverySlotId) {
        return NextResponse.json({ error: 'Delivery slot not selected' }, { status: 400 });
    }

    // Fetch product prices from DB to ensure accuracy and prevent manipulation
    const productIds = clientCartItems.map(item => item.id);
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('id, price, stock')
      .in('id', productIds);

    if (productsError) {
      console.error('Error fetching product details for checkout:', productsError);
      return NextResponse.json({ error: 'Could not verify product details.' }, { status: 500 });
    }

    let totalAmount = 0;
    const orderItemsToInsert = [];

    for (const cartItem of clientCartItems) {
      const productInfo = productsData.find(p => p.id === cartItem.id);
      if (!productInfo) {
        return NextResponse.json({ error: `Product ${cartItem.name} not found or unavailable.` }, { status: 400 });
      }
      if (productInfo.stock < cartItem.quantity) {
        return NextResponse.json({ error: `Not enough stock for ${cartItem.name}. Available: ${productInfo.stock}` }, { status: 400 });
      }
      totalAmount += cartItem.quantity * productInfo.price;
      orderItemsToInsert.push({
        // order_id will be set after order creation
        product_id: cartItem.id,
        quantity: cartItem.quantity,
        price: productInfo.price, // Use DB price
      });
    }
    
    // 1. Create order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({ 
        user_id: userId, 
        total_amount: totalAmount, 
        status: 'pending', // Or 'paid' if payment is integrated
        // You might want to store delivery_slot_id or details here
      })
      .select()
      .single();

    if (orderError || !orderData) {
      console.error('Error creating order:', orderError);
      return NextResponse.json({ error: orderError?.message || 'Order creation failed' }, { status: 500 });
    }

    // 2. Insert into order_items
    const itemsWithOrderId = orderItemsToInsert.map(item => ({
      ...item,
      order_id: orderData.id,
    }));

    const { error: orderItemsError } = await supabase.from('order_items').insert(itemsWithOrderId);
    if (orderItemsError) {
      console.error('Error inserting order items:', orderItemsError);
      // Potentially roll back order creation or mark as failed
      return NextResponse.json({ error: `Failed to save order details: ${orderItemsError.message}` }, { status: 500 });
    }

    // 3. Deduct product stock (atomically using RPC function is recommended)
    // Ensure you have created this `decrement_stock` function in Supabase SQL.
    // CREATE OR REPLACE FUNCTION decrement_stock(p_id uuid, qty_to_decrement int)
    // RETURNS void AS $$
    // BEGIN
    //   UPDATE products
    //   SET stock = stock - qty_to_decrement
    //   WHERE id = p_id AND stock >= qty_to_decrement;
    //   IF NOT FOUND THEN
    //     RAISE EXCEPTION 'Insufficient stock for product ID %', p_id;
    //   END IF;
    // END;
    // $$ LANGUAGE plpgsql;
    for (const item of orderItemsToInsert) {
      const { error: stockDecrementError } = await supabase.rpc('decrement_stock', {
        p_id: item.product_id,
        qty: item.quantity,
      });
      if (stockDecrementError) {
        console.error(`Error decrementing stock for ${item.product_id}:`, stockDecrementError);
        // This is critical. Order is created but stock not updated.
        // Implement rollback logic or at least log for manual intervention.
        // For now, return error.
        return NextResponse.json({ error: `Stock update failed for ${item.product_id}. Order ${orderData.id} requires review.` }, { status: 500 });
      }
    }

    // 4. Clear cart (This would typically be client-side logic if cart is only client-state)
    // If you decide to persist cart to DB, clear it here:
    // await supabase.from('cart_items').delete().eq('user_id', userId);

    return NextResponse.json({ success: true, order: orderData });

  } catch (e: unknown) {
    console.error('POST /api/checkout general error:', e);
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

    