import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { Size, type AppData } from '../types';

interface DashboardProps {
  data: AppData;
}

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const totalItems = data.items.length;
  const totalStock = data.items.reduce((acc: number, item) => {
    return acc + (Object.values(item.stock) as number[]).reduce((a, b) => a + b, 0);
  }, 0);
  const totalBundles = data.bundles.length;
  
  // Calculate items in bundles
  const totalBundledItemsCount = data.bundles.reduce((acc, bundle) => {
      return acc + bundle.itemIds.length;
  }, 0);

  // Stock by Size
  const stockBySize = useMemo(() => {
    const counts = { [Size.XS]: 0, [Size.S]: 0, [Size.M]: 0, [Size.L]: 0, [Size.OTHER]: 0 };
    data.items.forEach(item => {
      Object.entries(item.stock).forEach(([size, count]) => {
        if (size in counts) counts[size as Size] += (count as number);
      });
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [data.items]);

  // Items by Location
  const stockByLocation = useMemo(() => {
      const locations: Record<string, number> = {};
      data.items.forEach(item => {
          const loc = item.location || '未知';
          const itemTotal = (Object.values(item.stock) as number[]).reduce((a, b) => a + b, 0);
          locations[loc] = (locations[loc] || 0) + itemTotal;
      });
      return Object.entries(locations).map(([name, value]) => ({ name, value }));
  }, [data.items]);

  const COLORS = ['#86efac', '#4ade80', '#22c55e', '#16a34a', '#15803d', '#14532d'];
  const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#f43f5e', '#f59e0b', '#10b981'];

  return (
    <div className="p-4 pb-24 space-y-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">库存概览</h1>
        <p className="text-sm text-gray-500">实时数据统计</p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">总件数</span>
                <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">库存</span>
            </div>
            <span className="text-3xl font-bold text-brand-600 mt-2 block">{totalStock}</span>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">商品种类</span>
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">SKU</span>
            </div>
            <span className="text-3xl font-bold text-gray-800 mt-2 block">{totalItems}</span>
        </div>
      </div>
      
       <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">组合方案</span>
                <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">Plan</span>
            </div>
            <span className="text-3xl font-bold text-purple-600 mt-2 block">{totalBundles}</span>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
             <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">被组合商品</span>
                 <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">Linked</span>
            </div>
            <span className="text-3xl font-bold text-gray-800 mt-2 block">{totalBundledItemsCount}</span>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">尺码分布</h3>
            <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stockBySize}>
                <XAxis dataKey="name" tick={{fontSize: 12}} stroke="#9ca3af" />
                <YAxis hide />
                <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    cursor={{ fill: '#f3f4f6' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {stockBySize.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Bar>
                </BarChart>
            </ResponsiveContainer>
            </div>
        </div>

        {stockByLocation.length > 0 && (
             <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">地点分布</h3>
                <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                    <Pie
                        data={stockByLocation}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {stockByLocation.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                    </Pie>
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
                </div>
            </div>
        )}
      </div>
      
      {/* Quick Actions Hint */}
      {totalItems === 0 && (
        <div className="bg-brand-50 border border-brand-100 p-4 rounded-xl text-center">
          <p className="text-brand-700 mb-2">还没有数据？</p>
          <p className="text-sm text-brand-600">点击底部菜单的“库存”开始添加商品吧。</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;