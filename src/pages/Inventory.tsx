import React, { useState } from 'react';
import { Plus, Search, Trash2, Shirt, MapPin, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Size, type AppData, type InventoryItem } from '../types';
import { deleteItem } from '../services/storageService';

interface InventoryProps {
  data: AppData;
  refreshData: () => void;
}

const Inventory: React.FC<InventoryProps> = ({ data, refreshData }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = data.items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('确定要删除这个商品吗？')) {
      deleteItem(id);
      refreshData();
    }
  };

  const getTotalStock = (item: InventoryItem) => Object.values(item.stock).reduce((a, b) => a + (b as number), 0);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 pt-4 pb-2 sticky top-0 z-10 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">商品库存</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="搜索名称或分类..."
            className="w-full bg-gray-100 text-gray-800 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Shirt size={48} className="mb-4 opacity-20" />
            <p>暂无商品</p>
          </div>
        ) : (
          filteredItems.map(item => (
            <div key={item.id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex gap-3 relative group">
               {/* Image Thumbnail */}
               <div className="w-20 h-20 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <Shirt size={24} />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900 truncate pr-2">{item.name}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="inline-block bg-gray-100 text-gray-500 text-[10px] px-2 py-0.5 rounded-full">
                        {item.category}
                      </span>
                      {item.location && (
                        <span className="flex items-center text-[10px] text-gray-400">
                          <MapPin size={10} className="mr-0.5" /> {item.location}
                        </span>
                      )}
                    </div>
                    {item.note && (
                        <div className="flex items-center text-[10px] text-gray-400 mt-1 truncate max-w-[150px]">
                            <FileText size={10} className="mr-0.5 flex-shrink-0" /> {item.note}
                        </div>
                    )}
                  </div>
                  <button 
                    onClick={(e) => handleDelete(e, item.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <div className="flex gap-2 overflow-x-auto no-scrollbar mask-gradient">
                     {Object.entries(item.stock).map(([size, count]) => (
                       (count as number) > 0 && (
                         <div key={size} className="flex flex-col items-center bg-brand-50 px-1.5 py-0.5 rounded border border-brand-100 min-w-[28px]">
                           <span className="text-[9px] font-bold text-brand-700">{size}</span>
                           <span className="text-[10px] text-brand-600">{count as number}</span>
                         </div>
                       )
                     ))}
                  </div>
                  <div className="text-xs font-bold text-gray-500 ml-2 whitespace-nowrap">
                    总量: {getTotalStock(item)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate('/add-item')}
        className="fixed bottom-20 right-4 w-14 h-14 bg-brand-600 text-white rounded-full shadow-lg shadow-brand-500/30 flex items-center justify-center hover:bg-brand-700 active:scale-95 transition-all z-20"
      >
        <Plus size={28} />
      </button>
    </div>
  );
};

export default Inventory;