import React, { useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { useSales } from '../context/SalesContext';
import { Card } from './ui/Card';
import { TrendingUp, AlertTriangle, XCircle, Package, DollarSign, Wallet, ArrowRight } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie 
} from 'recharts';

const Dashboard: React.FC = () => {
  const { products, getProductStatus } = useInventory();
  const { sales } = useSales();

  const metrics = useMemo(() => {
    let totalStock = 0;
    let totalValue = 0;
    let lowStock = 0;
    let expired = 0;
    let outOfStock = 0;

    products.forEach(p => {
      totalStock += p.stock;
      totalValue += p.stock * p.buyPrice;
      const status = getProductStatus(p);
      if (status === 'low_stock') lowStock++;
      if (status === 'expired') expired++;
      if (status === 'out_of_stock') outOfStock++;
    });

    const totalRevenue = sales.reduce((acc, sale) => acc + sale.total, 0);

    return { totalStock, totalValue, lowStock, expired, outOfStock, totalProducts: products.length, totalRevenue };
  }, [products, getProductStatus, sales]);

  const categoryData = useMemo(() => {
    const acc: Record<string, number> = {};
    products.forEach(p => {
      acc[p.category] = (acc[p.category] || 0) + p.stock;
    });
    return Object.entries(acc)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [products]);

  const stockValueData = useMemo(() => {
     return products
      .sort((a, b) => (b.stock * b.buyPrice) - (a.stock * a.buyPrice))
      .slice(0, 5)
      .map(p => ({
        name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
        value: p.stock * p.buyPrice
      }));
  }, [products]);

  const recentSales = useMemo(() => {
    // Sort by date descending and take top 5
    return [...sales]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [sales]);

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Revenue Card (New) */}
        <Card className="p-6 border-l-4 border-l-emerald-500 bg-gradient-to-br from-white to-emerald-50/50 dark:from-slate-900 dark:to-emerald-900/10">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Ingresos Totales</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                ${metrics.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-xs text-emerald-600 mt-1 flex items-center font-medium">
                <Wallet size={12} className="mr-1" /> {sales.length} ventas realizadas
              </p>
            </div>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600">
              <DollarSign size={24} />
            </div>
          </div>
        </Card>

        {/* Inventory Value */}
        <Card className="p-6 border-l-4 border-l-blue-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Valor Stock (Costo)</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                ${metrics.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-xs text-blue-600 mt-1 flex items-center">
                <TrendingUp size={12} className="mr-1" /> Capital invertido
              </p>
            </div>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600">
              <Package size={24} />
            </div>
          </div>
        </Card>

        {/* Low Stock */}
        <Card className="p-6 border-l-4 border-l-orange-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Stock Bajo</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{metrics.lowStock}</h3>
              <p className="text-xs text-orange-600 mt-1">Productos por reponer</p>
            </div>
            <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg text-orange-600">
              <AlertTriangle size={24} />
            </div>
          </div>
        </Card>

        {/* Expired/Out */}
        <Card className="p-6 border-l-4 border-l-red-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Alertas Críticas</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{metrics.expired + metrics.outOfStock}</h3>
              <p className="text-xs text-red-600 mt-1">{metrics.expired} vencidos / {metrics.outOfStock} agotados</p>
            </div>
            <div className="p-2 bg-red-50 dark:bg-red-900/30 rounded-lg text-red-600">
              <XCircle size={24} />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Charts Section */}
        <div className="lg:col-span-2 grid grid-cols-1 gap-6">
            {/* Sales History Table (New) */}
            <Card className="flex-1 overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                <h4 className="text-lg font-semibold text-slate-800 dark:text-white">Historial Reciente de Ventas</h4>
                <button className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
                  Ver todas <ArrowRight size={12} />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-3 font-medium text-slate-500">ID</th>
                      <th className="px-6 py-3 font-medium text-slate-500">Cliente</th>
                      <th className="px-6 py-3 font-medium text-slate-500">Fecha</th>
                      <th className="px-6 py-3 font-medium text-slate-500 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                    {recentSales.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-slate-400 text-sm">
                          No hay ventas registradas aún.
                        </td>
                      </tr>
                    ) : (
                      recentSales.map(sale => (
                        <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-3 font-mono text-xs text-slate-500">#{sale.id.slice(0, 6)}</td>
                          <td className="px-6 py-3 font-medium text-slate-800 dark:text-white capitalize">{sale.customer.name}</td>
                          <td className="px-6 py-3 text-slate-500 text-xs">
                             {new Date(sale.date).toLocaleDateString()} <span className="text-slate-400">{new Date(sale.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </td>
                          <td className="px-6 py-3 font-bold text-emerald-600 text-right">
                            ${sale.total.toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card className="p-6">
              <h4 className="text-lg font-semibold text-slate-800 dark:text-white mb-6">Top Valor Inventario</h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stockValueData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#334155" opacity={0.3} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={100} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <Tooltip 
                      cursor={{fill: 'transparent'}}
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                    />
                    <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
        </div>

        {/* Side Charts */}
        <div className="lg:col-span-1">
          <Card className="p-6 h-full">
            <h4 className="text-lg font-semibold text-slate-800 dark:text-white mb-6">Stock por Categoría</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-2 text-sm max-h-48 overflow-y-auto">
              {categoryData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-slate-600 dark:text-slate-400 truncate flex-1">{entry.name}</span>
                  <span className="text-slate-500 font-medium">{entry.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;