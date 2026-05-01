import { useState, useMemo, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { api } from '../../lib/api';
import { Skeleton } from '../../components/Skeleton';
import { Search, Plus, Edit2, Package, AlertCircle, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';
import { ProductEditDrawer } from './ProductEditDrawer';
import { ProductAddModal } from './ProductAddModal';
import { useNotify } from '../../components/Notification';
import { useRealtimeSubscription } from '../../hooks/useRealtime';
import { useDebounce } from '../../hooks/useDebounce';

const ROW_HEIGHT = 64;
const VISIBLE_ROWS = 15;

export function ProductListPage() {
  const { notify } = useNotify();

  useRealtimeSubscription({
    table: 'items',
    event: '*',
    invalidateKeys: [['products']],
  });

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { data: products, isLoading, error, refetch } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.products.list(),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.categories.list(),
  });

  const filteredProducts = useMemo(() =>
    products?.filter((p: any) =>
      p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      p.sku?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      p.barcode?.toLowerCase().includes(debouncedSearch.toLowerCase())
    ) ?? [],
    [products, debouncedSearch]
  );

  const scrollRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: filteredProducts.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5,
  });

  if (error) {
    return (
      <div className="products-container">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)' }}>
          <div>
            <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700' }}>Products</h1>
            <p style={{ color: 'var(--text-muted)' }}>Manage your shop's catalog.</p>
          </div>
        </header>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-12)', textAlign: 'center' }}>
          <AlertCircle size={48} style={{ opacity: 0.4, marginBottom: 'var(--space-4)' }} />
          <p style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--text-main)', marginBottom: 'var(--space-1)' }}>Failed to load products</p>
          <button onClick={() => refetch()} style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-4)', padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', cursor: 'pointer', fontWeight: '600', fontSize: 'var(--font-size-sm)' }}>
            <RefreshCw size={14} /> Try Again
          </button>
        </div>
      </div>
    );
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
        {/* Fixed header */}
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.02)', color: 'var(--text-muted)' }}>
              <th style={{ padding: 'var(--space-4)', width: '28%' }}>Product</th>
              <th style={{ padding: 'var(--space-4)', width: '18%' }}>SKU / Barcode</th>
              <th style={{ padding: 'var(--space-4)', width: '12%' }}>Price</th>
              <th style={{ padding: 'var(--space-4)', width: '12%' }}>Cost</th>
              <th style={{ padding: 'var(--space-4)', width: '10%' }}>Stock</th>
              <th style={{ padding: 'var(--space-4)', width: '12%' }}>Status</th>
              <th style={{ padding: 'var(--space-4)', textAlign: 'right', width: '8%' }}>Actions</th>
            </tr>
          </thead>
        </table>

        {isLoading ? (
          <div style={{ padding: 'var(--space-4)' }}>
            {Array(5).fill(0).map((_, i) => (
              <div key={i} style={{ display: 'flex', gap: 'var(--space-4)', padding: 'var(--space-3) 0' }}>
                <Skeleton style={{ width: '28%', height: '20px' }} />
                <Skeleton style={{ width: '18%', height: '20px' }} />
                <Skeleton style={{ width: '12%', height: '20px' }} />
                <Skeleton style={{ width: '12%', height: '20px' }} />
                <Skeleton style={{ width: '10%', height: '20px' }} />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Package size={48} style={{ marginBottom: 'var(--space-4)', opacity: 0.2 }} />
            <p style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--text-main)', marginBottom: 'var(--space-1)' }}>No products yet</p>
            <p style={{ fontSize: 'var(--font-size-sm)' }}>{searchTerm ? 'No products match your search.' : 'Add your first product to get started.'}</p>
          </div>
        ) : (
          <div
            ref={scrollRef}
            style={{ height: `${Math.min(filteredProducts.length, VISIBLE_ROWS) * ROW_HEIGHT + 4}px`, overflow: 'auto' }}
          >
            <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const p = filteredProducts[virtualRow.index];
                return (
                  <div
                    key={p.id}
                    style={{
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                      position: 'absolute',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      borderBottom: '1px solid var(--border-color)',
                      fontSize: 'var(--font-size-sm)',
                    }}
                  >
                    <div style={{ padding: 'var(--space-4)', width: '28%', minWidth: 0 }}>
                      <div style={{ fontWeight: '600' }}>{p.name}</div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{p.categories?.name || 'No Category'}</div>
                    </div>
                    <div style={{ padding: 'var(--space-4)', width: '18%', minWidth: 0 }}>
                      <div>{p.sku}</div>
                      <div style={{ color: 'var(--text-muted)' }}>{p.barcode}</div>
                    </div>
                    <div style={{ padding: 'var(--space-4)', width: '12%' }}>৳{p.price}</div>
                    <div style={{ padding: 'var(--space-4)', width: '12%', color: 'var(--text-muted)' }}>৳{p.cost}</div>
                    <div style={{ padding: 'var(--space-4)', width: '10%' }}>
                      <span style={{
                        fontWeight: '600',
                        color: (p.stock || 0) <= 5 ? 'var(--color-danger)' : 'inherit'
                      }}>
                        {p.stock || 0}
                      </span>
                    </div>
                    <div style={{ padding: 'var(--space-4)', width: '12%' }}>
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
                    </div>
                    <div style={{ padding: 'var(--space-4)', textAlign: 'right', width: '8%' }}>
                      <button 
                        onClick={() => setEditingProduct(p)}
                        style={{ color: 'var(--color-primary)', padding: 'var(--space-1)' }}
                      >
                        <Edit2 size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
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