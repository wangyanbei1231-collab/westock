
import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { Filter } from 'lucide-react';
import { Size, AppData, InventoryItem } from '../types';

interface DashboardProps { data: AppData; }

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const [selectedBundleId, setSelectedBundleId] = useState<string>('all');

  // 1. 筛选逻辑：确定当前统计范围内的商品
  const activeItems: InventoryItem[] = useMemo(() => {
    if (selectedBundleId === 'all') {
      return data.items;
    }
    const bundle = data.bundles.find(b => b.id === selectedBundleId);
    if (!bundle) return [];
    // 找到所有在组合 itemIds 列表里的商品
    return data.items.filter(item => bundle.itemIds.includes(item.id));
  }, [data.items, selectedBundleId, data.bundles]);

  // 2. 计算当前范围内的总库存数 (SKU总和)
  const totalStockCount = useMemo(() => {
    return activeItems.reduce((acc, item) => 
        acc + Object.values(item.stock).reduce((a, b) => a + (b as number), 0), 0
    );
  }, [activeItems]);

  const activeItemCount = activeItems.length;

  // 3. 计算尺码分布
  const stockBySize = useMemo(() => {
    const counts = { [Size.XS]: 0, [Size.S]: 0, [Size.M]: 0, [Size.L]: 0, [Size.OTHER]: 0 };
    activeItems.forEach(item => {
      Object.entries(item.stock).forEach(([size, count]) => { if (size in counts) counts[size as Size] += (count as number); });
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [activeItems]);

  const COLORS = ['#86efac', '#22c55e', '#15803d', '#14532d', '#166534'];

  return (
    <div className="p-4 pb-24 space-y-6">
      <header className="mb-2 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">YSQUARE</h1>
      </header>

      {/* 统计范围选择器 */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-3">
            <Filter size={16} className="text-brand-600" />
            <span className="font-bold text-gray-700 text-sm">选择统计范围</span>
        </div>
        <div className="relative">
            <select 
                value={selectedBundleId} 
                onChange={(e) => setSelectedBundleId(e.target.value)}
                className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-800 py-3 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-brand-500 font-medium text-sm transition-all"
            >
                <option value="all">📊 全部库存总览</option>
                <option disabled>──────────</option>
                {data.bundles.map(b => (
                    <option key={b.id} value={b.id}>📦 {b.name}</option>
                ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
        </div>
      </div>

      {/* 核心数据卡片 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-brand-500 to-brand-700 p-4 rounded-2xl shadow-lg shadow-brand-200 text-white">
            <span className="text-xs text-brand-100 opacity-80">
                {selectedBundleId === 'all' ? '总库存件数' : '组合内总件数'}
            </span>
            <span className="text-4xl font-bold mt-1 block">{totalStockCount}</span>
            <span className="text-xs text-brand-100 mt-2 block opacity-60">
                涉及 {activeItemCount} 款商品
            </span>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
             <span className="text-xs text-gray-400">组合方案数</span>
             <span className="text-3xl font-bold text-gray-800 mt-1 block">
                {data.bundles.length}
             </span>
             <span className="text-xs text-gray-400 mt-2 block">已创建方案</span>
        </div>
      </div>

      {/* 尺码统计图表 */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-gray-800">
                {selectedBundleId === 'all' ? '全部库存尺码分布' : '当前组合尺码分布'}
            </h3>
        </div>
        
        <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stockBySize} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                    <XAxis 
                        dataKey="name" 
                        tick={{fontSize: 11, fill: '#6b7280'}} 
                        stroke="#e5e7eb" 
                        axisLine={false} 
                        tickLine={false} 
                        dy={10}
                    />
                    <Tooltip 
                        cursor={{fill: 'transparent'}} 
                        contentStyle={{borderRadius: '8px', border:'none', boxShadow:'0 4px 12px rgba(0,0,0,0.1)'}} 
                    />
                    <Bar dataKey="value" radius={[6, 6, 6, 6]}>
                        {stockBySize.map((_entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        {/* 在柱子上方显示具体数值 */}
                        <LabelList 
                            dataKey="value" 
                            position="top" 
                            fill="#374151" 
                            fontSize={12} 
                            fontWeight="bold" 
                            formatter={(val: number) => val > 0 ? val : ''} 
                        />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
