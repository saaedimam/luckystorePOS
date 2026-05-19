import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.104.1"
import { jsPDF } from "https://esm.sh/jspdf@2.5.1"
import "https://esm.sh/jspdf-autotable@3.5.28"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { saleId } = await req.json()
    
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Fetch Sale Data
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .select(`
        *,
        store:stores(*),
        items:sale_items(
          *,
          product:products(name_en, name_bn)
        )
      `)
      .eq('id', saleId)
      .single()

    if (saleError || !sale) {
      throw new Error('Sale not found')
    }

    // 2. Generate PDF
    const doc = new jsPDF({
      unit: 'mm',
      format: [80, 200] // Receipt format
    })

    const margin = 5
    let y = 10

    // Header
    doc.setFontSize(12)
    doc.text(sale.store.name, 40, y, { align: 'center' })
    y += 5
    doc.setFontSize(8)
    doc.text(sale.store.address || '', 40, y, { align: 'center' })
    y += 10

    doc.text(`Inv: ${sale.sale_number || sale.id.slice(0,8)}`, margin, y)
    y += 5
    doc.text(`Date: ${new Date(sale.created_at).toLocaleString()}`, margin, y)
    y += 10

    // Items Table
    const tableData = sale.items.map((item: any) => [
      item.product.name_en,
      item.qty,
      item.unit_price.toFixed(2),
      (item.qty * item.unit_price).toFixed(2)
    ])

    // @ts-ignore: jspdf-autotable adds autoTable to doc
    doc.autoTable({
      startY: y,
      head: [['Item', 'Qty', 'Price', 'Total']],
      body: tableData,
      theme: 'plain',
      styles: { fontSize: 7, cellPadding: 1 },
      margin: { left: margin, right: margin }
    })

    // @ts-ignore
    y = doc.lastAutoTable.finalY + 10

    // Totals
    doc.setFontSize(10)
    doc.text(`Total: ৳${sale.total_amount.toFixed(2)}`, 75, y, { align: 'right' })
    y += 10

    doc.setFontSize(8)
    doc.text('Thank you for shopping!', 40, y, { align: 'center' })

    const pdfBase64 = doc.output('arraybuffer')

    // 3. Upload to Storage
    const fileName = `${sale.tenant_id}/${sale.id}.pdf`
    const { error: uploadError } = await supabase.storage
      .from('invoices')
      .upload(fileName, pdfBase64, {
        contentType: 'application/pdf',
        upsert: true
      })

    if (uploadError) throw uploadError

    // 4. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('invoices')
      .getPublicUrl(fileName)

    return new Response(
      JSON.stringify({ publicUrl }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
