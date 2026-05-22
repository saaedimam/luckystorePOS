import ProductDetailClient from './ProductDetailClient';

export async function generateStaticParams() {
  return [{ id: 'sample' }];
}

export default function ProductDetailPage() {
  return <ProductDetailClient />;
}
