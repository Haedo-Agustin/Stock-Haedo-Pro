import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Product } from '../types';
import { Card } from './ui/Card';
import { Search, Filter, MoreHorizontal, AlertCircle, CheckCircle, XCircle, Trash2, Edit } from 'lucide-react';

interface ProductListProps {
  onEdit: (product: Product) => void;
}

const ProductList: React.FC<ProductListProps> = ({ onEdit }) => {
  const { products, deleteProduct, getProductStatus } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const status = getProductStatus(p);
    const matchesStatus = filterStatus === 'all' || status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (product: Product) => {
    const status = getProductStatus(product);
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-900"><CheckCircle size={12} className="mr-1" /> Activo</span>;
      case 'low_stock':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 border border-orange-200 dark:border-orange-900"><AlertCircle size={12} className="mr-1" /> Stock Bajo</span>;
      case 'out_of_stock':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700"><XCircle size={12} className="mr-1" /> Agotado</span>;
      case 'expired':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-900"><XCircle size={12} className="mr-1" /> Vencido</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nombre, categoría..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        
        <div className="flex gap-2">
           <select
             value={filterStatus}
             onChange={(e) => setFilterStatus(e.target.value)}
             className="px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg text-sm text-slate-600 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500"
           >
             <option value="all">Todos los estados</option>
             <option value="active">Activo</option>
             <option value="low_stock">Stock Bajo</option>
             <option value="out_of_stock">Agotado</option>
             <option value="expired">Vencido</option>
           </select>
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">Producto</th>
                <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">Categoría</th>
                <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">Stock</th>
                <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">Precio</th>
                <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">Estado</th>
                <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {filteredProducts.length === 0 ? (
                <tr>
                   <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      No se encontraron productos.
                   </td>
                </tr>
              ) : (
                filteredProducts.map(product => (
                  <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">{product.name}</div>
                        <div className="text-xs text-slate-500">{product.brand}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      <span className="inline-block px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-medium ${product.stock <= product.minStock ? 'text-red-600' : 'text-slate-700 dark:text-slate-300'}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      ${product.sellPrice}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(product)}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => onEdit(product)}
                            className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => {
                              if (window.confirm('¿Eliminar producto?')) deleteProduct(product.id);
                            }}
                            className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default ProductList;
