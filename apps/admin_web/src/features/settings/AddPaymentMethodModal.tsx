import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Modal } from '../../components/ui/Modal';
import { clsx } from 'clsx';

const PAYMENT_TYPES = [
  { value: 'cash', label: 'Cash' },
  { value: 'mobile_banking', label: 'bKash / Mobile Banking' },
  { value: 'card', label: 'Card' },
  { value: 'other', label: 'Other' },
] as const;

interface AddPaymentMethodModalProps {
  isOpen: boolean;
  storeId: string;
  onClose: () => void;
}

export function AddPaymentMethodModal({ isOpen, storeId, onClose }: AddPaymentMethodModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    type: 'cash',
    isActive: true,
  });
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: (method: { name: string; type: string; isActive: boolean }) => api.settings.addPaymentMethod(storeId, method),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-payments'] });
      setFormData({ name: '', type: 'cash', isActive: true });
      setError(null);
      onClose();
    },
    onError: (err: unknown) => {
      setError(err instanceof Error ? err.message : 'Failed to add payment method');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    createMutation.mutate({
      name: formData.name,
      type: formData.type,
      isActive: formData.isActive,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Payment Method">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="form-group">
          <label className="block text-sm font-semibold text-text-secondary mb-1">
            Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="e.g. Nagad"
            className="w-full p-3 border border-border-default rounded-md bg-background-subtle text-text-primary outline-none focus:border-primary-default"
          />
        </div>

        <div className="form-group">
          <label className="block text-sm font-semibold text-text-secondary mb-1">
            Type
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full p-3 border border-border-default rounded-md bg-background-subtle text-text-primary outline-none focus:border-primary-default"
          >
            {PAYMENT_TYPES.map((pt) => (
              <option key={pt.value} value={pt.value}>
                {pt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between py-3">
          <label className="text-sm font-semibold text-text-secondary">
            Active
          </label>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
            className={clsx(
              'w-11 h-6 rounded-full relative transition-colors border-none cursor-pointer',
              formData.isActive ? 'bg-success' : 'bg-border'
            )}
          >
            <span
              className={clsx(
                'absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all',
                formData.isActive ? 'left-[22px]' : 'left-0.5'
              )}
            />
          </button>
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
            <Plus size={18} /> {createMutation.isPending ? 'Adding...' : 'Add Payment Method'}
          </button>
        </div>
      </form>
    </Modal>
  );
}