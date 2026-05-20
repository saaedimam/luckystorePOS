import { useRef, useEffect, useState } from 'react';
import { Printer, X, MessageCircle, Loader2 } from 'lucide-react';
import type { CartItem } from '../../lib/api/types';
import { supabase } from '../../lib/supabase';
import { salesService } from '../../services/sales/salesService';

interface ReceiptConfig {
  store_name: string;
  header_text: string;
  footer_text: string;
}

interface ReceiptPreviewProps {
  cart: CartItem[];
  subtotal: number;
  discount: number;
  totalAmount: number;
  paymentMethod: string;
  paidAmount: number;
  changeAmount: number;
  saleNumber?: string;
  batchId?: string;
  receiptConfig: ReceiptConfig | null;
  onClose: () => void;
}

function formatDate(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

function formatPrice(amount: number): string {
  return `৳${amount.toFixed(2)}`;
}

export function ReceiptPreview({
  cart,
  subtotal,
  discount,
  totalAmount,
  paymentMethod,
  paidAmount,
  changeAmount,
  saleNumber,
  batchId,
  receiptConfig,
  onClose,
}: ReceiptPreviewProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = async () => {
    const phoneNumber = window.prompt('Enter Customer WhatsApp Number (with country code, e.g., 88017...):');
    if (!phoneNumber) return;

    if (!batchId) {
      alert('Sale ID is missing. Cannot generate server invoice.');
      return;
    }

    setIsSharing(true);
    try {
      const storeName = receiptConfig?.store_name || 'Lucky Store';
      
      // Call Edge Function to generate and upload PDF
      const { data, error } = await supabase.functions.invoke('send-invoice', {
        body: { saleId: batchId }
      });

      if (error) throw error;
      if (!data?.publicUrl) throw new Error('No public URL returned from server.');

      const publicUrl = data.publicUrl;

      // Update sale info with phone number and PDF link
      await salesService.updateWhatsAppInfo(batchId, phoneNumber, publicUrl);

      const message = `Hello! Here is your invoice from ${storeName}: ${publicUrl}`;
      const whatsappUrl = `https://wa.me/${phoneNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
      
      window.open(whatsappUrl, '_blank');
    } catch (error) {
      console.error('WhatsApp Share Error:', error);
      alert('Failed to share invoice via WhatsApp. Error: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsSharing(false);
    }
  };

  const storeName = receiptConfig?.store_name || 'Lucky Store';
  const headerText = receiptConfig?.header_text || '';
  const footerText = receiptConfig?.footer_text || '';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="receipt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="receipt-modal-header">
          <h2>Sale Complete</h2>
          <div className="receipt-modal-actions">
            <button className="button-whatsapp" onClick={handleWhatsAppShare} disabled={isSharing}>
              {isSharing ? <Loader2 className="animate-spin" size={16} /> : <MessageCircle size={16} />}
              WhatsApp
            </button>
            <button className="button-primary" onClick={handlePrint}>
              <Printer size={16} /> Print Receipt
            </button>
            <button className="button-outline" onClick={onClose}>
              <X size={16} /> Close
            </button>
          </div>
        </div>

        {saleNumber && (
          <div className="receipt-sale-number">
            Sale #{saleNumber}
          </div>
        )}

        <div className="receipt-scroll-area">
          <div className="receipt-paper" ref={receiptRef}>
            <div className="receipt-content">
              {headerText && (
                <div className="receipt-header-msg">{headerText}</div>
              )}

              <div className="receipt-store-name">{storeName}</div>
              <div className="receipt-divider" />

              <div className="receipt-date">{formatDate()}</div>
              {saleNumber && (
                <div className="receipt-sale-id">Ref: {saleNumber}</div>
              )}

              <div className="receipt-divider receipt-divider--dashed" />

              <div className="receipt-items">
                {cart.map((item) => (
                  <div key={item.product.id} className="receipt-item">
                    <div className="receipt-item-name">{item.product.name}</div>
                    <div className="receipt-item-detail">
                      <span>{formatPrice(item.unitPrice)} × {item.qty}</span>
                      <span className="receipt-item-total">{formatPrice(item.lineTotal)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="receipt-divider receipt-divider--dashed" />

              <div className="receipt-totals">
                <div className="receipt-total-row">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="receipt-total-row receipt-total-row--discount">
                    <span>Discount</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="receipt-divider receipt-divider--dashed" />
                <div className="receipt-total-row receipt-total-row--grand">
                  <span>Total</span>
                  <span>{formatPrice(totalAmount)}</span>
                </div>
                <div className="receipt-total-row">
                  <span>Payment ({paymentMethod})</span>
                  <span>{formatPrice(paidAmount)}</span>
                </div>
                {changeAmount > 0 && (
                  <div className="receipt-total-row receipt-total-row--change">
                    <span>Change</span>
                    <span>{formatPrice(changeAmount)}</span>
                  </div>
                )}
              </div>

              {footerText && (
                <>
                  <div className="receipt-divider receipt-divider--dashed" />
                  <div className="receipt-footer-msg">{footerText}</div>
                </>
              )}

              <div className="receipt-divider" />
              <div className="receipt-thankyou">Thank you for shopping!</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}