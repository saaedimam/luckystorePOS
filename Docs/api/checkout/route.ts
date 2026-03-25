import { getAllProducts } from '@/lib/stryv/products';
import crypto from 'crypto';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// SSLCommerz sandbox endpoint (replace with live URL for production)
const SSL_COMMERZ_URL = 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php';

export async function POST(req: NextRequest) {
  try {
    const { items } = await req.json(); // items: [{ productId: string, quantity: number }]
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // Calculate total amount in BDT
    const products = getAllProducts();
    let total = 0;
    const productNames: string[] = [];
    items.forEach((item: { productId: string; quantity: number }) => {
      const prod = products.find((p) => p.id === item.productId);
      if (prod) {
        total += prod.price * item.quantity;
        productNames.push(`${prod.name} x${item.quantity}`);
      }
    });

    const transactionId = crypto.randomBytes(10).toString('hex');

    const payload = new URLSearchParams({
      store_id: process.env.SSL_COMMERZ_STORE_ID ?? '',
      store_passwd: process.env.SSL_COMMERZ_STORE_PASSWORD ?? '',
      total_amount: total.toString(),
      currency: 'BDT',
      tran_id: transactionId,
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success?tran_id=${transactionId}`,
      fail_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/fail?tran_id=${transactionId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/cancel?tran_id=${transactionId}`,
      ipn_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/checkout/ipn`,
      product_name: productNames.join(', '),
      product_category: 'Apparel',
      product_profile: 'general',
      // Customer info – in a real app you'd collect this from the user
      cus_name: 'Guest User',
      cus_email: 'guest@example.com',
      cus_add1: 'N/A',
      cus_city: 'Dhaka',
      cus_postcode: '1000',
      cus_country: 'Bangladesh',
      cus_phone: '0123456789',
      shipping_method: 'NO',
      shipping_name: 'Guest User',
      shipping_add1: 'N/A',
      shipping_city: 'Dhaka',
      shipping_postcode: '1000',
      shipping_country: 'Bangladesh',
    });

    const response = await fetch(SSL_COMMERZ_URL, {
      method: 'POST',
      body: payload,
    });

    const data = await response.json();
    if (data?.status === 'SUCCESS' && data?.GatewayPageURL) {
      return NextResponse.json({ redirectUrl: data.GatewayPageURL });
    }
    return NextResponse.json({ error: 'Failed to create payment session', details: data }, { status: 500 });
  } catch (err) {
    console.error('Checkout error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
