import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Modal } from '../../components/ui/Modal';

interface AddUserModalProps {
  isOpen: boolean;
  storeId: string;
  tenantId: string;
  onClose: () => void;
}

export function AddUserModal({ isOpen, storeId, tenantId, onClose }: AddUserModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'cashier',
    pin: '',
  });
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: (user: { email: string; password: string; fullName: string; role: string; pin: string; tenantId: string }) => api.settings.addUser(storeId, user),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-users'] });
      setFormData({ fullName: '', email: '', password: '', role: 'cashier', pin: '' });
      setError(null);
      onClose();
    },
    onError: (err: unknown) => {
      setError(err instanceof Error ? err.message : 'Failed to add user');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (formData.pin.length < 4) {
      setError('PIN must be at least 4 digits');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    createMutation.mutate({
      email: formData.email,
      password: formData.password,
      fullName: formData.fullName,
      role: formData.role,
      pin: formData.pin,
      tenantId,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add User">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="form-group">
          <label className="block text-sm font-semibold text-text-secondary mb-1">
            Full Name
          </label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            required
            placeholder="Rahim Uddin"
            className="w-full p-3 border border-border-default rounded-md bg-background-subtle text-text-primary outline-none focus:border-primary-default"
          />
        </div>

        <div className="form-group">
          <label className="block text-sm font-semibold text-text-secondary mb-1">
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            placeholder="rahim@luckystore.com"
            className="w-full p-3 border border-border-default rounded-md bg-background-subtle text-text-primary outline-none focus:border-primary-default"
          />
        </div>

        <div className="form-group">
          <label className="block text-sm font-semibold text-text-secondary mb-1">
            Password
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            placeholder="Minimum 6 characters"
            className="w-full p-3 border border-border-default rounded-md bg-background-subtle text-text-primary outline-none focus:border-primary-default"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="block text-sm font-semibold text-text-secondary mb-1">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full p-3 border border-border-default rounded-md bg-background-subtle text-text-primary outline-none focus:border-primary-default"
            >
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="cashier">Staff</option>
            </select>
          </div>
          <div className="form-group">
            <label className="block text-sm font-semibold text-text-secondary mb-1">
              POS PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={formData.pin}
              onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '') })}
              required
              placeholder="4-6 digits"
              className="w-full p-3 border border-border-default rounded-md bg-background-subtle text-text-primary outline-none focus:border-primary-default"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-danger/10 border border-danger/25 text-danger rounded-md text-sm font-medium">
            {error}
          </div>
        )}

        <div className="mt-2 pt-4 border-t border-border-default">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="button-primary w-full flex items-center justify-center gap-2 font-semibold"
            style={{ opacity: createMutation.isPending ? 0.7 : 1 }}
          >
            <UserPlus size={18} /> {createMutation.isPending ? 'Adding...' : 'Add User'}
          </button>
        </div>
      </form>
    </Modal>
  );
}