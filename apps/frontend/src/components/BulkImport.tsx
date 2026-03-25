import { useState } from 'react'
import type { FormEvent } from 'react'

interface ImportResult {
  import_run_id?: string | null
  rows_total?: number
  rows_valid?: number
  rows_processed?: number
  rows_succeeded?: number
  rows_failed?: number
  items_inserted?: number
  items_updated?: number
  inserted?: number
  updated?: number
  batches_created?: number
  stock_created?: number
  stock_updated?: number
  stock_movements?: number
  barcodes_generated?: number
  images_uploaded?: number
  parse_errors?: number
  row_errors?: number
  system_errors?: number
  next_row_index?: number
  processing_complete?: boolean
  can_resume?: boolean
  chunk_rows_processed?: number
  chunk_size?: number
  errors?: Array<{ row: number; code?: string; error: string }>
}

interface BulkImportProps {
  onImport: (file: File) => Promise<ImportResult>
  onSuccess?: () => void | Promise<void>
  currentStoreCode?: string | null
}

export function BulkImport({ onImport, onSuccess, currentStoreCode }: BulkImportProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)

  const MAX_FILE_SIZE_MB = 20

  const handleFileSelect = (nextFile: File | null) => {
    if (!nextFile) {
      setFile(null)
      return
    }

    const lowerName = nextFile.name.toLowerCase()
    const allowed = lowerName.endsWith('.csv') || lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')
    if (!allowed) {
      setError('Unsupported file type. Please choose a CSV or Excel file.')
      setFile(null)
      return
    }

    const maxBytes = MAX_FILE_SIZE_MB * 1024 * 1024
    if (nextFile.size > maxBytes) {
      setError(`File is too large. Maximum allowed size is ${MAX_FILE_SIZE_MB} MB.`)
      setFile(null)
      return
    }

    setError(null)
    setFile(nextFile)
  }

  const downloadTemplateCsv = () => {
    const rows = [
      'name,barcode,sku,category,cost,price,description,image_url,store_code,stock_qty',
      'Demo Item 1,1234567890123,SKU-001,General,50,70,Sample description,https://example.com/item1.jpg,STORE001,20',
      'Demo Item 2,,SKU-002,General,80,120,Another sample item,,STORE001,15',
    ]
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'inventory-import-template.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const downloadErrorsCsv = (errors: Array<{ row: number; code?: string; error: string }>) => {
    const header = ['row', 'code', 'error']
    const lines = errors.map((entry) => {
      const escapedError = `"${entry.error.replaceAll('"', '""')}"`
      return [entry.row, entry.code ?? '', escapedError].join(',')
    })
    const csv = [header.join(','), ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `import-errors-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!file) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const importResult = await onImport(file)
      setResult(importResult)
      setFile(null)
      // Reset file input
      const fileInput = document.getElementById('csv-file') as HTMLInputElement
      if (fileInput) fileInput.value = ''

      // Call success callback to refresh items list
      if (onSuccess) {
        try {
          await onSuccess()
        } catch (refreshErr) {
          console.error('Failed to refresh items after import:', refreshErr)
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to import items'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Bulk Import Items</h3>
      <p className="text-sm text-gray-600 mb-4">
        Upload a CSV or Excel file to import multiple items at once. The file should include columns:
        name, barcode, sku, category, cost, price, description, image_url, store_code, stock_qty
      </p>
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={downloadTemplateCsv}
          className="text-xs px-3 py-1.5 rounded-md border border-indigo-300 text-indigo-700 hover:bg-indigo-50"
        >
          Download template CSV
        </button>
        <span className="text-xs text-gray-500 self-center">
          Max file size: {MAX_FILE_SIZE_MB} MB
        </span>
      </div>
      <div className="mb-4 rounded-md bg-indigo-50 p-3 text-xs text-indigo-900">
        Stock is imported using the `store_code` in each row.
        {currentStoreCode
          ? ` The items table below is currently showing stock for ${currentStoreCode}, so switch stores after import if your file targets a different code.`
          : ' Select a store in the page header to verify imported quantities after the upload finishes.'}
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3">
          <div className="text-sm text-red-800">{error}</div>
        </div>
      )}

      {result && (
        <div className="mb-4 rounded-md bg-green-50 p-4">
          <div className="text-sm font-semibold text-green-800 mb-2">
            Import finished
          </div>
          <div className="text-xs text-green-900 mb-3">
            {result.rows_succeeded ?? 0} succeeded / {result.rows_failed ?? 0} failed
            {(result.rows_total ?? 0) > 0 ? ` (total ${result.rows_total})` : ''}
            {result.import_run_id ? ` | run ${result.import_run_id}` : ''}
            {result.chunk_rows_processed !== undefined
              ? ` | chunk ${result.chunk_rows_processed}/${result.chunk_size ?? 0}`
              : ''}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {result.rows_valid !== undefined && (
              <div>
                <span className="text-green-700 font-medium">Valid Rows:</span>{' '}
                <span className="text-green-900">{result.rows_valid}</span>
              </div>
            )}
            {result.rows_processed !== undefined && (
              <div>
                <span className="text-green-700 font-medium">Processed Rows:</span>{' '}
                <span className="text-green-900">{result.rows_processed}</span>
              </div>
            )}
            <div>
              <span className="text-green-700 font-medium">Inserted:</span>{' '}
              <span className="text-green-900">
                {result.items_inserted ?? result.inserted ?? 0}
              </span>
            </div>
            <div>
              <span className="text-green-700 font-medium">Updated:</span>{' '}
              <span className="text-green-900">
                {result.items_updated ?? result.updated ?? 0}
              </span>
            </div>
            {result.barcodes_generated !== undefined && (
              <div>
                <span className="text-green-700 font-medium">Barcodes Generated:</span>{' '}
                <span className="text-green-900">{result.barcodes_generated}</span>
              </div>
            )}
            {result.batches_created !== undefined && (
              <div>
                <span className="text-green-700 font-medium">Batches Created:</span>{' '}
                <span className="text-green-900">{result.batches_created}</span>
              </div>
            )}
            {result.stock_created !== undefined && (
              <div>
                <span className="text-green-700 font-medium">Stock Created:</span>{' '}
                <span className="text-green-900">{result.stock_created}</span>
              </div>
            )}
            {result.stock_updated !== undefined && (
              <div>
                <span className="text-green-700 font-medium">Stock Updated:</span>{' '}
                <span className="text-green-900">{result.stock_updated}</span>
              </div>
            )}
            {result.images_uploaded !== undefined && (
              <div>
                <span className="text-green-700 font-medium">Images Uploaded:</span>{' '}
                <span className="text-green-900">{result.images_uploaded}</span>
              </div>
            )}
            {result.errors && result.errors.length > 0 && (
              <div className="col-span-full">
                <span className="text-red-700 font-medium">Errors:</span>{' '}
                <span className="text-red-900">{result.errors.length}</span>
              </div>
            )}
            {result.parse_errors !== undefined && (
              <div>
                <span className="text-red-700 font-medium">Parse Errors:</span>{' '}
                <span className="text-red-900">{result.parse_errors}</span>
              </div>
            )}
            {result.row_errors !== undefined && (
              <div>
                <span className="text-red-700 font-medium">Row Errors:</span>{' '}
                <span className="text-red-900">{result.row_errors}</span>
              </div>
            )}
            {result.system_errors !== undefined && (
              <div>
                <span className="text-red-700 font-medium">System Errors:</span>{' '}
                <span className="text-red-900">{result.system_errors}</span>
              </div>
            )}
          </div>
          {!result.processing_complete && result.can_resume && (
            <div className="mt-3 rounded-md bg-amber-50 p-3 text-xs text-amber-900">
              Import is running in resumable chunks. Keep this page open until completion for best
              reliability.
            </div>
          )}
          {currentStoreCode &&
            ((result.stock_created ?? 0) > 0 ||
              (result.stock_updated ?? 0) > 0 ||
              (result.stock_movements ?? 0) > 0) && (
              <div className="mt-3 rounded-md bg-white/70 p-3 text-xs text-green-900">
                The table below is showing stock for {currentStoreCode}. If this file imported stock
                into another `store_code`, switch the store selector to confirm the updated quantity.
              </div>
            )}
          {result.errors && result.errors.length > 0 && (
            <div className="mt-3 pt-3 border-t border-green-200">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-medium text-red-700">
                  Error Details:
                </div>
                <button
                  type="button"
                  onClick={() => downloadErrorsCsv(result.errors ?? [])}
                  className="text-xs px-2 py-1 rounded border border-red-300 text-red-700 hover:bg-red-100"
                >
                  Download failed rows (CSV)
                </button>
              </div>
              <div className="max-h-32 overflow-y-auto text-xs text-red-600">
                {result.errors.slice(0, 10).map((err, idx) => (
                  <div key={idx} className="mb-1">
                    Row {err.row}
                    {err.code ? ` [${err.code}]` : ''}: {err.error}
                  </div>
                ))}
                {result.errors.length > 10 && (
                  <div className="text-red-500 italic">
                    ... and {result.errors.length - 10} more errors
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="csv-file" className="sr-only">
            CSV or Excel file
          </label>
          <input
            id="csv-file"
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            required
            aria-label="CSV or Excel file"
          />
          {file && (
            <div className="mt-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700 flex items-center justify-between">
              <span>
                Selected: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)
              </span>
              <button
                type="button"
                onClick={() => {
                  setFile(null)
                  const fileInput = document.getElementById('csv-file') as HTMLInputElement | null
                  if (fileInput) fileInput.value = ''
                }}
                className="text-red-600 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={loading || !file}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Importing...' : 'Import Items'}
        </button>
      </form>

      <div className="mt-4 text-xs text-gray-500">
        <p>Note: The import function will:</p>
        <ul className="list-disc list-inside mt-1">
          <li>Create categories if they don't exist</li>
          <li>Update items if barcode/SKU matches</li>
          <li>Auto-generate barcodes if missing</li>
          <li>Create stock levels if store_code and stock_qty provided</li>
        </ul>
      </div>
    </div>
  )
}

