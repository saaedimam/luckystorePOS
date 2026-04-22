import { useState } from 'react'
import type { FormEvent } from 'react'
import { createCategory, updateCategory, deleteCategory } from '../services/items'
import type { Category } from '../services/items'

interface CategoryManagerProps {
  categories: Category[]
  onUpdate: () => void
}

export function CategoryManager({ categories, onUpdate }: CategoryManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return

    setLoading(true)
    setError(null)

    try {
      await createCategory(newName.trim())
      setNewName('')
      onUpdate()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create category'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) {
      setEditingId(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      await updateCategory(id, editName.trim())
      setEditingId(null)
      setEditName('')
      onUpdate()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update category'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return

    setLoading(true)
    setError(null)

    try {
      await deleteCategory(id)
      onUpdate()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete category'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (category: Category) => {
    setEditingId(category.id)
    setEditName(category.name)
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Manage Categories</h3>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3">
          <div className="text-sm text-red-800">{error}</div>
        </div>
      )}

      <form onSubmit={handleCreate} className="mb-6">
        <div className="flex space-x-2">
          <label htmlFor="new-category-name" className="sr-only">
            New category name
          </label>
          <input
            id="new-category-name"
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New category name"
            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !newName.trim()}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </form>

      <div className="space-y-2">
        {categories.map((category) => (
          <div key={category.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
            {editingId === category.id ? (
              <>
                <label htmlFor={`edit-category-${category.id}`} className="sr-only">
                  Edit category name
                </label>
                <input
                  id={`edit-category-${category.id}`}
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  autoFocus
                />
                <button
                  onClick={() => handleUpdate(category.id)}
                  disabled={loading}
                  className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-700"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditingId(null)
                    setEditName('')
                  }}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-700"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm">{category.name}</span>
                <button
                  onClick={() => startEdit(category)}
                  className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  disabled={loading}
                  className="px-3 py-1 text-sm text-red-600 hover:text-red-700"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

