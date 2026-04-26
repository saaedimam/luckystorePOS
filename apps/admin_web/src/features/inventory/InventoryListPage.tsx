import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Skeleton } from '../../components/Skeleton';
import { Search, RefreshCw, History, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { StockUpdateDrawer } from './StockUpdateDrawer';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

export function InventoryListPage() {
  const storeId = '00000000-0000-0000-0000-000000000000'; // Hardcoded for MVP
  const [searchTerm, setSearchTerm] = useState('');
  const [adjustingProduct, setAdjustingProduct] = useState<any | null>(null);
  
  const { data: inventory, isLoading, error, refetch } = useQuery({
    queryKey: ['inventory', storeId],
    queryFn: () => api.inventory.list(storeId),
  });

  const filteredItems = inventory?.filter((p: any) => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (error) return <div className="error">Error loading inventory.</div>;

  return (
    <div className="inventory-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700' }}>Stock Inventory</h1>
          <p style={{ color: 'var(--text-muted)' }}>Monitor and adjust stock levels.</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <Link 
            to="/inventory/history"
            className="button-secondary"
            style={{ 
              backgroundColor: 'var(--bg-card)', 
              color: 'var(--text-main)', 
              padding: 'var(--space-2) var(--space-4)', 
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              fontWeight: '600',
              textDecoration: 'none'
            }}
          >
            <History size={18} /> View History
          </Link>
          <button 
            onClick={() => refetch()}
            style={{ color: 'var(--text-muted)' }}
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </header>

      <div className="card" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Filter by product name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              width: '100%', 
              padding: 'var(--space-3) var(--space-3) var(--space-3) 40px', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--input-bg)'
            }}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.02)', color: 'var(--text-muted)' }}>
              <th style={{ padding: 'var(--space-4)' }}>Product</th>
              <th style={{ padding: 'var(--space-4)' }}>Current Stock</th>
              <th style={{ padding: 'var(--space-4)' }}>Status</th>
              <th style={{ padding: 'var(--space-4)' }}>Last Updated</th>
              <th style={{ padding: 'var(--space-4)', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: 'var(--space-4)' }}><Skeleton style={{ width: '200px', height: '20px' }} /></td>
                  <td style={{ padding: 'var(--space-4)' }}><Skeleton style={{ width: '60px', height: '20px' }} /></td>
                  <td style={{ padding: 'var(--space-4)' }}><Skeleton style={{ width: '80px', height: '20px' }} /></td>
                  <td style={{ padding: 'var(--space-4)' }}><Skeleton style={{ width: '100px', height: '20px' }} /></td>
                  <td style={{ padding: 'var(--space-4)', textAlign: 'right' }}><Skeleton style={{ width: '100px', height: '30px', marginLeft: 'auto' }} /></td>
                </tr>
              ))
            ) : filteredItems?.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <AlertCircle size={48} style={{ marginBottom: 'var(--space-4)', opacity: 0.2 }} />
                  <p>No inventory items found.</p>
                </td>
              </tr>
            ) : (
              filteredItems?.map((p: any) => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: 'var(--space-4)' }}>
                    <div style={{ fontWeight: '600' }}>{p.name}</div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>SKU: {p.sku || 'N/A'}</div>
                  </td>
                  <td style={{ padding: 'var(--space-4)' }}>
                    <span style={{ fontSize: 'var(--font-size-lg)', fontWeight: '700' }}>{p.current_qty}</span>
                  </td>
                  <td style={{ padding: 'var(--space-4)' }}>
                    <span className={clsx(
                      'badge',
                      p.reorder_status === 'OK' && 'badge-success',
                      p.reorder_status === 'LOW' && 'badge-warning',
                      p.reorder_status === 'OUT' && 'badge-danger'
                    )} style={{
                      fontSize: 'var(--font-size-xs)',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontWeight: '700',
                      backgroundColor: 
                        p.reorder_status === 'OK' ? 'rgba(16, 185, 129, 0.1)' :
                        p.reorder_status === 'LOW' ? 'rgba(245, 158, 11, 0.1)' :
                        'rgba(239, 68, 68, 0.1)',
                      color: 
                        p.reorder_status === 'OK' ? 'var(--color-success)' :
                        p.reorder_status === 'LOW' ? 'var(--color-warning)' :
                        'var(--color-danger)'
                    }}>
                      {p.reorder_status}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--space-4)', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                    {p.last_updated ? formatDistanceToNow(new Date(p.last_updated)) + ' ago' : 'Never'}
                  </td>
                  <td style={{ padding: 'var(--space-4)', textAlign: 'right' }}>
                    <button 
                      onClick={() => setAdjustingProduct(p)}
                      style={{ 
                        backgroundColor: 'var(--color-primary)', 
                        color: 'white', 
                        padding: 'var(--space-2) var(--space-4)', 
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: '600'
                      }}
                    >
                      Update
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <StockUpdateDrawer 
        product={adjustingProduct}
        storeId={storeId}
        onClose={() => setAdjustingProduct(null)}
      />
    </div>
  );
}
