import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import {  useAuth  } from '../../hooks/useAuth';
import { ErrorState, EmptyState, SkeletonBlock, SkeletonRow } from '../../components/PageState';
import { Users, CreditCard, FileText, UserPlus, Save, Check, ToggleLeft, ToggleRight, Trash2, Edit2 } from 'lucide-react';
import { clsx } from 'clsx';
import { AddUserModal } from './AddUserModal';
import { AddPaymentMethodModal } from './AddPaymentMethodModal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/layout/PageHeader';
import { useNotify } from '../../components/NotificationContext';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  manager: 'Manager',
  cashier: 'Staff',
};

interface SettingsUser {
  id: string;
  name: string | null;
  full_name?: string | null;
  email: string | null;
  role: string;
  last_login?: string | null;
  last_login_at?: string | null;
}

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
}

interface ReceiptConfig {
  store_name: string;
  header_text: string;
  footer_text: string;
}

export function SettingsPage() {
  const { storeId } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'payments' | 'receipt'>('users');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader 
        title="Settings" 
        subtitle="Manage your shop's users and configuration." 
      />

      <div className="flex gap-8">
        {/* Vertical Tabs */}
        <aside className="w-[250px] flex flex-col gap-1 shrink-0">
          <button
            onClick={() => setActiveTab('users')}
            className={clsx(
              'flex items-center gap-3 px-4 py-3 rounded-md text-left font-semibold transition-colors border-none cursor-pointer',
              activeTab === 'users'
                ? 'bg-primary text-primary-on'
                : 'bg-transparent text-text-secondary hover:bg-background-subtle'
            )}
          >
            <Users size={18} /> Users & Roles
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={clsx(
              'flex items-center gap-3 px-4 py-3 rounded-md text-left font-semibold transition-colors border-none cursor-pointer',
              activeTab === 'payments'
                ? 'bg-primary text-primary-on'
                : 'bg-transparent text-text-secondary hover:bg-background-subtle'
            )}
          >
            <CreditCard size={18} /> Payment Methods
          </button>
          <button
            onClick={() => setActiveTab('receipt')}
            className={clsx(
              'flex items-center gap-3 px-4 py-3 rounded-md text-left font-semibold transition-colors border-none cursor-pointer',
              activeTab === 'receipt'
                ? 'bg-primary text-primary-on'
                : 'bg-transparent text-text-secondary hover:bg-background-subtle'
            )}
          >
            <FileText size={18} /> Receipt Config
          </button>
        </aside>

        {/* Tab Content */}
        <main className="flex-1">
          <div className="card p-8 bg-surface-default border border-border-default rounded-xl shadow-sm">
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
  const { tenantId } = useAuth();
  const { notify } = useNotify();
  const queryClient = useQueryClient();
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState<SettingsUser | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const { data: users, isLoading, isError, refetch } = useQuery({
    queryKey: ['settings-users', storeId],
    queryFn: () => api.settings.getUsers(storeId) as Promise<SettingsUser[]>,
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => api.settings.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-users'] });
      setDeletingUserId(null);
      notify('User deleted', 'success');
    },
    onError: (err: unknown) => notify(err instanceof Error ? err.message : 'Failed to delete user', 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Record<string, unknown> }) => api.settings.updateUser(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-users'] });
      setEditingUser(null);
      notify('User updated', 'success');
    },
    onError: (err: unknown) => notify(err instanceof Error ? err.message : 'Failed to update user', 'error'),
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-text-primary">Users & Roles</h2>
        <button
          className="button-primary flex items-center gap-2 font-semibold"
          onClick={() => setShowAddUser(true)}
        >
          <UserPlus size={18} /> Add User
        </button>
      </div>

      <table className="w-full border-collapse">
        <thead className="border-b border-border-default text-text-muted text-left text-sm">
          <tr>
            <th className="pb-3 font-semibold">Full Name</th>
            <th className="pb-3 font-semibold">Email</th>
            <th className="pb-3 font-semibold">Role</th>
            <th className="pb-3 font-semibold">Last Login</th>
            <th className="pb-3 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-default">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => <SkeletonRow key={i} cols={5} />)
          ) : isError ? (
            <tr>
              <td colSpan={5}>
                <ErrorState message="Failed to load users." onRetry={() => refetch()} />
              </td>
            </tr>
          ) : users?.length === 0 ? (
            <tr>
              <td colSpan={5}>
                <EmptyState
                  icon={<Users size={48} />}
                  title="No users yet"
                  description="Add your first team member to get started."
                  action={<button className="button-primary" onClick={() => setShowAddUser(true)}><UserPlus size={18} /> Add User</button>}
                />
              </td>
            </tr>
          ) : (
            (users as SettingsUser[])?.map((u) => (
              <tr key={u.id} className="hover:bg-background-subtle transition-colors">
                <td className="py-4 font-semibold text-text-primary">{u.full_name || u.name || '—'}</td>
                <td className="py-4 text-text-secondary">{u.email || '—'}</td>
                <td className="py-4">
                  <span className={clsx(
                    'px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider',
                    u.role === 'admin'
                      ? 'bg-warning/15 text-warning-dark'
                      : u.role === 'manager'
                      ? 'bg-success/10 text-success-dark dark:text-success'
                      : 'bg-background-subtle text-text-muted'
                  )}>{ROLE_LABELS[u.role as string] || u.role}</span>
                </td>
                <td className="py-4 text-text-muted text-sm">
                  {(u.last_login || u.last_login_at) ? new Date((u.last_login || u.last_login_at)!).toLocaleDateString('en-GB') : 'Never'}
                </td>
                <td className="py-4">
                  <div className="flex gap-2">
                    <button onClick={() => setEditingUser(u)} className="text-text-muted hover:text-text-primary bg-transparent border-none cursor-pointer" aria-label="Edit user">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => setDeletingUserId(u.id)} className="text-danger hover:text-danger-dark bg-transparent border-none cursor-pointer" aria-label="Delete user">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <AddUserModal
        isOpen={showAddUser}
        storeId={storeId}
        tenantId={tenantId}
        onClose={() => setShowAddUser(false)}
      />

      {/* Edit User Modal */}
      {editingUser && (
        <EditUserModal
          key={editingUser.id}
          user={editingUser}
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          onSave={(updates) => updateMutation.mutate({ id: editingUser.id, updates })}
          isSaving={updateMutation.isPending}
        />
      )}

      {/* Delete User Confirm */}
      <ConfirmDialog
        isOpen={!!deletingUserId}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => deletingUserId && deleteMutation.mutate(deletingUserId)}
        onCancel={() => setDeletingUserId(null)}
      />
    </div>
  );
}

function PaymentsSettings({ storeId }: { storeId: string }) {
  const [showAddMethod, setShowAddMethod] = useState(false);
  const [deletingMethodId, setDeletingMethodId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { notify } = useNotify();
  const { data: payments, isLoading, isError, refetch: refetchPayments } = useQuery({
    queryKey: ['settings-payments', storeId],
    queryFn: () => api.settings.getPaymentMethods(storeId) as Promise<PaymentMethod[]>,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.settings.togglePaymentMethod(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-payments'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.settings.deletePaymentMethod(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-payments'] });
      setDeletingMethodId(null);
      notify('Payment method deleted', 'success');
    },
    onError: (err: unknown) => notify(err instanceof Error ? err.message : 'Failed to delete payment method', 'error'),
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-text-primary">Payment Methods</h2>
        <button
          className="button-primary flex items-center gap-2 font-semibold"
          onClick={() => setShowAddMethod(true)}
        >
          <CreditCard size={18} /> Add Method
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {isLoading ? (
          <SkeletonBlock className="h-[200px] w-full" />
        ) : isError ? (
          <ErrorState message="Failed to load payment methods." onRetry={() => refetchPayments()} />
        ) : payments?.length === 0 ? (
          <EmptyState
            icon={<CreditCard size={48} />}
            title="No payment methods"
            description="Add your first payment method to start accepting payments."
            action={<button className="button-primary" onClick={() => setShowAddMethod(true)}><CreditCard size={18} /> Add Method</button>}
          />
        ) : (
          payments?.map((pm) => (
            <div key={pm.id} className="flex items-center justify-between p-4 border border-border-default rounded-md bg-surface-default hover:border-border-strong transition-colors">
              <div className="flex items-center gap-4">
                <div className="bg-background-subtle p-2 rounded-md text-text-secondary">
                  <CreditCard size={20} />
                </div>
                <div>
                  <div className="font-bold text-text-primary">{pm.name}</div>
                  <div className="text-xs text-text-muted uppercase tracking-wider">{pm.type?.replace('_', ' ')}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => toggleMutation.mutate({ id: pm.id, isActive: !pm.is_active })}
                  className={clsx(
                    'flex items-center gap-2 px-3 py-1 rounded-md border-none cursor-pointer font-semibold text-sm transition-colors',
                    pm.is_active
                      ? 'bg-success/10 text-success hover:bg-success/20'
                      : 'bg-background-subtle text-text-muted hover:bg-background-default'
                  )}
                >
                  {pm.is_active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                  {pm.is_active ? 'Active' : 'Inactive'}
                </button>
                <button onClick={() => setDeletingMethodId(pm.id)} className="text-text-muted hover:text-danger bg-transparent border-none cursor-pointer" aria-label="Delete payment method">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}      </div>

      <AddPaymentMethodModal
        isOpen={showAddMethod}
        storeId={storeId}
        onClose={() => setShowAddMethod(false)}
      />

      <ConfirmDialog
        isOpen={!!deletingMethodId}
        title="Delete Payment Method"
        message="Are you sure you want to delete this payment method? Existing transactions will not be affected."
        variant="danger"
        onConfirm={() => deletingMethodId && deleteMutation.mutate(deletingMethodId)}
        onCancel={() => setDeletingMethodId(null)}
      />
    </div>
  );
}

function ReceiptSettings({ storeId }: { storeId: string }) {
  const { data: config, isLoading, isError, refetch: refetchConfig } = useQuery({
    queryKey: ['settings-receipt', storeId],
    queryFn: () => api.settings.getReceiptConfig(storeId),
  });

  if (isLoading) return <SkeletonBlock className="h-[300px] w-full" />;

  if (isError) {
    return <ErrorState message="Failed to load receipt config." onRetry={() => refetchConfig()} />;
  }

  if (config) {
    return <ReceiptForm storeId={storeId} config={config as ReceiptConfig} />;
  }
  return null;
}

function ReceiptForm({ storeId, config }: { storeId: string; config: ReceiptConfig }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<ReceiptConfig>({
    store_name: config.store_name || '',
    header_text: config.header_text || '',
    footer_text: config.footer_text || ''
  });

  const updateMutation = useMutation({
    mutationFn: (newConfig: ReceiptConfig) => api.settings.updateReceiptConfig(storeId, newConfig),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-receipt'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      <h2 className="text-xl font-bold text-text-primary mb-6">Receipt Configuration</h2>

      <div className="flex flex-col gap-6">
        <div className="form-group">
          <label className="block text-sm font-semibold text-text-secondary mb-1">Store Name (on receipt)</label>
          <input
            type="text"
            value={formData.store_name as string}
            onChange={e => setFormData({...formData, store_name: e.target.value})}
            placeholder="Lucky Store"
            className="input w-full"
          />
        </div>

        <div className="form-group">
          <label className="block text-sm font-semibold text-text-secondary mb-1">Header Message</label>
          <textarea
            value={formData.header_text as string}
            onChange={e => setFormData({...formData, header_text: e.target.value})}
            placeholder="Welcome to Lucky Store!"
            className="input w-full min-h-[80px]"
          />
        </div>

        <div className="form-group">
          <label className="block text-sm font-semibold text-text-secondary mb-1">Footer Message</label>
          <textarea
            value={formData.footer_text as string}
            onChange={e => setFormData({...formData, footer_text: e.target.value})}
            placeholder="No returns without receipt. Thank you!"
            className="input w-full min-h-[80px]"
          />
        </div>

        <div className="flex items-center gap-4 mt-4">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="button-primary"
          >
            {updateMutation.isPending ? 'Saving...' : <><Save size={18} /> Save Settings</>}
          </button>
          {updateMutation.isSuccess && (
            <span className="text-success flex items-center gap-1 font-semibold text-sm">
              <Check size={16} /> Saved Successfully
            </span>
          )}
        </div>
      </div>
    </form>
  );
}

function EditUserModal({ user, isOpen, onClose, onSave, isSaving }: { user: SettingsUser; isOpen: boolean; onClose: () => void; onSave: (updates: Record<string, unknown>) => void; isSaving: boolean }) {
  const [name, setName] = useState(user.name || user.full_name || '');
  const [role, setRole] = useState(user.role || 'cashier');
  const [pin, setPin] = useState('');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit User">
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-semibold text-text-secondary mb-1">Email</label>
          <input type="email" value={user.email || ''} disabled className="input w-full opacity-60 bg-background-subtle" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-text-secondary mb-1">Full Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} className="input w-full" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-text-secondary mb-1">Role</label>
          <select value={role} onChange={e => setRole(e.target.value)} className="input w-full">
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="cashier">Staff</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-text-secondary mb-1">New POS PIN</label>
          <input type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder="Leave blank to keep current" className="input w-full" />
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <button className="button-outline" onClick={onClose}>Cancel</button>
          <button className="button-primary" onClick={() => onSave({ name, role, ...(pin ? { pos_pin: pin } : {}) })} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </Modal>
  );
}