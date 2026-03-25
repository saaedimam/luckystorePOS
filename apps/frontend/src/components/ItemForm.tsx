import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { checkBarcodeUnique, checkSkuUnique, uploadItemImage } from '../services/items'
import type { ItemFormData, Category } from '../services/items'

interface ItemFormProps {
  item?: {
    id: string
    sku: string | null
    barcode: string | null
    name: string
    category_id: string | null
    description: string | null
    cost: number
    price: number
    image_url: string | null
    active: boolean
  }
  categories: Category[]
  onSave: (data: ItemFormData) => Promise<void>
  onCancel: () => void
}

export function ItemForm({ item, categories, onSave, onCancel }: ItemFormProps) {
  const [formData, setFormData] = useState<ItemFormData>({
    sku: item?.sku || '',
    barcode: item?.barcode || '',
    name: item?.name || '',
    category_id: item?.category_id || '',
    description: item?.description || '',
    cost: item?.cost || 0,
    price: item?.price || 0,
    image_url: item?.image_url || '',
    active: item?.active ?? true,
  })

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(item?.image_url || null)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [barcodeChecking, setBarcodeChecking] = useState(false)
  const [skuChecking, setSkuChecking] = useState(false)

  useEffect(() => {
    if (imageFile) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(imageFile)
    }
  }, [imageFile])

  const validateBarcode = async (barcode: string) => {
    if (!barcode) return true

    setBarcodeChecking(true)
    try {
      const isUnique = await checkBarcodeUnique(barcode, item?.id)
      if (!isUnique) {
        setErrors((prev) => ({ ...prev, barcode: 'Barcode already exists' }))
        return false
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors.barcode
          return newErrors
        })
        return true
      }
    } catch {
      setErrors((prev) => ({ ...prev, barcode: 'Error checking barcode' }))
      return false
    } finally {
      setBarcodeChecking(false)
    }
  }

  const validateSku = async (sku: string) => {
    if (!sku) return true

    setSkuChecking(true)
    try {
      const isUnique = await checkSkuUnique(sku, item?.id)
      if (!isUnique) {
        setErrors((prev) => ({ ...prev, sku: 'SKU already exists' }))
        return false
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors.sku
          return newErrors
        })
        return true
      }
    } catch {
      setErrors((prev) => ({ ...prev, sku: 'Error checking SKU' }))
      return false
    } finally {
      setSkuChecking(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      // Validate barcode and SKU
      if (formData.barcode) {
        const barcodeValid = await validateBarcode(formData.barcode)
        if (!barcodeValid) {
          setLoading(false)
          return
        }
      }

      if (formData.sku) {
        const skuValid = await validateSku(formData.sku)
        if (!skuValid) {
          setLoading(false)
          return
        }
      }

      // Upload image if provided
      let imageUrl = formData.image_url
      if (imageFile) {
        imageUrl = await uploadItemImage(imageFile, formData.name)
      }

      // Prepare data
      const dataToSave: ItemFormData = {
        ...formData,
        image_url: imageUrl || undefined,
        sku: formData.sku || undefined,
        barcode: formData.barcode || undefined,
        category_id: formData.category_id || undefined,
        description: formData.description || undefined,
      }

      await onSave(dataToSave)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save item'
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
          <label className="block text-sm font-medium text-gray-700">Name *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <select
            value={formData.category_id || ''}
            onChange={(e) => setFormData({ ...formData, category_id: e.target.value || undefined })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">No Category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">SKU</label>
          <input
            type="text"
            value={formData.sku || ''}
            onChange={(e) => {
              setFormData({ ...formData, sku: e.target.value })
              if (e.target.value) {
                validateSku(e.target.value)
              }
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          {errors.sku && <p className="mt-1 text-sm text-red-600">{errors.sku}</p>}
          {skuChecking && <p className="mt-1 text-sm text-gray-500">Checking...</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Barcode</label>
          <input
            type="text"
            value={formData.barcode || ''}
            onChange={(e) => {
              setFormData({ ...formData, barcode: e.target.value })
              if (e.target.value) {
                validateBarcode(e.target.value)
              }
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          {errors.barcode && <p className="mt-1 text-sm text-red-600">{errors.barcode}</p>}
          {barcodeChecking && <p className="mt-1 text-sm text-gray-500">Checking...</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Cost (BDT)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.cost}
            onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Price (BDT) *</label>
          <input
            type="number"
            step="0.01"
            min="0"
            required
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              setImageFile(file)
            }
          }}
          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
        />
        {imagePreview && (
          <div className="mt-2">
            <img src={imagePreview} alt="Preview" className="h-32 w-32 object-cover rounded" />
          </div>
        )}
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="active"
          checked={formData.active}
          onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        />
        <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
          Active
        </label>
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
          {loading ? 'Saving...' : item ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  )
}

