import CategoryClient from './CategoryClient';

export async function generateStaticParams() {
  return [{ slug: 'sample' }];
}

export default function CategoryPage() {
  return <CategoryClient />;
}
