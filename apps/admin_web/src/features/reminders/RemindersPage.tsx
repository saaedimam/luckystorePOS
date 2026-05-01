import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import { Skeleton } from '../../components/Skeleton';
import { Bell, Plus, Edit3, Trash2, Check, X, Calendar, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import type { Reminder, ReminderType } from '../../lib/api/types';

const REMINDER_TYPES: { value: ReminderType; label: string }[] = [
  { value: 'payment_due', label: 'Payment Due' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'stock_check', label: 'Stock Check' },
  { value: 'other', label: 'Other' },
];

const TYPE_COLORS: Record<ReminderType, { bg: string; text: string }> = {
  payment_due: { bg: 'rgba(239, 68, 68, 0.1)', text: 'var(--color-danger)' },
  follow_up: { bg: 'rgba(59, 130, 246, 0.1)', text: 'var(--color-info)' },
  stock_check: { bg: 'rgba(245, 158, 11, 0.1)', text: 'var(--color-warning)' },
  other: { bg: 'rgba(100, 116, 139, 0.1)', text: 'var(--text-muted)' },
};

function formatReminderDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function daysLabel(days: number): string {
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `In ${days}d`;
}

export function RemindersPage() {
  const { tenantId, storeId, user } = useAuth();
  const queryClient = useQueryClient();
  const [showCompleted, setShowCompleted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: reminders, isLoading, error } = useQuery({
    queryKey: ['reminders', storeId, showCompleted],
    queryFn: () => api.reminders.list(storeId, showCompleted),
  });

  const createMutation = useMutation({
    mutationFn: (params: Parameters<typeof api.reminders.create>[0]) => api.reminders.create(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders', storeId] });
      setShowModal(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (params: Parameters<typeof api.reminders.update>[0]) => api.reminders.update(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders', storeId] });
      setShowModal(false);
      setEditingReminder(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.reminders.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders', storeId] });
      setDeleteConfirm(null);
    },
  });

  const toggleCompleteMutation = useMutation({
    mutationFn: (r: Reminder) => api.reminders.update({
      reminderId: r.id,
      isCompleted: !r.isCompleted,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders', storeId] });
    },
  });

  const handleOpenCreate = () => {
    setEditingReminder(null);
    setShowModal(true);
  };

  const handleOpenEdit = (r: Reminder) => {
    setEditingReminder(r);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    setDeleteConfirm(id);
  };

  if (error) {
    return (
      <div className="dashboard-container">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', color: 'var(--color-danger)' }}>
          <AlertCircle size={20} />
          <span>Failed to load reminders. {(error as Error).message}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700', color: 'var(--text-main)' }}>Reminders</h1>
        <p style={{ color: 'var(--text-muted)' }}>Track upcoming payments, follow-ups, and stock checks.</p>
      </header>

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className={clsx('tab-btn', showCompleted && 'active')}
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-4)',
              borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)',
              backgroundColor: showCompleted ? 'var(--color-primary)' : 'transparent',
              color: showCompleted ? '#000' : 'var(--text-muted)', fontWeight: '600', cursor: 'pointer',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            <Check size={16} /> Show completed
          </button>
        </div>
        <button onClick={handleOpenCreate} className="button-primary" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Plus size={18} /> New Reminder
        </button>
      </div>

      {/* Reminder List */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} style={{ height: '72px', width: '100%' }} />
          ))}
        </div>
      ) : !reminders || reminders.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <Bell size={48} style={{ color: 'var(--text-light)', margin: '0 auto var(--space-4)' }} />
          <p style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--text-main)', marginBottom: 'var(--space-2)' }}>
            No reminders yet
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
            Create your first reminder to stay on top of payments, follow-ups, and stock checks.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {reminders.map((r) => {
            const days = daysUntil(r.reminderDate);
            const typeColor = TYPE_COLORS[r.reminderType] || TYPE_COLORS.other;
            const typeLabel = REMINDER_TYPES.find(t => t.value === r.reminderType)?.label ?? 'Other';
            const isOverdue = days < 0;

            return (
              <div
                key={r.id}
                className="card"
                style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-4) var(--space-6)',
                  opacity: r.isCompleted ? 0.6 : 1,
                  borderLeft: isOverdue && !r.isCompleted ? '3px solid var(--color-danger)' : isOverdue ? 'none' : 'none',
                }}
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggleCompleteMutation.mutate(r)}
                  style={{
                    width: '24px', height: '24px', borderRadius: 'var(--radius-sm)', flexShrink: 0,
                    border: r.isCompleted ? '2px solid var(--color-success)' : '2px solid var(--border-color)',
                    backgroundColor: r.isCompleted ? 'var(--color-success)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {r.isCompleted && <Check size={14} style={{ color: '#fff' }} />}
                </button>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-1)' }}>
                    <span style={{ fontWeight: '600', color: r.isCompleted ? 'var(--text-light)' : 'var(--text-main)', textDecoration: r.isCompleted ? 'line-through' : 'none' }}>
                      {r.title}
                    </span>
                    <span style={{
                      padding: '1px 8px', borderRadius: '12px', fontSize: 'var(--font-size-xs)', fontWeight: '600',
                      backgroundColor: typeColor.bg, color: typeColor.text,
                    }}>
                      {typeLabel}
                    </span>
                    {isOverdue && !r.isCompleted && (
                      <span style={{
                        padding: '1px 8px', borderRadius: '12px', fontSize: 'var(--font-size-xs)', fontWeight: '600',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)',
                      }}>
                        Overdue
                      </span>
                    )}
                  </div>
                  {r.description && (
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.description}
                    </p>
                  )}
                </div>

                {/* Date */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0, gap: '2px' }}>
                  <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: '600', color: isOverdue && !r.isCompleted ? 'var(--color-danger)' : 'var(--text-main)' }}>
                    {formatReminderDate(r.reminderDate)}
                  </span>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: isOverdue && !r.isCompleted ? 'var(--color-danger)' : 'var(--text-muted)' }}>
                    {daysLabel(days)}
                  </span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', flexShrink: 0 }}>
                  <button
                    onClick={() => handleOpenEdit(r)}
                    title="Edit"
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      padding: 'var(--space-2)', borderRadius: 'var(--radius-md)',
                      backgroundColor: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', border: 'none',
                      transition: 'background-color var(--transition-fast)',
                    }}
                  >
                    <Edit3 size={16} />
                  </button>
                  {deleteConfirm === r.id ? (
                    <div style={{ display: 'flex', gap: '2px' }}>
                      <button
                        onClick={() => deleteMutation.mutate(r.id)}
                        className="button-danger"
                        style={{ padding: 'var(--space-1) var(--space-2)', fontSize: 'var(--font-size-xs)', minHeight: '28px', minWidth: '28px' }}
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="button-outline"
                        style={{ padding: 'var(--space-1) var(--space-2)', fontSize: 'var(--font-size-xs)', minHeight: '28px', minWidth: '28px' }}
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleDelete(r.id)}
                      title="Delete"
                      style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        padding: 'var(--space-2)', borderRadius: 'var(--radius-md)',
                        backgroundColor: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', border: 'none',
                        transition: 'background-color var(--transition-fast)',
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <ReminderModal
          reminder={editingReminder}
          tenantId={tenantId}
          storeId={storeId}
          userId={user?.id ?? null}
          onSubmit={editingReminder
            ? (params) => updateMutation.mutate({ reminderId: editingReminder.id, ...params })
            : (params) => createMutation.mutate(params)
          }
          isLoading={createMutation.isPending || updateMutation.isPending}
          error={createMutation.error?.message || updateMutation.error?.message}
          onClose={() => { setShowModal(false); setEditingReminder(null); }}
        />
      )}
    </div>
  );
}

interface ReminderModalProps {
  reminder: Reminder | null;
  tenantId: string;
  storeId: string;
  userId: string | null;
  onSubmit: (params: {
    tenantId: string;
    storeId: string;
    title: string;
    description: string | null;
    reminderDate: string;
    reminderType: string;
    createdBy: string | null;
  }) => void;
  isLoading: boolean;
  error?: string;
  onClose: () => void;
}

function ReminderModal({ reminder, tenantId, storeId, userId, onSubmit, isLoading, error, onClose }: ReminderModalProps) {
  const [title, setTitle] = useState(reminder?.title ?? '');
  const [description, setDescription] = useState(reminder?.description ?? '');
  const [reminderDate, setReminderDate] = useState(reminder?.reminderDate ?? '');
  const [reminderType, setReminderType] = useState<ReminderType>(reminder?.reminderType ?? 'other');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      tenantId,
      storeId,
      title: title.trim(),
      description: description.trim() || null,
      reminderDate,
      reminderType,
      createdBy: userId,
    });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(2px)',
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '480px', padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '700', color: 'var(--text-main)' }}>
            {reminder ? 'Edit Reminder' : 'New Reminder'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)', padding: 'var(--space-2) var(--space-3)',
            marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-xs)', color: 'var(--color-danger)',
          }}>
            <AlertCircle size={14} />{error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: '600', color: 'var(--text-muted)', marginBottom: 'var(--space-1)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Pay supplier due"
              style={{
                width: '100%', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: '600', color: 'var(--text-muted)', marginBottom: 'var(--space-1)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details..."
              style={{
                width: '100%', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)',
                minHeight: '80px', resize: 'vertical',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: '600', color: 'var(--text-muted)', marginBottom: 'var(--space-1)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <Calendar size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                Date *
              </label>
              <input
                type="date"
                required
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
                style={{
                  width: '100%', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: '600', color: 'var(--text-muted)', marginBottom: 'var(--space-1)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Type *
              </label>
              <select
                value={reminderType}
                onChange={(e) => setReminderType(e.target.value as ReminderType)}
                style={{
                  width: '100%', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)',
                }}
              >
                {REMINDER_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)', paddingTop: 'var(--space-2)' }}>
            <button type="button" onClick={onClose} className="button-outline" style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="button-primary" style={{ flex: 1, opacity: isLoading ? 0.7 : 1 }}>
              {isLoading ? 'Saving...' : reminder ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}