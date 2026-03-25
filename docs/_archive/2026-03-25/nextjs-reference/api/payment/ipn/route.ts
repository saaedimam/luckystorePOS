import { NextRequest, NextResponse } from 'next/server';

/**
 * IPN (Instant Payment Notification) handler for SSLCommerz
 * This endpoint receives payment status updates from SSLCommerz
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.formData();
    const formData: Record<string, string> = {};
    
    // Convert FormData to object
    body.forEach((value, key) => {
      formData[key] = value.toString();
    });

    // Validate SSLCommerz credentials
    if (!process.env.SSLCOMMERZ_STORE_ID || !process.env.SSLCOMMERZ_STORE_PASSWORD) {
      console.error('SSLCommerz credentials are not set');
      return NextResponse.json(
        { error: 'SSLCommerz configuration error' },
        { status: 500 }
      );
    }

    // Initialize SSLCommerz
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { SslCommerzPayment } = require('sslcommerz');
    
    const isLive = process.env.SSLCOMMERZ_IS_LIVE === 'true';
    const sslcommerz = new SslCommerzPayment(
      process.env.SSLCOMMERZ_STORE_ID,
      process.env.SSLCOMMERZ_STORE_PASSWORD,
      isLive
    );

    // Validate the IPN request
    const isValid = await sslcommerz.validate(formData);

    if (isValid) {
      const status = formData.status;
      const tranId = formData.tran_id;
      const amount = formData.amount;
      
      // Parse cart items from metadata if available
      let cartItems = [];
      if (formData.value_a) {
        try {
          cartItems = JSON.parse(formData.value_a);
        } catch (e) {
          console.error('Failed to parse cart items from IPN:', e);
        }
      }

      // Handle payment status
      if (status === 'VALID' || status === 'VALIDATED') {
        // Payment successful - update order status in your database
        // eslint-disable-next-line no-console
        console.log('Payment successful:', { tranId, amount, cartItems });
        
        // TODO: Update your database with successful payment
        // Example:
        // await updateOrderStatus(tranId, 'paid');
        // await sendConfirmationEmail(customerEmail, orderDetails);
      } else if (status === 'FAILED' || status === 'CANCELLED') {
        // Payment failed or cancelled
        // eslint-disable-next-line no-console
        console.log('Payment failed/cancelled:', { tranId, status });
        
        // TODO: Update your database with failed payment
        // Example:
        // await updateOrderStatus(tranId, 'failed');
      }

      // Acknowledge receipt to SSLCommerz
      return NextResponse.json({ status: 'received' });
    } else {
      console.error('Invalid IPN request from SSLCommerz');
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('IPN handler error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

