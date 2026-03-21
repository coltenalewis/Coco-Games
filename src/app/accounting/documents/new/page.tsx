"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

// ============================================
// STRUCTURED DATA TYPES
// ============================================
interface InvoiceData {
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  items: { description: string; quantity: number; rate: number }[];
  tax_percent: number;
  payment_terms: string;
  payment_method: string;
  notes: string;
}

interface MemoData {
  to: string;
  from: string;
  subject: string;
  date: string;
  body: string;
  action_items: string[];
}

interface LetterData {
  greeting: string;
  body: string;
  closing: string;
  signer_name: string;
  signer_title: string;
}

function newInvoiceData(): InvoiceData {
  return {
    invoice_number: `INV-${Date.now().toString().slice(-6)}`,
    invoice_date: new Date().toISOString().split("T")[0],
    due_date: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
    items: [{ description: "", quantity: 1, rate: 0 }],
    tax_percent: 0,
    payment_terms: "Net 30 — Payment due within 30 days of invoice date.",
    payment_method: "",
    notes: "",
  };
}

function newMemoData(): MemoData {
  return {
    to: "",
    from: "COCO GAMES Management",
    subject: "",
    date: new Date().toISOString().split("T")[0],
    body: "",
    action_items: [],
  };
}

function newLetterData(): LetterData {
  return {
    greeting: "Dear",
    body: "",
    closing: "Best regards",
    signer_name: "COCO GAMES",
    signer_title: "Game Studio",
  };
}

// ============================================
// SERIALIZE STRUCTURED DATA TO CONTENT
// ============================================
function serializeInvoice(d: InvoiceData): string {
  return JSON.stringify({ _type: "invoice", ...d });
}
function serializeMemo(d: MemoData): string {
  return JSON.stringify({ _type: "memo", ...d });
}
function serializeLetter(d: LetterData): string {
  return JSON.stringify({ _type: "letter", ...d });
}

// ============================================
// FIELD INPUT COMPONENT
// ============================================
function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-[10px] sm:text-xs font-bold text-coco-coffee uppercase tracking-wider mb-1">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3 py-2.5 border-2 border-coco-dark/10 bg-white text-sm focus:outline-none focus:border-green-400 transition-colors";

// ============================================
// INVOICE FORM
// ============================================
function InvoiceForm({ data, onChange }: { data: InvoiceData; onChange: (d: InvoiceData) => void }) {
  const updateItem = (i: number, key: string, value: string | number) => {
    const items = [...data.items];
    items[i] = { ...items[i], [key]: value };
    onChange({ ...data, items });
  };
  const addItem = () => onChange({ ...data, items: [...data.items, { description: "", quantity: 1, rate: 0 }] });
  const removeItem = (i: number) => {
    if (data.items.length <= 1) return;
    onChange({ ...data, items: data.items.filter((_, idx) => idx !== i) });
  };

  const subtotal = data.items.reduce((s, item) => s + item.quantity * item.rate, 0);
  const tax = subtotal * (data.tax_percent / 100);
  const total = subtotal + tax;

  return (
    <div className="space-y-5">
      {/* Invoice Details */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field label="Invoice #">
          <input type="text" value={data.invoice_number} onChange={(e) => onChange({ ...data, invoice_number: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Invoice Date">
          <input type="date" value={data.invoice_date} onChange={(e) => onChange({ ...data, invoice_date: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Due Date">
          <input type="date" value={data.due_date} onChange={(e) => onChange({ ...data, due_date: e.target.value })} className={inputCls} />
        </Field>
      </div>

      {/* Line Items */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[10px] sm:text-xs font-bold text-coco-coffee uppercase tracking-wider">Line Items</label>
          <button type="button" onClick={addItem} className="text-xs text-green-600 hover:text-green-800 font-bold min-h-[36px] px-3 border border-green-300 hover:border-green-500 transition-colors">
            + Add Item
          </button>
        </div>
        <div className="space-y-2">
          {data.items.map((item, i) => (
            <div key={i} className="flex gap-2 items-start">
              <input
                type="text"
                value={item.description}
                onChange={(e) => updateItem(i, "description", e.target.value)}
                placeholder="Description..."
                className={`${inputCls} flex-1`}
              />
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => updateItem(i, "quantity", parseInt(e.target.value) || 1)}
                className={`${inputCls} w-16 sm:w-20 text-center`}
                placeholder="Qty"
              />
              <div className="relative flex-shrink-0 w-24 sm:w-28">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-coco-coffee/40 text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={item.rate || ""}
                  onChange={(e) => updateItem(i, "rate", parseFloat(e.target.value) || 0)}
                  className={`${inputCls} pl-6`}
                  placeholder="0.00"
                />
              </div>
              <button
                type="button"
                onClick={() => removeItem(i)}
                disabled={data.items.length <= 1}
                className="text-red-400 hover:text-red-600 font-bold text-lg min-w-[36px] min-h-[42px] flex items-center justify-center disabled:opacity-20"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="border-t-2 border-coco-dark/10 pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-coco-coffee">Subtotal</span>
          <span className="font-bold text-coco-dark">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center text-sm gap-3">
          <span className="text-coco-coffee">Tax</span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={data.tax_percent || ""}
              onChange={(e) => onChange({ ...data, tax_percent: parseFloat(e.target.value) || 0 })}
              className="w-16 px-2 py-1 border-2 border-coco-dark/10 bg-white text-sm text-right focus:outline-none focus:border-green-400"
            />
            <span className="text-coco-coffee/60 text-xs">%</span>
            <span className="font-bold text-coco-dark ml-3">${tax.toFixed(2)}</span>
          </div>
        </div>
        <div className="flex justify-between text-base font-black border-t-2 border-coco-dark/10 pt-2">
          <span className="text-coco-dark">Total Due</span>
          <span className="text-green-700">${total.toFixed(2)}</span>
        </div>
      </div>

      {/* Payment Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Payment Terms">
          <input type="text" value={data.payment_terms} onChange={(e) => onChange({ ...data, payment_terms: e.target.value })} className={inputCls} placeholder="Net 30..." />
        </Field>
        <Field label="Payment Method">
          <input type="text" value={data.payment_method} onChange={(e) => onChange({ ...data, payment_method: e.target.value })} className={inputCls} placeholder="Bank transfer, PayPal..." />
        </Field>
      </div>
      <Field label="Notes (optional)">
        <textarea value={data.notes} onChange={(e) => onChange({ ...data, notes: e.target.value })} rows={2} className={`${inputCls} resize-y`} placeholder="Additional notes..." />
      </Field>
    </div>
  );
}

// ============================================
// MEMO FORM
// ============================================
function MemoForm({ data, onChange }: { data: MemoData; onChange: (d: MemoData) => void }) {
  const addAction = () => onChange({ ...data, action_items: [...data.action_items, ""] });
  const removeAction = (i: number) => onChange({ ...data, action_items: data.action_items.filter((_, idx) => idx !== i) });
  const updateAction = (i: number, val: string) => {
    const items = [...data.action_items];
    items[i] = val;
    onChange({ ...data, action_items: items });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="To">
          <input type="text" value={data.to} onChange={(e) => onChange({ ...data, to: e.target.value })} className={inputCls} placeholder="All staff, Development team..." />
        </Field>
        <Field label="From">
          <input type="text" value={data.from} onChange={(e) => onChange({ ...data, from: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Subject">
          <input type="text" value={data.subject} onChange={(e) => onChange({ ...data, subject: e.target.value })} className={inputCls} placeholder="Memo subject..." />
        </Field>
        <Field label="Date">
          <input type="date" value={data.date} onChange={(e) => onChange({ ...data, date: e.target.value })} className={inputCls} />
        </Field>
      </div>
      <Field label="Body">
        <textarea value={data.body} onChange={(e) => onChange({ ...data, body: e.target.value })} rows={8} className={`${inputCls} resize-y`} placeholder="Memo content..." />
      </Field>

      {/* Action Items */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[10px] sm:text-xs font-bold text-coco-coffee uppercase tracking-wider">Action Items (optional)</label>
          <button type="button" onClick={addAction} className="text-xs text-green-600 hover:text-green-800 font-bold min-h-[36px] px-3 border border-green-300 hover:border-green-500 transition-colors">
            + Add
          </button>
        </div>
        {data.action_items.map((item, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <input type="text" value={item} onChange={(e) => updateAction(i, e.target.value)} placeholder={`Action item ${i + 1}...`} className={`${inputCls} flex-1`} />
            <button type="button" onClick={() => removeAction(i)} className="text-red-400 hover:text-red-600 font-bold text-lg min-w-[36px] min-h-[42px] flex items-center justify-center">&times;</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// LETTER FORM
// ============================================
function LetterForm({ data, onChange }: { data: LetterData; onChange: (d: LetterData) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Greeting">
          <input type="text" value={data.greeting} onChange={(e) => onChange({ ...data, greeting: e.target.value })} className={inputCls} placeholder="Dear..." />
        </Field>
        <Field label="Closing">
          <input type="text" value={data.closing} onChange={(e) => onChange({ ...data, closing: e.target.value })} className={inputCls} placeholder="Best regards..." />
        </Field>
      </div>
      <Field label="Letter Body">
        <textarea value={data.body} onChange={(e) => onChange({ ...data, body: e.target.value })} rows={12} className={`${inputCls} resize-y`} placeholder="Write your letter here..." />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Signer Name">
          <input type="text" value={data.signer_name} onChange={(e) => onChange({ ...data, signer_name: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Signer Title">
          <input type="text" value={data.signer_title} onChange={(e) => onChange({ ...data, signer_title: e.target.value })} className={inputCls} />
        </Field>
      </div>
    </div>
  );
}

// ============================================
// CONTRACT RICH EDITOR
// ============================================
function ContractEditor({ content, onChange }: { content: string; onChange: (c: string) => void }) {
  const editorRef = useRef<HTMLDivElement>(null);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const execCmd = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  return (
    <div>
      <label className="block text-[10px] sm:text-xs font-bold text-coco-coffee uppercase tracking-wider mb-2">Content</label>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 bg-coco-warm/50 border-2 border-b-0 border-coco-dark/10">
        <button type="button" onClick={() => execCmd("bold")} className="w-8 h-8 flex items-center justify-center text-sm font-black text-coco-dark hover:bg-coco-accent/15 transition-colors" title="Bold">B</button>
        <button type="button" onClick={() => execCmd("italic")} className="w-8 h-8 flex items-center justify-center text-sm italic text-coco-dark hover:bg-coco-accent/15 transition-colors" title="Italic">I</button>
        <button type="button" onClick={() => execCmd("underline")} className="w-8 h-8 flex items-center justify-center text-sm underline text-coco-dark hover:bg-coco-accent/15 transition-colors" title="Underline">U</button>
        <div className="w-px h-8 bg-coco-dark/10 mx-1" />
        <button type="button" onClick={() => execCmd("formatBlock", "H2")} className="w-8 h-8 flex items-center justify-center text-xs font-black text-coco-dark hover:bg-coco-accent/15 transition-colors" title="Heading">H</button>
        <button type="button" onClick={() => execCmd("formatBlock", "P")} className="w-8 h-8 flex items-center justify-center text-xs text-coco-dark hover:bg-coco-accent/15 transition-colors" title="Paragraph">P</button>
        <div className="w-px h-8 bg-coco-dark/10 mx-1" />
        <button type="button" onClick={() => execCmd("insertUnorderedList")} className="w-8 h-8 flex items-center justify-center text-sm text-coco-dark hover:bg-coco-accent/15 transition-colors" title="Bullet List">&bull;</button>
        <button type="button" onClick={() => execCmd("insertOrderedList")} className="w-8 h-8 flex items-center justify-center text-xs text-coco-dark hover:bg-coco-accent/15 transition-colors" title="Numbered List">1.</button>
        <div className="w-px h-8 bg-coco-dark/10 mx-1" />
        <button type="button" onClick={() => execCmd("justifyLeft")} className="w-8 h-8 flex items-center justify-center text-coco-dark hover:bg-coco-accent/15 transition-colors" title="Left">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2} d="M3 6h18M3 12h12M3 18h18" /></svg>
        </button>
        <button type="button" onClick={() => execCmd("justifyCenter")} className="w-8 h-8 flex items-center justify-center text-coco-dark hover:bg-coco-accent/15 transition-colors" title="Center">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2} d="M3 6h18M6 12h12M3 18h18" /></svg>
        </button>
        <div className="w-px h-8 bg-coco-dark/10 mx-1" />
        <button type="button" onClick={() => execCmd("removeFormat")} className="w-8 h-8 flex items-center justify-center text-xs text-red-500 hover:bg-red-50 transition-colors" title="Clear Formatting">&times;</button>
      </div>
      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        className="min-h-[400px] sm:min-h-[500px] px-4 sm:px-6 py-4 border-2 border-coco-dark/10 bg-white text-sm text-coco-dark leading-relaxed focus:outline-none focus:border-green-400 overflow-y-auto prose prose-sm max-w-none"
        style={{ whiteSpace: "pre-wrap" }}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================
export default function NewDocumentPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [docType, setDocType] = useState<"contract" | "invoice" | "letter" | "memo">("contract");
  const [showPreview, setShowPreview] = useState(false);

  // Shared fields
  const [title, setTitle] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientTitle, setRecipientTitle] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split("T")[0]);

  // Type-specific data
  const [contractContent, setContractContent] = useState("<p>This Service Agreement (\"Agreement\") is entered into as of the Effective Date by and between <strong>COCO GAMES</strong> (\"Company\") and the Recipient named below (\"Contractor\").</p><h2>1. SCOPE OF WORK</h2><p>The Contractor agrees to provide the following services:</p><ul><li>Describe services here</li></ul><h2>2. COMPENSATION</h2><p>The Company agrees to pay the Contractor a total of <strong>$___</strong> for the services rendered under this Agreement.</p><h2>3. TERM</h2><p>This Agreement shall commence on the Effective Date and continue until the agreed upon end date unless terminated earlier by either party with 14 days written notice.</p><h2>4. INTELLECTUAL PROPERTY</h2><p>All work product, including but not limited to code, assets, designs, and documentation created under this Agreement shall be the exclusive property of COCO GAMES.</p><h2>5. CONFIDENTIALITY</h2><p>The Contractor agrees to maintain the confidentiality of all proprietary information shared during the course of this engagement.</p><h2>6. TERMINATION</h2><p>Either party may terminate this Agreement with 14 days written notice. Upon termination, the Contractor shall deliver all completed work to the Company.</p><h2>7. GOVERNING LAW</h2><p>This Agreement shall be governed by and construed in accordance with applicable laws.</p><p><br></p><p>By signing below, both parties agree to the terms and conditions outlined in this Agreement.</p>");
  const [invoiceData, setInvoiceData] = useState<InvoiceData>(newInvoiceData());
  const [memoData, setMemoData] = useState<MemoData>(newMemoData());
  const [letterData, setLetterData] = useState<LetterData>(newLetterData());

  const switchType = (type: typeof docType) => {
    setDocType(type);
    if (type === "contract" && !title) setTitle("Service Agreement");
    if (type === "invoice" && !title) setTitle("Invoice");
    if (type === "memo" && !title) setTitle("Internal Memo");
    if (type === "letter" && !title) setTitle("Official Letter");
  };

  const getContent = (): string => {
    switch (docType) {
      case "contract": return contractContent;
      case "invoice": return serializeInvoice(invoiceData);
      case "memo": return serializeMemo(memoData);
      case "letter": return serializeLetter(letterData);
    }
  };

  const handleSubmit = async (status: "draft" | "final") => {
    if (!title.trim()) { alert("Title is required"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/accounting/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: docType,
          title,
          content: getContent(),
          status,
          recipient_name: recipientName || null,
          recipient_title: recipientTitle || null,
          effective_date: effectiveDate,
        }),
      });
      if (res.ok) {
        const doc = await res.json();
        router.push(`/accounting/documents/${doc.id}`);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save");
      }
    } finally {
      setSaving(false);
    }
  };

  // Invoice preview helper
  const invoiceSubtotal = invoiceData.items.reduce((s, i) => s + i.quantity * i.rate, 0);
  const invoiceTax = invoiceSubtotal * (invoiceData.tax_percent / 100);
  const invoiceTotal = invoiceSubtotal + invoiceTax;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-lg sm:text-xl font-black text-coco-dark">New Document</h2>
        <div className="flex gap-2 flex-wrap">
          {docType !== "contract" && (
            <button onClick={() => setShowPreview(!showPreview)} className="text-xs px-3 sm:px-4 py-2 font-bold border-2 border-coco-dark/10 hover:border-green-400 text-coco-dark transition-colors min-h-[40px]">
              {showPreview ? "Edit" : "Preview"}
            </button>
          )}
          <button onClick={() => handleSubmit("draft")} disabled={saving} className="text-xs px-3 sm:px-4 py-2 font-bold border-2 border-yellow-400 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition-colors disabled:opacity-50 min-h-[40px]">
            Save Draft
          </button>
          <button onClick={() => handleSubmit("final")} disabled={saving} className="btn-primary text-xs !px-3 sm:!px-4 !py-2 disabled:opacity-50 min-h-[40px]">
            Finalize
          </button>
        </div>
      </div>

      {showPreview && docType !== "contract" ? (
        /* PREVIEW */
        <div className="bg-white border-2 border-coco-dark/10 shadow-coco-lg max-w-3xl mx-auto">
          <div className="bg-coco-midnight px-4 sm:px-10 py-4 sm:py-6 flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-coco-accent/20 border-2 border-coco-accent/40 flex items-center justify-center">
                <span className="text-coco-gold font-black text-base sm:text-lg">CG</span>
              </div>
              <div>
                <p className="text-coco-gold font-black text-sm sm:text-lg tracking-widest uppercase">COCO GAMES</p>
                <p className="text-coco-cream/40 text-[10px] sm:text-xs tracking-wider">GAME STUDIO</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-coco-cream/60 text-xs capitalize">{docType}</p>
              <p className="text-coco-cream/40 text-[10px] sm:text-xs">{new Date(effectiveDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
            </div>
          </div>
          <div className="h-1 bg-gradient-to-r from-coco-accent via-coco-gold to-coco-ember" />

          <div className="px-4 sm:px-10 py-5 sm:py-8">
            <h2 className="text-xl sm:text-2xl font-black text-coco-dark mb-4 sm:mb-6 tracking-wide uppercase">{title || "Untitled"}</h2>

            {recipientName && <p className="text-sm font-bold text-coco-dark">{recipientName}</p>}
            {recipientTitle && <p className="text-xs text-coco-coffee/60 mb-4">{recipientTitle}</p>}

            {/* Invoice Preview */}
            {docType === "invoice" && (
              <div className="space-y-4 text-sm">
                <div className="flex flex-wrap gap-x-8 gap-y-1 text-xs text-coco-coffee border-b border-coco-dark/10 pb-3">
                  <span>Invoice #: <strong className="text-coco-dark">{invoiceData.invoice_number}</strong></span>
                  <span>Date: <strong className="text-coco-dark">{invoiceData.invoice_date}</strong></span>
                  <span>Due: <strong className="text-coco-dark">{invoiceData.due_date}</strong></span>
                </div>
                <table className="w-full text-sm">
                  <thead><tr className="border-b-2 border-coco-dark/10 text-xs text-coco-coffee">
                    <th className="text-left py-2">Description</th><th className="text-center py-2 w-16">Qty</th><th className="text-right py-2 w-20">Rate</th><th className="text-right py-2 w-24">Amount</th>
                  </tr></thead>
                  <tbody>
                    {invoiceData.items.filter(i => i.description).map((item, i) => (
                      <tr key={i} className="border-b border-coco-dark/5">
                        <td className="py-2">{item.description}</td>
                        <td className="py-2 text-center">{item.quantity}</td>
                        <td className="py-2 text-right">${item.rate.toFixed(2)}</td>
                        <td className="py-2 text-right font-medium">${(item.quantity * item.rate).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="border-t-2 border-coco-dark/10 pt-3 space-y-1 text-sm text-right">
                  <p>Subtotal: <strong>${invoiceSubtotal.toFixed(2)}</strong></p>
                  {invoiceData.tax_percent > 0 && <p>Tax ({invoiceData.tax_percent}%): <strong>${invoiceTax.toFixed(2)}</strong></p>}
                  <p className="text-base font-black text-green-700 pt-1 border-t border-coco-dark/10">Total Due: ${invoiceTotal.toFixed(2)}</p>
                </div>
                {invoiceData.payment_terms && <p className="text-xs text-coco-coffee mt-4"><strong>Payment Terms:</strong> {invoiceData.payment_terms}</p>}
                {invoiceData.payment_method && <p className="text-xs text-coco-coffee"><strong>Payment Method:</strong> {invoiceData.payment_method}</p>}
                {invoiceData.notes && <p className="text-xs text-coco-coffee/60 mt-2 italic">{invoiceData.notes}</p>}
              </div>
            )}

            {/* Memo Preview */}
            {docType === "memo" && (
              <div className="space-y-3 text-sm">
                <div className="border-b-2 border-coco-dark/10 pb-3 space-y-1 text-xs">
                  <p><strong className="text-coco-coffee uppercase w-16 inline-block">To:</strong> {memoData.to}</p>
                  <p><strong className="text-coco-coffee uppercase w-16 inline-block">From:</strong> {memoData.from}</p>
                  <p><strong className="text-coco-coffee uppercase w-16 inline-block">Date:</strong> {memoData.date}</p>
                  <p><strong className="text-coco-coffee uppercase w-16 inline-block">Re:</strong> {memoData.subject}</p>
                </div>
                <div className="whitespace-pre-wrap leading-relaxed">{memoData.body}</div>
                {memoData.action_items.length > 0 && (
                  <div className="border-t border-coco-dark/10 pt-3">
                    <p className="text-xs font-bold text-coco-coffee uppercase mb-2">Action Items</p>
                    <ul className="space-y-1">{memoData.action_items.filter(Boolean).map((a, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm"><span className="w-5 h-5 border-2 border-coco-dark/20 flex-shrink-0 mt-0.5" />{a}</li>
                    ))}</ul>
                  </div>
                )}
              </div>
            )}

            {/* Letter Preview */}
            {docType === "letter" && (
              <div className="text-sm space-y-4">
                <p>{letterData.greeting} {recipientName || "___"},</p>
                <div className="whitespace-pre-wrap leading-relaxed">{letterData.body}</div>
                <div className="mt-8">
                  <p>{letterData.closing},</p>
                  <p className="font-bold mt-4">{letterData.signer_name}</p>
                  <p className="text-xs text-coco-coffee/60">{letterData.signer_title}</p>
                </div>
              </div>
            )}
          </div>

          <div className="border-t-2 border-coco-dark/5 px-4 sm:px-10 py-3 sm:py-4 flex items-center justify-between">
            <p className="text-[10px] text-coco-coffee/40 uppercase tracking-wider">Confidential &mdash; COCO GAMES</p>
            <p className="text-[10px] text-coco-coffee/40">cocogames.com</p>
          </div>
        </div>
      ) : (
        /* EDITOR */
        <div className="card p-3 sm:p-6 space-y-5">
          {/* Type selector */}
          <div>
            <label className="block text-[10px] sm:text-xs font-bold text-coco-coffee uppercase tracking-wider mb-2">Document Type</label>
            <div className="flex gap-2 flex-wrap">
              {(["contract", "invoice", "letter", "memo"] as const).map((t) => (
                <button key={t} onClick={() => switchType(t)} className={`px-3 sm:px-4 py-2 text-xs font-bold border-2 transition-colors min-h-[40px] ${docType === t ? "border-green-400 bg-green-50 text-green-700" : "border-coco-dark/10 text-coco-coffee hover:border-green-300"}`}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Shared fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Title" className="sm:col-span-2">
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Document title..." className={inputCls} />
            </Field>
            <Field label="Recipient Name">
              <input type="text" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="John Doe" className={inputCls} />
            </Field>
            <Field label="Recipient Title">
              <input type="text" value={recipientTitle} onChange={(e) => setRecipientTitle(e.target.value)} placeholder="Developer, Designer..." className={inputCls} />
            </Field>
            <Field label="Effective Date">
              <input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} className={inputCls} />
            </Field>
          </div>

          {/* Divider */}
          <div className="border-t-2 border-coco-dark/5 pt-4">
            <p className="text-[10px] sm:text-xs font-bold text-green-700 uppercase tracking-wider mb-3">
              {docType === "contract" && "Contract Editor"}
              {docType === "invoice" && "Invoice Details"}
              {docType === "memo" && "Memo Details"}
              {docType === "letter" && "Letter Details"}
            </p>
          </div>

          {/* Type-specific editor */}
          {docType === "contract" && <ContractEditor content={contractContent} onChange={setContractContent} />}
          {docType === "invoice" && <InvoiceForm data={invoiceData} onChange={setInvoiceData} />}
          {docType === "memo" && <MemoForm data={memoData} onChange={setMemoData} />}
          {docType === "letter" && <LetterForm data={letterData} onChange={setLetterData} />}
        </div>
      )}
    </div>
  );
}
