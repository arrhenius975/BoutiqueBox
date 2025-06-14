
// src/app/api/checkout/route.ts
import { supabase } from '@/data/supabase';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { CartItem } from '@/types'; // Assuming client sends cart items

export async function POST(req: NextRequest) {
  try {
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    
    // Fetch the user's profile ID from public.users using their auth_id
    // This is crucial because orders.user_id should reference public.users.id (UUID)
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id') // Assuming 'id' in public.users is the UUID primary key
      .eq('auth_id', authUser.id)
      .single();

    if (profileError || !userProfile) {
      console.error('Error fetching user profile ID for checkout:', profileError);
      return NextResponse.json({ error: 'Could not retrieve user profile to place order.' }, { status: 500 });
    }
    const userId = userProfile.id;


    const body = await req.json();
    const clientCartItems: CartItem[] = body.cartItems; 
    const deliverySlotId: string | undefined = body.deliverySlotId; 

    if (!clientCartItems || clientCartItems.length === 0) {
      return NextResponse.json({ error: 'Cart is empty.' }, { status: 400 });
    }
    if (!deliverySlotId) {
        return NextResponse.json({ error: 'Delivery slot not selected.' }, { status: 400 });
    }

    // Fetch product prices and stock from DB to ensure accuracy and prevent manipulation
    const productIds = clientCartItems.map(item => item.id);
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('id, price, stock, name') // Fetch name for error messages
      .in('id', productIds);

    if (productsError) {
      console.error('Error fetching product details for checkout:', productsError);
      return NextResponse.json({ error: 'Could not verify product details. Please try again.' }, { status: 500 });
    }

    let totalAmount = 0;
    const orderItemsToInsert = [];

    for (const cartItem of clientCartItems) {
      const productInfo = productsData.find(p => p.id === cartItem.id);
      if (!productInfo) {
        return NextResponse.json({ error: `Product with ID ${cartItem.id} (${cartItem.name}) not found or unavailable.` }, { status: 400 });
      }
      if (productInfo.stock < cartItem.quantity) {
        return NextResponse.json({ error: `Not enough stock for ${productInfo.name}. Available: ${productInfo.stock}, Requested: ${cartItem.quantity}` }, { status: 400 });
      }
      totalAmount += cartItem.quantity * productInfo.price;
      orderItemsToInsert.push({
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
        status: 'pending', // Initial status
        // delivery_slot_id: deliverySlotId, // You might want to store this
      })
      .select()
      .single();

    if (orderError || !orderData) {
      console.error('Error creating order:', orderError);
      return NextResponse.json({ error: orderError?.message || 'Order creation failed. Please try again.' }, { status: 500 });
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
      // For now, return an error. A transaction would be ideal here.
      await supabase.from('orders').delete().eq('id', orderData.id); // Attempt to rollback
      return NextResponse.json({ error: `Failed to save order details: ${orderItemsError.message}. Order has been cancelled.` }, { status: 500 });
    }

    // 3. Deduct product stock using RPC function for atomicity
    for (const item of orderItemsToInsert) {
      const { error: stockDecrementError } = await supabase.rpc('decrement_stock', {
        p_id: item.product_id,
        qty_to_decrement: item.quantity, // Ensure argument name matches SQL function
      });
      if (stockDecrementError) {
        console.error(`Error decrementing stock for ${item.product_id}:`, stockDecrementError);
        // This is critical. Order is created but stock not updated.
        // Implement robust rollback logic or at least log for manual intervention.
        // For simplicity, we'll try to revert order and items.
        await supabase.from('order_items').delete().eq('order_id', orderData.id);
        await supabase.from('orders').delete().eq('id', orderData.id);
        return NextResponse.json({ error: `Stock update failed for a product. ${stockDecrementError.message}. Order cancelled.` }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, order: orderData, message: "Order placed successfully!" });

  } catch (e: unknown) {
    console.error('POST /api/checkout general error:', e);
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred during checkout.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
    
// --- SQL for Supabase RPC function `decrement_stock` ---
// You need to create this function in your Supabase SQL editor:
//
// CREATE OR REPLACE FUNCTION decrement_stock(p_id uuid, qty_to_decrement int)
// RETURNS void AS $$
// BEGIN
//   UPDATE products
//   SET stock = stock - qty_to_decrement
//   WHERE id = p_id AND stock >= qty_to_decrement;

//   IF NOT FOUND THEN
//     RAISE EXCEPTION 'Insufficient stock for product ID % (tried to decrement by %, stock is less than %)', p_id, qty_to_decrement, qty_to_decrement;
//   END IF;
// END;
// $$ LANGUAGE plpgsql SECURITY DEFINER;
//
// -- Optional: Grant execute permission if needed, though 'security definer' often covers this.
// -- GRANT EXECUTE ON FUNCTION decrement_stock(uuid, int) TO authenticated;
// ---
    
