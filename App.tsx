import React, { useState, useEffect } from 'react';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SalesProvider } from './context/SalesContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ProductList from './components/ProductList';
import ProductForm from './components/ProductForm';
import QRScanner from './components/QRScanner';
import AuthScreen from './components/AuthScreen';
import SalesModule from './components/SalesModule';
import { Product } from './types';
import { Plus, Menu } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [isDark, setIsDark] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  
  const { addProduct, updateProduct, getProductByQR, adjustStock } = useInventory();

  // Dark Mode Logic
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDark(true);
    }
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  // Authentication Check
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  // Handlers
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleSaveProduct = (product: Product) => {
    if (editingProduct) {
      updateProduct(product);
    } else {
      addProduct(product);
    }
    setShowProductForm(false);
    setEditingProduct(undefined);
  };

  const handleScanResult = (code: string) => {
    const product = getProductByQR(code);
    if (product) {
      if(confirm(`Producto encontrado: ${product.name}\nStock Actual: ${product.stock}\n\n¿Desea incrementar el stock (+1)?`)) {
        adjustStock(product.id, 1);
        alert('Stock actualizado');
      } else {
        handleEditProduct(product);
      }
    } else {
      if(confirm(`Código ${code} no encontrado. ¿Crear nuevo producto con este código?`)) {
        setEditingProduct(undefined);
        setShowProductForm(true);
      }
    }
    setShowScanner(false);
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'sales':
        return <SalesModule />;
      case 'inventory':
        return <ProductList onEdit={handleEditProduct} />;
      case 'scanner':
        if (!showScanner) {
           setTimeout(() => setShowScanner(true), 0);
        }
        return <div className="text-center text-slate-500 mt-20">Abriendo cámara...</div>;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <Sidebar 
        currentView={currentView} 
        setView={(view) => {
           if(view === 'scanner') {
             setShowScanner(true);
           } else {
             setCurrentView(view);
           }
        }}
        isDark={isDark}
        toggleTheme={toggleTheme}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Topbar */}
        <header className="h-16 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 backdrop-blur-sm flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden p-2 text-slate-600 dark:text-slate-300"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-semibold text-slate-800 dark:text-white capitalize">
              {currentView === 'dashboard' ? 'Resumen General' : currentView === 'sales' ? 'Gestión de Ventas' : 'Inventario'}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
             <button
               onClick={() => { setEditingProduct(undefined); setShowProductForm(true); }}
               className="hidden md:flex bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium items-center gap-2 transition-all shadow-lg shadow-indigo-500/30"
             >
               <Plus size={18} />
               Nuevo Producto
             </button>
             <button
               onClick={() => { setEditingProduct(undefined); setShowProductForm(true); }}
               className="md:hidden w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-500/30"
             >
               <Plus size={20} />
             </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-4 md:p-8 relative">
           {renderView()}
        </main>
      </div>

      {/* Modals */}
      {showProductForm && (
        <ProductForm 
          initialData={editingProduct} 
          onSave={handleSaveProduct} 
          onCancel={() => { setShowProductForm(false); setEditingProduct(undefined); }} 
        />
      )}

      {showScanner && (
        <QRScanner 
          onScan={handleScanResult} 
          onClose={() => { setShowScanner(false); if(currentView === 'scanner') setCurrentView('dashboard'); }} 
        />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <InventoryProvider>
        <SalesProvider>
          <AppContent />
        </SalesProvider>
      </InventoryProvider>
    </AuthProvider>
  );
};

export default App;