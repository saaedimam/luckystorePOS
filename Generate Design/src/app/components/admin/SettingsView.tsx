import { useState, useEffect } from "react";
import { Switch } from "../ui/switch";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { StatusDot } from "../StatusDot";
import { AlertTriangle, Printer, ScanLine } from "lucide-react";
import { cn } from "../ui/utils";

const DUR = "300ms";
const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

// The Reset Modal
function FactoryResetModal({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  useEffect(() => {
    if (open) {
      setMounted(true);
      setConfirmText("");
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setVisible(true))
      );
    } else if (mounted) {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(t);
    }
  }, [open, mounted]);

  if (!mounted) return null;

  const isMatched = confirmText === "RESET";

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center p-6">
      <div
        onClick={onCancel}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        style={{ opacity: visible ? 1 : 0, transition: `opacity ${DUR} ${EASE}` }}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        className="relative w-full rounded-2xl border overflow-hidden"
        style={{
          maxWidth: 400,
          backgroundColor: "var(--surface)",
          borderColor: "var(--border)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04) inset",
          transform: visible ? "scale(1)" : "scale(0.96)",
          opacity: visible ? 1 : 0,
          transition: `transform ${DUR} ${EASE}, opacity ${DUR} ${EASE}`,
          willChange: "transform, opacity",
        }}
      >
        <div className="px-6 pt-6 pb-5">
          <div className="flex gap-4">
            <div className="size-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "color-mix(in oklab, var(--accent-rose) 16%, transparent)", color: "var(--accent-rose)" }}>
              <AlertTriangle size={18} strokeWidth={2.25} />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-foreground tracking-tight">Factory Reset POS</h3>
              <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                This will permanently delete all products, sales data, and settings. This action cannot be undone.
              </p>
            </div>
          </div>
          <div className="mt-5">
            <label className="block text-xs font-medium text-text-secondary mb-2">
              Type <span className="font-bold text-foreground select-all">RESET</span> to confirm
            </label>
            <Input 
              autoFocus
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="RESET"
              className="font-mono bg-background focus-visible:ring-[var(--accent-rose)] focus-visible:border-[var(--accent-rose)]"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t transition-colors" style={{ borderColor: "var(--border)", backgroundColor: "color-mix(in oklab, var(--surface-elevated) 50%, transparent)" }}>
          <Button variant="ghost" onClick={onCancel} className="text-text-secondary">Cancel</Button>
          <Button 
            variant="destructive" 
            disabled={!isMatched} 
            onClick={onConfirm}
            className="font-bold shadow-[0_1px_0_rgba(255,255,255,0.18)_inset,0_8px_20px_rgba(244,63,94,0.30)] transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:active:scale-100 text-white"
            style={{ backgroundColor: "var(--accent-rose)" }}
          >
            Delete Everything
          </Button>
        </div>
      </div>
    </div>
  );
}

export function SettingsView() {
  const [activeSection, setActiveSection] = useState("general");
  
  // Settings State
  const [storeName, setStoreName] = useState("Lucky Store");
  const [taxRate, setTaxRate] = useState("15.0");
  const [banglaReceipts, setBanglaReceipts] = useState(false);
  
  // Clean states for dirty checking
  const [cleanStoreName, setCleanStoreName] = useState("Lucky Store");
  const [cleanTaxRate, setCleanTaxRate] = useState("15.0");
  const [cleanBanglaReceipts, setCleanBanglaReceipts] = useState(false);

  const isGeneralDirty = storeName !== cleanStoreName || taxRate !== cleanTaxRate || banglaReceipts !== cleanBanglaReceipts;

  const handleSaveGeneral = () => {
    setCleanStoreName(storeName);
    setCleanTaxRate(taxRate);
    setCleanBanglaReceipts(banglaReceipts);
  };

  const [resetModalOpen, setResetModalOpen] = useState(false);

  // Simple scroll navigation
  const scrollTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="flex h-full w-full">
      {/* Left Column - Sticky Nav */}
      <div className="w-[200px] border-r p-6 sticky top-0 h-full overflow-y-auto shrink-0 bg-background" style={{ borderColor: "var(--border)" }}>
        <nav className="space-y-1">
          {[{ id: 'general', label: 'General' }, { id: 'hardware', label: 'Hardware' }, { id: 'danger', label: 'Danger Zone' }].map(item => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200",
                activeSection === item.id 
                  ? "bg-surface-elevated text-foreground" 
                  : "text-text-secondary hover:text-foreground hover:bg-surface-elevated/50"
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Right Column - Content */}
      <div className="flex-1 p-8 overflow-y-auto bg-background">
        <div className="max-w-3xl space-y-12 pb-24">
          
          {/* General Section */}
          <section id="section-general" className="scroll-mt-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">General Settings</h2>
            <div className="bg-surface border rounded-xl overflow-hidden flex flex-col transition-all duration-300" style={{ borderColor: "var(--border)" }}>
              <div className="p-6 space-y-6">
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Store Name</label>
                    <Input 
                      value={storeName} 
                      onChange={(e) => setStoreName(e.target.value)}
                      className="bg-background"
                    />
                    <p className="text-xs text-text-secondary">Used on receipts and reports.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Tax Rate (%)</label>
                    <Input 
                      type="number"
                      step="0.1"
                      value={taxRate} 
                      onChange={(e) => setTaxRate(e.target.value)}
                      className="bg-background font-mono tabular-nums"
                    />
                    <p className="text-xs text-text-secondary">Default tax rate applied to items.</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: "var(--border)" }}>
                  <div>
                    <h4 className="text-sm font-medium text-foreground">Enable Bangla Receipts</h4>
                    <p className="text-xs text-text-secondary mt-1">Print receipts in Bengali font alongside English.</p>
                  </div>
                  <Switch 
                    checked={banglaReceipts} 
                    onCheckedChange={setBanglaReceipts} 
                  />
                </div>

              </div>

              {/* Footer */}
              <div 
                className="px-6 py-4 border-t flex items-center justify-between transition-colors duration-300"
                style={{ 
                  borderColor: "var(--border)", 
                  backgroundColor: "color-mix(in oklab, var(--surface-elevated) 40%, transparent)" 
                }}
              >
                <p className="text-xs text-text-secondary">Please save your changes.</p>
                <Button 
                  onClick={handleSaveGeneral} 
                  disabled={!isGeneralDirty}
                  className="transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                  style={{
                    backgroundColor: isGeneralDirty ? "var(--foreground)" : "var(--surface-elevated)",
                    color: isGeneralDirty ? "var(--background)" : "var(--text-tertiary)"
                  }}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </section>

          {/* Hardware Section */}
          <section id="section-hardware" className="scroll-mt-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">Hardware &amp; Connectivity</h2>
            <div className="bg-surface border rounded-xl overflow-hidden flex flex-col" style={{ borderColor: "var(--border)" }}>
              <div className="p-6 space-y-6">
                
                {/* Printer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="size-10 rounded-full bg-background border flex items-center justify-center text-foreground" style={{ borderColor: "var(--border)" }}>
                      <Printer size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-foreground">Thermal Printer</h4>
                      <div className="mt-1">
                        <StatusDot status="online" label="Online" />
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" className="h-8 text-xs text-foreground bg-transparent hover:bg-surface-elevated" style={{ borderColor: "var(--border)" }}>Test Print</Button>
                </div>

                {/* Scanner */}
                <div className="flex items-center justify-between pt-6 border-t" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-center gap-4">
                    <div className="size-10 rounded-full bg-background border flex items-center justify-center text-foreground" style={{ borderColor: "var(--border)" }}>
                      <ScanLine size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-foreground">Barcode Scanner</h4>
                      <div className="mt-1">
                        <StatusDot status="error" label="Disconnected" />
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" className="h-8 text-xs text-foreground bg-transparent hover:bg-surface-elevated" style={{ borderColor: "var(--border)" }}>Pair Device</Button>
                </div>

              </div>
            </div>
          </section>

          {/* Danger Zone */}
          <section id="section-danger" className="scroll-mt-8">
            <h2 className="text-xl font-semibold mb-4" style={{ color: "var(--accent-rose)" }}>Danger Zone</h2>
            <div className="bg-surface border rounded-xl overflow-hidden flex flex-col" style={{ borderColor: "color-mix(in oklab, var(--accent-rose) 20%, var(--border))" }}>
              <div className="p-6 flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-medium text-foreground">Factory Reset POS</h4>
                  <p className="text-xs text-text-secondary mt-1 max-w-sm">
                    Permanently delete all products, sales data, and settings. This cannot be undone.
                  </p>
                </div>
                <Button 
                  onClick={() => setResetModalOpen(true)}
                  variant="destructive" 
                  className="shadow-sm font-semibold transition-all text-white border"
                  style={{ backgroundColor: "var(--accent-rose)", borderColor: "color-mix(in oklab, var(--accent-rose) 50%, transparent)" }}
                >
                  Factory Reset
                </Button>
              </div>
            </div>
          </section>

        </div>
      </div>
      
      <FactoryResetModal 
        open={resetModalOpen} 
        onCancel={() => setResetModalOpen(false)} 
        onConfirm={() => {
          setResetModalOpen(false);
          // In real app, this would wipe localStorage and reset state
          if (typeof window !== 'undefined') {
             localStorage.clear();
             window.location.reload();
          }
        }} 
      />
    </div>
  );
}
