import React, { useState, useMemo, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext';
import { useSales } from '../context/SalesContext';
import { Product, Sale, SaleItem, PaymentMethodType, CustomerInfo, PaymentDetails } from '../types';
import { Card } from './ui/Card';
import { 
  Search, ShoppingCart, Plus, Minus, FileText, Check, 
  CreditCard, Banknote, Landmark, History, Store, X, Printer, Smartphone, Wallet, User, ArrowRight
} from 'lucide-react';

// --- HELPER: FORMAT CURRENCY ---
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
};

// --- SUB-COMPONENT: CHECKOUT MODAL ---
interface CheckoutModalProps {
  total: number;
  onConfirm: (customer: CustomerInfo, payment: PaymentDetails) => void;
  onCancel: () => void;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ total, onConfirm, onCancel }) => {
  const [step, setStep] = useState<1 | 2>(1); // 1: Customer, 2: Payment
  
  // Customer State
  const [customer, setCustomer] = useState<CustomerInfo>({
    name: '',
    taxId: '',
    email: '',
    address: ''
  });

  // Payment State
  const [method, setMethod] = useState<PaymentMethodType>('cash');
  const [amountTendered, setAmountTendered] = useState<string>('');
  const [authCode, setAuthCode] = useState('');
  const [lastFour, setLastFour] = useState('');
  
  // Handlers
  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleFinalize = () => {
    const paymentDetails: PaymentDetails = {
      method,
      amount: total,
    };

    if (method === 'cash') {
      const tendered = parseFloat(amountTendered) || total;
      paymentDetails.amountTendered = tendered;
      paymentDetails.change = tendered - total;
    } else if (method === 'debit_card' || method === 'credit_card') {
      paymentDetails.authCode = authCode;
      paymentDetails.lastFourDigits = lastFour;
    } else {
      // Transfer or QR
      paymentDetails.authCode = authCode; // Transaction ID
    }

    // Default customer name if empty
    const finalCustomer = { ...customer, name: customer.name || 'Consumidor Final' };
    
    onConfirm(finalCustomer, paymentDetails);
  };

  const change = method === 'cash' ? (parseFloat(amountTendered) || 0) - total : 0;
  const isCashInsufficient = method === 'cash' && (parseFloat(amountTendered) || 0) < total;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            {step === 1 ? <User size={20} className="text-indigo-600"/> : <Wallet size={20} className="text-indigo-600"/>}
            {step === 1 ? 'Datos del Cliente' : 'Finalizar Pago'}
          </h2>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 dark:hover:text-white"><X size={20} /></button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {step === 1 ? (
            <form id="customer-form" onSubmit={handleCustomerSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre / Razón Social</label>
                <input 
                  autoFocus
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Consumidor Final"
                  value={customer.name}
                  onChange={e => setCustomer({...customer, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">DNI / CUIT / RUT</label>
                <input 
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Sin identificar"
                  value={customer.taxId}
                  onChange={e => setCustomer({...customer, taxId: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email (Opcional)</label>
                   <input 
                    type="email"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="cliente@email.com"
                    value={customer.email}
                    onChange={e => setCustomer({...customer, email: e.target.value})}
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Dirección (Opcional)</label>
                   <input 
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Calle 123"
                    value={customer.address}
                    onChange={e => setCustomer({...customer, address: e.target.value})}
                   />
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <p className="text-slate-500 text-sm">Total a Pagar</p>
                <div className="text-4xl font-bold text-slate-900 dark:text-white">{formatCurrency(total)}</div>
              </div>

              {/* Payment Methods Grid */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'cash', label: 'Efectivo', icon: <Banknote size={20}/> },
                  { id: 'debit_card', label: 'Débito', icon: <CreditCard size={20}/> },
                  { id: 'credit_card', label: 'Crédito', icon: <CreditCard size={20}/> },
                  { id: 'qr_wallet', label: 'QR/Billetera', icon: <Smartphone size={20}/> },
                  { id: 'transfer', label: 'Transf.', icon: <Landmark size={20}/> },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id as PaymentMethodType)}
                    className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl border transition-all ${
                      method === m.id 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-105' 
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {m.icon}
                    <span className="text-xs font-medium">{m.label}</span>
                  </button>
                ))}
              </div>

              {/* Dynamic Fields */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                {method === 'cash' && (
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">¿Con cuánto abona?</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                      <input 
                        autoFocus
                        type="number"
                        className="w-full pl-8 pr-4 py-3 text-lg font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder={total.toString()}
                        value={amountTendered}
                        onChange={e => setAmountTendered(e.target.value)}
                      />
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                      <span className="text-sm font-medium text-slate-500">Su vuelto:</span>
                      <span className={`text-xl font-bold ${change < 0 ? 'text-red-500' : 'text-green-600'}`}>
                        {formatCurrency(Math.max(0, change))}
                      </span>
                    </div>
                  </div>
                )}

                {(method === 'debit_card' || method === 'credit_card') && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                       <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nro. Cupón / Autorización</label>
                       <input 
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Ej: 001234"
                        value={authCode}
                        onChange={e => setAuthCode(e.target.value)}
                       />
                    </div>
                    <div>
                       <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Últimos 4 dígitos</label>
                       <input 
                        maxLength={4}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="1234"
                        value={lastFour}
                        onChange={e => setLastFour(e.target.value)}
                       />
                    </div>
                  </div>
                )}

                {(method === 'transfer' || method === 'qr_wallet') && (
                   <div className="space-y-2">
                     <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">ID Transacción / Comprobante</label>
                     <input 
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Ej: 20240912-8888"
                      value={authCode}
                      onChange={e => setAuthCode(e.target.value)}
                     />
                   </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
          {step === 2 && (
            <button 
              onClick={() => setStep(1)}
              className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors font-medium"
            >
              Atrás
            </button>
          )}
          <button 
            onClick={step === 1 ? (e) => handleCustomerSubmit(e as any) : handleFinalize}
            disabled={step === 2 && isCashInsufficient}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
          >
            {step === 1 ? (
              <>Continuar <ArrowRight size={18} /></>
            ) : (
              <>Confirmar Pago <Check size={18} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- SUB-COMPONENT: INVOICE MODAL ---
const InvoiceModal: React.FC<{ sale: Sale; onClose: () => void }> = ({ sale, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 bg-slate-900 text-white flex justify-between items-center print:hidden">
          <h3 className="font-bold flex items-center gap-2"><FileText size={18} /> Factura #{sale.id.slice(0, 8)}</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        
        <div className="p-8 overflow-y-auto flex-1 text-slate-800 bg-white" id="printable-area">
          {/* Header */}
          <div className="text-center mb-8 border-b border-slate-100 pb-6">
            <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl mx-auto mb-3 print-logo">S</div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">StockMaster Pro</h2>
            <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">Comprobante de Venta</p>
            <div className="mt-4 text-sm text-slate-500">
               <p>{new Date(sale.date).toLocaleString()}</p>
               <p className="font-mono mt-1">ID: {sale.id.toUpperCase()}</p>
            </div>
          </div>

          {/* Customer Info */}
          <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm">
             <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                <span className="text-slate-400">Cliente:</span>
                <span className="font-medium text-slate-900 capitalize">{sale.customer.name}</span>
                
                {sale.customer.taxId && (
                  <>
                    <span className="text-slate-400">DNI/CUIT:</span>
                    <span className="font-mono text-slate-700">{sale.customer.taxId}</span>
                  </>
                )}
                {sale.customer.address && (
                  <>
                    <span className="text-slate-400">Dir:</span>
                    <span className="text-slate-700">{sale.customer.address}</span>
                  </>
                )}
             </div>
          </div>

          {/* Items */}
          <table className="w-full text-sm mb-6">
            <thead>
              <tr className="border-b-2 border-slate-100 text-xs uppercase tracking-wider text-slate-400">
                <th className="text-left py-2">Desc</th>
                <th className="text-center py-2">Cant</th>
                <th className="text-right py-2">Importe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sale.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-3">
                    <div className="font-medium text-slate-800">{item.productName}</div>
                    <div className="text-[10px] text-slate-400">${item.unitPrice.toFixed(2)} u.</div>
                  </td>
                  <td className="text-center py-3 text-slate-600">x{item.quantity}</td>
                  <td className="text-right py-3 font-medium text-slate-900">${item.subtotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="border-t-2 border-slate-900 pt-4 mb-6">
            <div className="flex justify-between items-center text-xl font-bold">
              <span>TOTAL</span>
              <span>{formatCurrency(sale.total)}</span>
            </div>
          </div>

          {/* Payment Details */}
          <div className="text-xs text-slate-500 border-t border-slate-100 pt-4 space-y-1">
             <p className="font-bold uppercase mb-2">Detalle de Pago</p>
             <div className="flex justify-between">
                <span>Método:</span>
                <span className="font-medium capitalize text-slate-800">
                  {sale.payment.method === 'cash' ? 'Efectivo' : 
                   sale.payment.method === 'debit_card' ? 'Débito' :
                   sale.payment.method === 'credit_card' ? 'Crédito' :
                   sale.payment.method === 'qr_wallet' ? 'QR / Billetera' : 'Transferencia'}
                </span>
             </div>
             {sale.payment.method === 'cash' && (
                <>
                  <div className="flex justify-between">
                    <span>Entregado:</span>
                    <span>{formatCurrency(sale.payment.amountTendered || sale.payment.amount)}</span>
                  </div>
                  <div className="flex justify-between font-medium text-slate-800">
                    <span>Vuelto:</span>
                    <span>{formatCurrency(sale.payment.change || 0)}</span>
                  </div>
                </>
             )}
             {sale.payment.authCode && (
               <div className="flex justify-between">
                 <span>Autorización / Ref:</span>
                 <span className="font-mono">{sale.payment.authCode}</span>
               </div>
             )}
             {sale.payment.lastFourDigits && (
               <div className="flex justify-between">
                 <span>Tarjeta:</span>
                 <span className="font-mono">**** {sale.payment.lastFourDigits}</span>
               </div>
             )}
          </div>
          
          <div className="mt-8 text-center">
             <p className="text-xs text-slate-400 mb-2">Gracias por su compra</p>
             <div className="w-full h-10 bg-slate-100 rounded flex items-center justify-center">
               <span className="font-mono text-[10px] tracking-[0.5em] text-slate-300">||| || ||| || |||</span>
             </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3 print:hidden">
          <button 
            onClick={() => window.print()}
            className="flex-1 flex items-center justify-center gap-2 bg-slate-800 text-white py-2 rounded-lg hover:bg-slate-700 transition-colors shadow-lg shadow-slate-900/10"
          >
            <Printer size={18} /> Imprimir
          </button>
        </div>
      </div>
    </div>
  );
};

// --- SUB-COMPONENT: POS (POINT OF SALE) ---
const PointOfSale: React.FC = () => {
  const { products } = useInventory();
  const { addSale } = useSales();
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Filter products for search
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return [];
    const lower = searchTerm.toLowerCase();
    return products.filter(p => 
      (p.name.toLowerCase().includes(lower) || p.qrCode.includes(lower)) && p.stock > 0
    );
  }, [searchTerm, products]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev; 
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.unitPrice }
            : item
        );
      }
      return [...prev, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.sellPrice,
        subtotal: product.sellPrice
      }];
    });
    setSearchTerm(''); 
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const product = products.find(p => p.id === productId);
        const maxStock = product ? product.stock : 999;
        const newQty = Math.min(Math.max(1, item.quantity + delta), maxStock);
        return { ...item, quantity: newQty, subtotal: newQty * item.unitPrice };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const cartTotal = cart.reduce((acc, item) => acc + item.subtotal, 0);

  const handleCheckoutConfirm = (customer: CustomerInfo, payment: PaymentDetails) => {
    addSale(customer, cart, payment);
    setCart([]);
    setShowCheckout(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
      {/* Left: Product Search */}
      <div className="flex-1 flex flex-col gap-4 min-h-0">
        <Card className="p-4 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              autoFocus
              type="text" 
              placeholder="Buscar producto por nombre o escanear QR..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </Card>

        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 pb-4 content-start">
          {filteredProducts.map(product => (
            <div 
              key={product.id} 
              onClick={() => addToCart(product)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-500 transition-all flex flex-col justify-between group shadow-sm h-32"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded uppercase tracking-wider">{product.category.substring(0, 15)}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{product.qrCode}</span>
                </div>
                <h4 className="font-medium text-slate-800 dark:text-white mb-1 group-hover:text-indigo-600 transition-colors line-clamp-1" title={product.name}>{product.name}</h4>
                <p className="text-xs text-slate-500 line-clamp-1">{product.brand}</p>
              </div>
              <div className="mt-2 flex justify-between items-end">
                <div className="text-lg font-bold text-slate-900 dark:text-white">${product.sellPrice}</div>
                <div className={`text-xs ${product.stock < 5 ? 'text-red-500 font-bold' : 'text-slate-500'}`}>Stock: {product.stock}</div>
              </div>
            </div>
          ))}
          {filteredProducts.length === 0 && searchTerm && (
            <div className="col-span-full text-center py-10 text-slate-400">
              No se encontraron productos con "{searchTerm}"
            </div>
          )}
          {!searchTerm && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400">
              <Search size={48} className="mb-4 opacity-20" />
              <p>Busca o escanea un producto para comenzar</p>
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart */}
      <Card className="w-full lg:w-96 flex flex-col shadow-xl border-0 ring-1 ring-slate-200 dark:ring-slate-800 h-full">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex-shrink-0">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <ShoppingCart size={20} className="text-indigo-600" />
            Venta Actual
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                <ShoppingCart size={40} className="mb-3 opacity-20" />
                El carrito está vacío
             </div>
          ) : (
            cart.map(item => (
              <div key={item.productId} className="flex gap-3 bg-white dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 transition-all hover:border-slate-300 dark:hover:border-slate-600">
                 <div className="flex-1 min-w-0">
                   <h4 className="text-sm font-medium text-slate-800 dark:text-white truncate" title={item.productName}>{item.productName}</h4>
                   <div className="text-xs text-slate-500">${item.unitPrice} c/u</div>
                 </div>
                 <div className="flex flex-col items-end gap-2">
                    <div className="font-bold text-sm text-slate-900 dark:text-white">${item.subtotal.toFixed(2)}</div>
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 rounded-md p-0.5">
                       <button onClick={() => updateQuantity(item.productId, -1)} className="p-1 hover:bg-white dark:hover:bg-slate-600 rounded shadow-sm text-slate-600 dark:text-slate-300"><Minus size={12} /></button>
                       <span className="text-xs w-5 text-center font-medium text-slate-700 dark:text-slate-200">{item.quantity}</span>
                       <button onClick={() => updateQuantity(item.productId, 1)} className="p-1 hover:bg-white dark:hover:bg-slate-600 rounded shadow-sm text-slate-600 dark:text-slate-300"><Plus size={12} /></button>
                    </div>
                 </div>
                 <button onClick={() => removeFromCart(item.productId)} className="text-slate-300 hover:text-red-500 self-start ml-1"><X size={16}/></button>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-4 flex-shrink-0">
          <div className="flex justify-between items-center pt-2">
            <span className="text-slate-600 dark:text-slate-400 font-medium">Total a Pagar</span>
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(cartTotal)}</span>
          </div>

          <button 
            disabled={cart.length === 0}
            onClick={() => setShowCheckout(true)}
            className={`w-full font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]
              ${showSuccess 
                ? 'bg-green-500 hover:bg-green-600 text-white shadow-green-500/30' 
                : 'bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-indigo-500/30'
              }`}
          >
            {showSuccess ? <Check size={20} /> : <Check size={20} />}
            {showSuccess ? 'Venta Registrada' : 'Procesar Pago'}
          </button>
        </div>
      </Card>
      
      {showCheckout && (
        <CheckoutModal 
          total={cartTotal} 
          onConfirm={handleCheckoutConfirm} 
          onCancel={() => setShowCheckout(false)} 
        />
      )}
    </div>
  );
};

// --- SUB-COMPONENT: SALES HISTORY ---
const SalesHistory: React.FC = () => {
  const { sales } = useSales();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const filteredSales = sales.filter(s => 
    s.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.id.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por cliente o ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-600 dark:text-slate-300 shadow-sm">
          Total Ventas: <span className="text-indigo-600 ml-1">{sales.length}</span>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">ID Venta</th>
                <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">Fecha</th>
                <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">Cliente</th>
                <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">Items</th>
                <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">Método</th>
                <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">Total</th>
                <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {filteredSales.length === 0 ? (
                <tr>
                   <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      No hay ventas registradas.
                   </td>
                </tr>
              ) : (
                filteredSales.map(sale => (
                  <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">#{sale.id.slice(0, 8)}</td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                      {new Date(sale.date).toLocaleDateString()} <span className="text-xs text-slate-400">{new Date(sale.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-white capitalize">
                      {sale.customer.name}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {sale.items.reduce((acc, i) => acc + i.quantity, 0)} items
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded border text-xs font-medium capitalize bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 gap-1">
                         {sale.payment.method === 'cash' && <Banknote size={12}/>}
                         {(sale.payment.method === 'debit_card' || sale.payment.method === 'credit_card') && <CreditCard size={12}/>}
                         {sale.payment.method === 'transfer' && <Landmark size={12}/>}
                         {sale.payment.method === 'qr_wallet' && <Smartphone size={12}/>}
                         {sale.payment.method === 'cash' ? 'Efectivo' : 
                          sale.payment.method === 'debit_card' ? 'Débito' :
                          sale.payment.method === 'credit_card' ? 'Crédito' :
                          sale.payment.method === 'qr_wallet' ? 'QR' : 'Transf.'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-indigo-600">
                      ${sale.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button 
                         onClick={() => setSelectedSale(sale)}
                         className="text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-3 py-1 rounded-md text-xs font-medium transition-colors border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900"
                       >
                         Ver Factura
                       </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {selectedSale && (
        <InvoiceModal sale={selectedSale} onClose={() => setSelectedSale(null)} />
      )}
    </div>
  );
};

// --- MAIN WRAPPER COMPONENT ---
const SalesModule: React.FC = () => {
  const [view, setView] = useState<'pos' | 'history'>('pos');

  return (
    <div className="h-full flex flex-col">
      <div className="flex gap-4 mb-6">
        <button 
          onClick={() => setView('pos')}
          className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all ${
            view === 'pos' 
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-800'
          }`}
        >
          <Store size={18} /> Punto de Venta
        </button>
        <button 
          onClick={() => setView('history')}
          className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all ${
            view === 'history' 
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-800'
          }`}
        >
          <History size={18} /> Historial y Facturas
        </button>
      </div>

      <div className="flex-1">
        {view === 'pos' ? <PointOfSale /> : <SalesHistory />}
      </div>
    </div>
  );
};

export default SalesModule;