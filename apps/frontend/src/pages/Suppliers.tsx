import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getSuppliers,
  upsertSupplier,
  deleteSupplier,
  type Supplier,
  type SupplierFormData,
} from '../services/purchaseOrders'

const EMPTY_FORM: SupplierFormData = {
  name: '', contact: '', phone: '', email: '', address: '', notes: '', active: true,
}

export function Suppliers() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState<Supplier | null | 'new'>(null)
  const [form, setForm]  = useState<SupplierFormData>(EMPTY_FORM)
  const [formErr, setFormErr] = useState<string | null>(null)

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: getSuppliers,
  })

  const saveMutation = useMutation({
    mutationFn: (data: SupplierFormData & { id?: string }) => upsertSupplier(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['suppliers'] }); setEditing(null) },
    onError: (e: Error) => setFormErr(e.message),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSupplier,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  })

  const openNew  = () => { setForm(EMPTY_FORM); setFormErr(null); setEditing('new') }
  const openEdit = (s: Supplier) => { setForm({ name: s.name, contact: s.contact || '', phone: s.phone || '', email: s.email || '', address: s.address || '', notes: s.notes || '', active: s.active }); setFormErr(null); setEditing(s) }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setFormErr('Supplier name is required'); return }
    saveMutation.mutate(editing && editing !== 'new' ? { ...form, id: editing.id } : form)
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
        <button onClick={openNew} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700">
          Add Supplier
        </button>
      </div>

      {/* Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading suppliers…</div>
        ) : suppliers.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No suppliers yet. Add your first one!</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Name','Contact','Phone','Email','Status','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {suppliers.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                  <td className="px-4 py-3 text-gray-600">{s.contact || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{s.phone || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{s.email || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${s.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                      {s.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 space-x-3">
                    <button onClick={() => openEdit(s)} className="text-indigo-600 hover:text-indigo-900 font-medium">Edit</button>
                    <button
                      onClick={() => { if (confirm(`Delete supplier "${s.name}"?`)) deleteMutation.mutate(s.id) }}
                      className="text-red-600 hover:text-red-900 font-medium"
                    >Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Slide-in Form Modal */}
      {editing !== null && (
        <div className="fixed inset-0 z-50 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 m-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">{editing === 'new' ? 'Add Supplier' : 'Edit Supplier'}</h2>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>

            {formErr && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded">{formErr}</div>}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full rounded-md border-gray-300 shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                  <input value={form.contact || ''} onChange={e => setForm({...form, contact: e.target.value})} className="w-full rounded-md border-gray-300 shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} className="w-full rounded-md border-gray-300 shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})} className="w-full rounded-md border-gray-300 shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea rows={2} value={form.address || ''} onChange={e => setForm({...form, address: e.target.value})} className="w-full rounded-md border-gray-300 shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea rows={2} value={form.notes || ''} onChange={e => setForm({...form, notes: e.target.value})} className="w-full rounded-md border-gray-300 shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="active-sup" checked={form.active} onChange={e => setForm({...form, active: e.target.checked})} className="h-4 w-4 text-indigo-600 rounded border-gray-300" />
                <label htmlFor="active-sup" className="text-sm text-gray-700">Active</label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saveMutation.isPending} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50">
                  {saveMutation.isPending ? 'Saving…' : 'Save Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
