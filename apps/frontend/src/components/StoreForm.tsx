import { useState } from 'react'
import type { FormEvent } from 'react'
import { checkStoreCodeUnique } from '../services/stores'
import type { StoreFormData } from '../services/stores'

interface StoreFormProps {
  store?: {
    id: string
    code: string
    name: string
    address: string | null
    timezone: string
  }
  onSave: (data: StoreFormData) => Promise<void>
  onCancel: () => void
}

const TIMEZONES = [
  'Asia/Dhaka',
  'Asia/Kolkata',
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Dubai',
]

export function StoreForm({ store, onSave, onCancel }: StoreFormProps) {
  const [formData, setFormData] = useState<StoreFormData>({
    code: store?.code || '',
    name: store?.name || '',
    address: store?.address || '',
    timezone: store?.timezone || 'Asia/Dhaka',
  })

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [codeChecking, setCodeChecking] = useState(false)

  const validateCode = async (code: string) => {
    if (!code) {
      setErrors((prev) => ({ ...prev, code: 'Store code is required' }))
      return false
    }

    // Validate format: uppercase, alphanumeric and hyphens only
    if (!/^[A-Z0-9-]+$/.test(code)) {
      setErrors((prev) => ({
        ...prev,
        code: 'Code must be uppercase letters, numbers, and hyphens only',
      }))
      return false
    }

    setCodeChecking(true)
    try {
      const isUnique = await checkStoreCodeUnique(code, store?.id)
      if (!isUnique) {
        setErrors((prev) => ({ ...prev, code: 'Store code already exists' }))
        return false
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors.code
          return newErrors
        })
        return true
      }
    } catch {
      setErrors((prev) => ({ ...prev, code: 'Error checking store code' }))
      return false
    } finally {
      setCodeChecking(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      // Validate required fields
      if (!formData.code.trim()) {
        setErrors({ code: 'Store code is required' })
        setLoading(false)
        return
      }

      if (!formData.name.trim()) {
        setErrors({ name: 'Store name is required' })
        setLoading(false)
        return
      }

      // Validate code format and uniqueness
      const codeValid = await validateCode(formData.code.toUpperCase())
      if (!codeValid) {
        setLoading(false)
        return
      }

      // Prepare data with uppercase code
      const dataToSave: StoreFormData = {
        ...formData,
        code: formData.code.toUpperCase().trim(),
        name: formData.name.trim(),
        address: formData.address?.trim() || undefined,
        timezone: formData.timezone || 'Asia/Dhaka',
      }

      await onSave(dataToSave)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save store'
      setErrors({ submit: message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.submit && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-800">{errors.submit}</div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Store Code *
          </label>
          <input
            type="text"
            required
            value={formData.code}
            onChange={(e) => {
              const value = e.target.value.toUpperCase()
              setFormData({ ...formData, code: value })
              if (value) {
                validateCode(value)
              }
            }}
            placeholder="e.g., BR1, KT-A"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code}</p>}
          {codeChecking && <p className="mt-1 text-sm text-gray-500">Checking...</p>}
          <p className="mt-1 text-xs text-gray-500">
            Uppercase letters, numbers, and hyphens only
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Store Name *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value })
              setErrors((prev) => {
                const newErrors = { ...prev }
                delete newErrors.name
                return newErrors
              })
            }}
            placeholder="e.g., Main Branch"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Address</label>
        <textarea
          value={formData.address || ''}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          rows={3}
          placeholder="Store address (optional)"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Timezone</label>
        <select
          value={formData.timezone}
          onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : store ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  )
}

