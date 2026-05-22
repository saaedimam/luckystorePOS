import OrderTrackingClient from './OrderTrackingClient';

export async function generateStaticParams() {
  return [{ orderNumber: 'sample' }];
}

export default function OrderTrackingPage() {
  return <OrderTrackingClient />;
}
