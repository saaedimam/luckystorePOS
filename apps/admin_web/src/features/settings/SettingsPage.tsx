import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Skeleton } from '../../components/Skeleton';
import { Users, CreditCard, FileText, Plus, UserPlus, Save, Check, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';

export function SettingsPage() {
  const storeId = '00000000-0000-0000-0000-000000000000'; // Hardcoded for MVP
  const [activeTab, setActiveTab] = useState<'users' | 'payments' | 'receipt'>('users');

  return (
    <div className="settings-container">
      <header style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700' }}>Settings</h1>
        <p style={{ color: 'var(--text-muted)' }}>Manage your shop's users and configuration.</p>
      </header>

      <div style={{ display: 'flex', gap: 'var(--space-8)' }}>
        {/* Vertical Tabs */}
        <aside style={{ width: '250px', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          <button 
            onClick={() => setActiveTab('users')}
            className={clsx('tab-btn', activeTab === 'users' && 'active')}
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-md)', border: 'none', textAlign: 'left', fontWeight: '600',
              backgroundColor: activeTab === 'users' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'users' ? 'white' : 'var(--text-muted)'
            }}
          >
            <Users size={18} /> Users & Roles
          </button>
          <button 
            onClick={() => setActiveTab('payments')}
            className={clsx('tab-btn', activeTab === 'payments' && 'active')}
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-md)', border: 'none', textAlign: 'left', fontWeight: '600',
              backgroundColor: activeTab === 'payments' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'payments' ? 'white' : 'var(--text-muted)'
            }}
          >
            <CreditCard size={18} /> Payment Methods
          </button>
          <button 
            onClick={() => setActiveTab('receipt')}
            className={clsx('tab-btn', activeTab === 'receipt' && 'active')}
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-md)', border: 'none', textAlign: 'left', fontWeight: '600',
              backgroundColor: activeTab === 'receipt' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'receipt' ? 'white' : 'var(--text-muted)'
            }}
          >
            <FileText size={18} /> Receipt Config
          </button>
        </aside>

        {/* Tab Content */}
        <main style={{ flex: 1 }}>
          <div className="card" style={{ padding: 'var(--space-8)' }}>
            {activeTab === 'users' && <UsersSettings storeId={storeId} />}
            {activeTab === 'payments' && <PaymentsSettings storeId={storeId} />}
            {activeTab === 'receipt' && <ReceiptSettings storeId={storeId} />}
          </div>
        </main>
      </div>
    </div>
  );
}

function UsersSettings({ storeId }: { storeId: string }) {
  const { data: users, isLoading } = useQuery({
    queryKey: ['settings-users', storeId],
    queryFn: () => api.settings.getUsers(storeId),
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '700' }}>Users & Roles</h2>
        <button className="button-primary" style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
          <UserPlus size={18} /> Add User
        </button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
          <tr>
            <th style={{ paddingBottom: 'var(--space-3)' }}>Full Name</th>
            <th style={{ paddingBottom: 'var(--space-3)' }}>Email</th>
            <th style={{ paddingBottom: 'var(--space-3)' }}>Role</th>
            <th style={{ paddingBottom: 'var(--space-3)' }}>Last Login</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <tr key={i}><td colSpan={4} style={{ padding: 'var(--space-4) 0' }}><Skeleton style={{ height: '30px', width: '100%' }} /></td></tr>
            ))
          ) : (
            users?.map((u: any) => (
              <tr key={u.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                <td style={{ padding: 'var(--space-4) 0', fontWeight: '600' }}>{u.full_name}</td>
                <td style={{ padding: 'var(--space-4) 0' }}>{u.email}</td>
                <td style={{ padding: 'var(--space-4) 0' }}>
                  <span style={{ 
                    padding: '2px 8px', borderRadius: '12px', fontSize: 'var(--font-size-xs)', fontWeight: '700',
                    backgroundColor: u.role === 'admin' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                    color: u.role === 'admin' ? 'var(--color-primary)' : 'var(--text-muted)',
                    textTransform: 'uppercase'
                  }}>{u.role}</span>
                </td>
                <td style={{ padding: 'var(--space-4) 0', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                  {u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function PaymentsSettings({ storeId }: { storeId: string }) {
  const { data: payments, isLoading } = useQuery({
    queryKey: ['settings-payments', storeId],
    queryFn: () => api.settings.getPaymentMethods(storeId),
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '700' }}>Payment Methods</h2>
        <button style={{ color: 'var(--color-primary)', fontWeight: '600' }}>+ Add Method</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {isLoading ? (
          <Skeleton style={{ height: '200px', width: '100%' }} />
        ) : (
          payments?.map((pm: any) => (
            <div key={pm.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-4)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                <div style={{ backgroundColor: 'rgba(0,0,0,0.05)', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)' }}>
                  <CreditCard size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: '700' }}>{pm.name}</div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{pm.type}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                <span style={{ color: pm.is_active ? 'var(--color-success)' : 'var(--text-muted)', fontWeight: '600', fontSize: 'var(--font-size-sm)' }}>
                  {pm.is_active ? 'Active' : 'Inactive'}
                </span>
                <button style={{ color: 'var(--text-muted)' }}><RefreshCw size={16} /></button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ReceiptSettings({ storeId }: { storeId: string }) {
  const queryClient = useQueryClient();
  const { data: config, isLoading } = useQuery({
    queryKey: ['settings-receipt', storeId],
    queryFn: () => api.settings.getReceiptConfig(storeId),
  });

  const [formData, setFormData] = useState<any>({
    store_name: '',
    header_text: '',
    footer_text: ''
  });

  // Hydrate form once data is loaded
  useState(() => {
    if (config) {
      setFormData({
        store_name: config.store_name || '',
        header_text: config.header_text || '',
        footer_text: config.footer_text || ''
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: (newConfig: any) => api.settings.updateReceiptConfig(storeId, newConfig),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-receipt'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) return <Skeleton style={{ height: '300px', width: '100%' }} />;

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '600px' }}>
      <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '700', marginBottom: 'var(--space-6)' }}>Receipt Configuration</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <div className="form-group">
          <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: '600', marginBottom: 'var(--space-1)' }}>Store Name (on receipt)</label>
          <input 
            type="text" 
            value={formData.store_name} 
            onChange={e => setFormData({...formData, store_name: e.target.value})}
            placeholder="Lucky Store"
            style={{ width: '100%', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)' }}
          />
        </div>

        <div className="form-group">
          <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: '600', marginBottom: 'var(--space-1)' }}>Header Message</label>
          <textarea 
            value={formData.header_text} 
            onChange={e => setFormData({...formData, header_text: e.target.value})}
            placeholder="Welcome to Lucky Store!"
            style={{ width: '100%', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', minHeight: '80px' }}
          />
        </div>

        <div className="form-group">
          <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: '600', marginBottom: 'var(--space-1)' }}>Footer Message</label>
          <textarea 
            value={formData.footer_text} 
            onChange={e => setFormData({...formData, footer_text: e.target.value})}
            placeholder="No returns without receipt. Thank you!"
            style={{ width: '100%', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', minHeight: '80px' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
          <button 
            type="submit" 
            disabled={updateMutation.isPending}
            style={{ 
              backgroundColor: 'var(--color-primary)', 
              color: 'white', 
              padding: 'var(--space-3) var(--space-8)', 
              borderRadius: 'var(--radius-md)', 
              fontWeight: '700', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              opacity: updateMutation.isPending ? 0.7 : 1
            }}
          >
            {updateMutation.isPending ? 'Saving...' : <><Save size={18} /> Save Settings</>}
          </button>
          {updateMutation.isSuccess && (
            <span style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600', fontSize: 'var(--font-size-sm)' }}>
              <Check size={16} /> Saved Successfully
            </span>
          )}
        </div>
      </div>
    </form>
  );
}
