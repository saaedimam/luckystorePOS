import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

interface ProductEditDrawerProps {
  product: any | null;
  categories: any[] | undefined;
  onClose: () => void;
}

export function ProductEditDrawer({ product, categories, onClose }: ProductEditDrawerProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        price: product.price,
        cost: product.cost,
        sku: product.sku,
        barcode: product.barcode,
        category_id: product.category_id,
        active: product.active,
      });
    }
  }, [product]);

  const updateMutation = useMutation({
    mutationFn: (updates: any) => api.products.update(product.id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      onClose();
    },
  });

  if (!product) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <div 
      className="drawer-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        display: 'flex',
        justifyContent: 'flex-end',
        zIndex: 1000,
        backdropFilter: 'blur(2px)'
      }}
    >
      <div 
        className="drawer-content"
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '450px',
          backgroundColor: 'var(--bg-card)',
          height: '100%',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          padding: 'var(--space-6)'
        }}
      >
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)' }}>
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '700' }}>Edit Product</h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={24} /></button>
        </header>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', flex: 1, overflowY: 'auto' }}>
          <div className="form-group">
            <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: '500', marginBottom: 'var(--space-1)' }}>Product Name</label>
            <input 
              type="text" 
              value={formData.name || ''} 
              onChange={e => setFormData({...formData, name: e.target.value})}
              required
              className="form-input"
              style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: '500', marginBottom: 'var(--space-1)' }}>Price (৳)</label>
              <input 
                type="number" 
                value={formData.price || 0} 
                onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})}
                required
                className="form-input"
                style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
              />
            </div>
            <div className="form-group">
              <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: '500', marginBottom: 'var(--space-1)' }}>Cost (৳)</label>
              <input 
                type="number" 
                value={formData.cost || 0} 
                onChange={e => setFormData({...formData, cost: parseFloat(e.target.value)})}
                required
                className="form-input"
                style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: '500', marginBottom: 'var(--space-1)' }}>SKU</label>
              <input 
                type="text" 
                value={formData.sku || ''} 
                onChange={e => setFormData({...formData, sku: e.target.value})}
                className="form-input"
                style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
              />
            </div>
            <div className="form-group">
              <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: '500', marginBottom: 'var(--space-1)' }}>Barcode</label>
              <input 
                type="text" 
                value={formData.barcode || ''} 
                onChange={e => setFormData({...formData, barcode: e.target.value})}
                className="form-input"
                style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: '500', marginBottom: 'var(--space-1)' }}>Category</label>
            <select 
              value={formData.category_id || ''} 
              onChange={e => setFormData({...formData, category_id: e.target.value})}
              className="form-input"
              style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)' }}
            >
              <option value="">Select Category</option>
              {categories?.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
            <input 
              type="checkbox" 
              id="active"
              checked={formData.active || false} 
              onChange={e => setFormData({...formData, active: e.target.checked})}
            />
            <label htmlFor="active" style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500' }}>Active Product</label>
          </div>

          <div style={{ marginTop: 'auto', paddingTop: 'var(--space-8)' }}>
            <button 
              type="submit" 
              disabled={updateMutation.isPending}
              style={{ 
                width: '100%',
                backgroundColor: 'var(--color-primary)', 
                color: 'white', 
                padding: 'var(--space-3)', 
                borderRadius: 'var(--radius-md)',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--space-2)',
                opacity: updateMutation.isPending ? 0.7 : 1
              }}
            >
              <Save size={18} /> {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
