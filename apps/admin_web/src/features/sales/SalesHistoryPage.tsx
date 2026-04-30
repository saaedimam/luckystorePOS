import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import { Skeleton } from '../../components/Skeleton';
import { Search, XCircle, ChevronRight, Receipt, CreditCard, X } from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { useNotify } from '../../components/Notification';

export function SalesHistoryPage() {
  const { notify } = useNotify();
  const { storeId } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);

  const { data: sales, isLoading, error } = useQuery({
    queryKey: ['sales-history', storeId, searchTerm],
    queryFn: () => api.sales.history(storeId, searchTerm),
  });

  if (error) {
    notify('Failed to load sales history. Please check your connection.', 'error');
    return <div className="error">Error loading sales history.</div>;
  }

  return (
    <div className="sales-history-container">
      <header style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700' }}>Sales History</h1>
        <p style={{ color: 'var(--text-muted)' }}>Search and review store transactions.</p>
      </header>

      <div className="card" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-6)', display: 'flex', gap: 'var(--space-4)' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by Receipt #..."
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
              <th style={{ padding: 'var(--space-4)' }}>Receipt #</th>
              <th style={{ padding: 'var(--space-4)' }}>Date & Time</th>
              <th style={{ padding: 'var(--space-4)' }}>Cashier</th>
              <th style={{ padding: 'var(--space-4)' }}>Amount</th>
              <th style={{ padding: 'var(--space-4)' }}>Status</th>
              <th style={{ padding: 'var(--space-4)', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: 'var(--space-4)' }}><Skeleton style={{ width: '120px', height: '20px' }} /></td>
                  <td style={{ padding: 'var(--space-4)' }}><Skeleton style={{ width: '150px', height: '20px' }} /></td>
                  <td style={{ padding: 'var(--space-4)' }}><Skeleton style={{ width: '100px', height: '20px' }} /></td>
                  <td style={{ padding: 'var(--space-4)' }}><Skeleton style={{ width: '80px', height: '20px' }} /></td>
                  <td style={{ padding: 'var(--space-4)' }}><Skeleton style={{ width: '60px', height: '20px' }} /></td>
                  <td style={{ padding: 'var(--space-4)', textAlign: 'right' }}><Skeleton style={{ width: '40px', height: '30px', marginLeft: 'auto' }} /></td>
                </tr>
              ))
            ) : sales?.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Receipt size={48} style={{ marginBottom: 'var(--space-4)', opacity: 0.2 }} />
                  <p>No sales found.</p>
                </td>
              </tr>
            ) : (
              sales?.map((s: any) => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: 'var(--space-4)', fontWeight: '700' }}>{s.sale_number}</td>
                  <td style={{ padding: 'var(--space-4)', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                    {format(new Date(s.created_at), 'MMM d, yyyy HH:mm')}
                  </td>
                  <td style={{ padding: 'var(--space-4)' }}>{s.cashier_name}</td>
                  <td style={{ padding: 'var(--space-4)', fontWeight: '700' }}>৳{s.total_amount}</td>
                  <td style={{ padding: 'var(--space-4)' }}>
                    <span className={clsx(
                      'badge',
                      s.status === 'completed' ? 'badge-success' : 'badge-danger'
                    )} style={{
                      fontSize: 'var(--font-size-xs)',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontWeight: '700',
                      backgroundColor: s.status === 'completed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: s.status === 'completed' ? 'var(--color-success)' : 'var(--color-danger)',
                      textTransform: 'uppercase'
                    }}>
                      {s.status}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--space-4)', textAlign: 'right' }}>
                    <button
                      onClick={() => setSelectedSaleId(s.id)}
                      style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto', fontWeight: '600' }}
                    >
                      Details <ChevronRight size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <SaleDetailsDrawer
        saleId={selectedSaleId}
        onClose={() => setSelectedSaleId(null)}
      />
    </div>
  );
}

function SaleDetailsDrawer({ saleId, onClose }: { saleId: string | null, onClose: () => void }) {
  const { notify } = useNotify();
  const queryClient = useQueryClient();
  const [voidReason, setVoidReason] = useState('');
  const [showVoidConfirm, setShowVoidConfirm] = useState(false);
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const { data, isLoading } = useQuery({
    queryKey: ['sale-details', saleId],
    queryFn: () => api.sales.getDetails(saleId!),
    enabled: !!saleId,
  });

  const voidMutation = useMutation({
    mutationFn: (reason: string) => api.sales.void(saleId!, reason, idempotencyKey),
    onSuccess: (res) => {
      if (res.is_duplicate) {
        notify('This sale was already voided.', 'info');
      } else {
        notify('Sale voided successfully. Stock has been restored.', 'success');
      }
      queryClient.invalidateQueries({ queryKey: ['sales-history'] });
      onClose();
    },
    onError: (err: any) => {
      notify(err.message || 'Failed to void sale. Please try again.', 'error');
    }
  });

  if (!saleId) return null;

  const { sale, items, payments } = data || {};

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
          maxWidth: '500px',
          backgroundColor: 'var(--bg-card)',
          height: '100%',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          padding: 'var(--space-6)',
          overflowY: 'auto'
        }}
      >
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)' }}>
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '700' }}>Sale Details</h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={24} /></button>
        </header>

        {isLoading ? (
          <Skeleton style={{ width: '100%', height: '400px' }} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
            {/* Header Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', backgroundColor: 'rgba(0,0,0,0.02)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
              <div>
                <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', display: 'block' }}>Receipt #</label>
                <span style={{ fontWeight: '700' }}>{sale.sale_number}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', display: 'block' }}>Status</label>
                <span style={{
                  color: sale.status === 'completed' ? 'var(--color-success)' : 'var(--color-danger)',
                  fontWeight: '700',
                  textTransform: 'uppercase'
                }}>{sale.status}</span>
              </div>
              <div>
                <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', display: 'block' }}>Date</label>
                <span>{format(new Date(sale.created_at), 'MMM d, yyyy HH:mm')}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', display: 'block' }}>Cashier</label>
                <span>{sale.cashier_name}</span>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: '700', marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Receipt size={16} /> Items
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ borderBottom: '1px solid var(--border-color)', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                  <tr>
                    <th style={{ textAlign: 'left', padding: 'var(--space-2) 0' }}>Item</th>
                    <th style={{ textAlign: 'center', padding: 'var(--space-2) 0' }}>Qty</th>
                    <th style={{ textAlign: 'right', padding: 'var(--space-2) 0' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item: any, idx: number) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', fontSize: 'var(--font-size-sm)' }}>
                      <td style={{ padding: 'var(--space-2) 0' }}>
                        <div>{item.item_name}</div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{item.sku}</div>
                      </td>
                      <td style={{ textAlign: 'center' }}>{item.qty}</td>
                      <td style={{ textAlign: 'right', fontWeight: '600' }}>৳{item.line_total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', borderTop: '2px solid var(--border-color)', paddingTop: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal</span>
                <span>৳{sale.subtotal}</span>
              </div>
              {sale.discount_amount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-danger)' }}>
                  <span>Discount</span>
                  <span>-৳{sale.discount_amount}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xl)', fontWeight: '800' }}>
                <span>Total</span>
                <span>৳{sale.total_amount}</span>
              </div>
            </div>

            {/* Payments */}
            <div>
              <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: '700', marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={16} /> Payments
              </h3>
              {payments.map((p: any, idx: number) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)', padding: 'var(--space-1) 0' }}>
                  <span>{p.method_name} {p.reference && <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)' }}>({p.reference})</span>}</span>
                  <span style={{ fontWeight: '600' }}>৳{p.amount}</span>
                </div>
              ))}
            </div>

            {/* Void Section (Manager only) */}
            {sale.status === 'completed' && (
              <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: 'var(--space-6)' }}>
                {!showVoidConfirm ? (
                  <button
                    onClick={() => setShowVoidConfirm(true)}
                    style={{ width: '100%', color: 'var(--color-danger)', border: '1px solid var(--color-danger)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <XCircle size={18} /> Void Sale
                  </button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', backgroundColor: 'rgba(239, 68, 68, 0.05)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
                    <h4 style={{ color: 'var(--color-danger)', fontWeight: '700' }}>Confirm Void</h4>
                    <p style={{ fontSize: 'var(--font-size-xs)' }}>This will restore stock and reverse session totals. This action cannot be undone.</p>
                    <input
                      type="text"
                      placeholder="Reason for voiding (required)..."
                      value={voidReason}
                      onChange={e => setVoidReason(e.target.value)}
                      style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-danger)' }}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                      <button onClick={() => setShowVoidConfirm(false)} style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>Cancel</button>
                      <button
                        disabled={!voidReason || voidMutation.isPending}
                        onClick={() => voidMutation.mutate(voidReason)}
                        style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-danger)', color: 'white', fontWeight: '600', opacity: (!voidReason || voidMutation.isPending) ? 0.5 : 1 }}
                      >
                        {voidMutation.isPending ? 'Voiding...' : 'Confirm Void'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Void Info */}
            {sale.status === 'voided' && (
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--color-danger)' }}>
                <h4 style={{ color: 'var(--color-danger)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <XCircle size={16} /> Voided Transaction
                </h4>
                <div style={{ fontSize: 'var(--font-size-sm)', marginTop: '4px' }}>
                  <strong>Reason:</strong> {sale.void_reason}
                </div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: '4px' }}>
                  By {sale.voided_by_name} on {format(new Date(sale.voided_at), 'MMM d, HH:mm')}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
