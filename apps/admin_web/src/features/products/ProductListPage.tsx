import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Skeleton } from '../../components/Skeleton';
import { Search, Plus, Edit2, Package } from 'lucide-react';
import { clsx } from 'clsx';
import { ProductEditDrawer } from './ProductEditDrawer';
import { ProductAddModal } from './ProductAddModal';
import { useNotify } from '../../components/Notification';

export function ProductListPage() {
  const { notify } = useNotify();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const { data: products, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.products.list(),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.categories.list(),
  });

  const filteredProducts = products?.filter((p: any) => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (error) {
    notify('Failed to load products. Please check your connection.', 'error');
    return <div className="error">Error loading products.</div>;
  }

  return (
    <div className="products-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700' }}>Products</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage your shop's catalog.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="button-primary"
          style={{ 
            backgroundColor: 'var(--color-primary)', 
            color: 'white', 
            padding: 'var(--space-2) var(--space-4)', 
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            fontWeight: '600'
          }}
        >
          <Plus size={18} /> Add Product
        </button>
      </header>

      <div className="card" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-6)', display: 'flex', gap: 'var(--space-4)' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search by name, SKU, or barcode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              width: '100%', 
              padding: 'var(--space-3) var(--space-3) var(--space-3) 40px', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--input-bg)',
              color: 'var(--text-main)'
            }}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.02)', color: 'var(--text-muted)' }}>
              <th style={{ padding: 'var(--space-4)' }}>Product</th>
              <th style={{ padding: 'var(--space-4)' }}>SKU / Barcode</th>
              <th style={{ padding: 'var(--space-4)' }}>Price</th>
              <th style={{ padding: 'var(--space-4)' }}>Cost</th>
              <th style={{ padding: 'var(--space-4)' }}>Stock</th>
              <th style={{ padding: 'var(--space-4)' }}>Status</th>
              <th style={{ padding: 'var(--space-4)', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: 'var(--space-4)' }}><Skeleton style={{ width: '150px', height: '20px' }} /></td>
                  <td style={{ padding: 'var(--space-4)' }}><Skeleton style={{ width: '100px', height: '20px' }} /></td>
                  <td style={{ padding: 'var(--space-4)' }}><Skeleton style={{ width: '60px', height: '20px' }} /></td>
                  <td style={{ padding: 'var(--space-4)' }}><Skeleton style={{ width: '60px', height: '20px' }} /></td>
                  <td style={{ padding: 'var(--space-4)' }}><Skeleton style={{ width: '40px', height: '20px' }} /></td>
                  <td style={{ padding: 'var(--space-4)' }}><Skeleton style={{ width: '60px', height: '20px' }} /></td>
                  <td style={{ padding: 'var(--space-4)', textAlign: 'right' }}><Skeleton style={{ width: '30px', height: '20px', marginLeft: 'auto' }} /></td>
                </tr>
              ))
            ) : filteredProducts?.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Package size={48} style={{ marginBottom: 'var(--space-4)', opacity: 0.2 }} />
                  <p>No products found matching your search.</p>
                </td>
              </tr>
            ) : (
              filteredProducts?.map((p: any) => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: 'var(--space-4)' }}>
                    <div style={{ fontWeight: '600' }}>{p.name}</div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{p.categories?.name || 'No Category'}</div>
                  </td>
                  <td style={{ padding: 'var(--space-4)', fontSize: 'var(--font-size-sm)' }}>
                    <div>{p.sku}</div>
                    <div style={{ color: 'var(--text-muted)' }}>{p.barcode}</div>
                  </td>
                  <td style={{ padding: 'var(--space-4)' }}>৳{p.price}</td>
                  <td style={{ padding: 'var(--space-4)', color: 'var(--text-muted)' }}>৳{p.cost}</td>
                  <td style={{ padding: 'var(--space-4)' }}>
                    <span style={{ 
                      fontWeight: '600',
                      color: (p.stock || 0) <= 5 ? 'var(--color-danger)' : 'inherit'
                    }}>
                      {p.stock || 0}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--space-4)' }}>
                    <span className={clsx(
                      'badge',
                      p.active ? 'badge-success' : 'badge-muted'
                    )} style={{
                      fontSize: 'var(--font-size-xs)',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      backgroundColor: p.active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                      color: p.active ? 'var(--color-success)' : 'var(--text-muted)',
                      fontWeight: '600'
                    }}>
                      {p.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--space-4)', textAlign: 'right' }}>
                    <button 
                      onClick={() => setEditingProduct(p)}
                      style={{ color: 'var(--color-primary)', padding: 'var(--space-1)' }}
                    >
                      <Edit2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ProductEditDrawer 
        product={editingProduct} 
        categories={categories}
        onClose={() => setEditingProduct(null)} 
      />

      <ProductAddModal 
        isOpen={isAddModalOpen}
        categories={categories}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}
