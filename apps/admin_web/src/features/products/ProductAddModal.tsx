import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

interface ProductAddModalProps {
  isOpen: boolean;
  categories: any[] | undefined;
  onClose: () => void;
}

export function ProductAddModal({ isOpen, categories, onClose }: ProductAddModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<any>({
    name: '',
    price: 0,
    cost: 0,
    sku: '',
    barcode: '',
    category_id: '',
    active: true,
  });

  const createMutation = useMutation({
    mutationFn: (newProduct: any) => api.products.create(newProduct),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setFormData({
        name: '',
        price: 0,
        cost: 0,
        sku: '',
        barcode: '',
        category_id: '',
        active: true,
      });
      onClose();
    },
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div 
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(2px)'
      }}
    >
      <div 
        className="modal-content card"
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '500px',
          backgroundColor: 'var(--bg-card)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 'var(--space-6)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)' }}>
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '700' }}>Add New Product</h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={24} /></button>
        </header>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', overflowY: 'auto' }}>
          <div className="form-group">
            <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: '500', marginBottom: 'var(--space-1)' }}>Product Name</label>
            <input 
              type="text" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})}
              required
              placeholder="e.g. Dano Daily Pusti 1kg"
              style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: '500', marginBottom: 'var(--space-1)' }}>Price (৳)</label>
              <input 
                type="number" 
                value={formData.price} 
                onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})}
                required
                style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)' }}
              />
            </div>
            <div className="form-group">
              <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: '500', marginBottom: 'var(--space-1)' }}>Cost (৳)</label>
              <input 
                type="number" 
                value={formData.cost} 
                onChange={e => setFormData({...formData, cost: parseFloat(e.target.value)})}
                required
                style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: '500', marginBottom: 'var(--space-1)' }}>SKU</label>
              <input 
                type="text" 
                value={formData.sku} 
                onChange={e => setFormData({...formData, sku: e.target.value})}
                placeholder="DDP-001"
                style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)' }}
              />
            </div>
            <div className="form-group">
              <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: '500', marginBottom: 'var(--space-1)' }}>Barcode</label>
              <input 
                type="text" 
                value={formData.barcode} 
                onChange={e => setFormData({...formData, barcode: e.target.value})}
                placeholder="LS-000001"
                style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: '500', marginBottom: 'var(--space-1)' }}>Category</label>
            <select 
              value={formData.category_id} 
              onChange={e => setFormData({...formData, category_id: e.target.value})}
              style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)' }}
            >
              <option value="">Select Category</option>
              {categories?.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-color)' }}>
            <button 
              type="submit" 
              disabled={createMutation.isPending}
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
                opacity: createMutation.isPending ? 0.7 : 1
              }}
            >
              <Plus size={18} /> {createMutation.isPending ? 'Adding...' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
