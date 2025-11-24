import React, { useState } from 'react';
import { ArrowLeft, CheckCircle, Circle, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { type AppData } from '../types';
import { addBundle } from '../services/storageService';

interface CreateBundleProps {
  data: AppData;
  refreshData: () => void;
}

const CreateBundle: React.FC<CreateBundleProps> = ({ data, refreshData }) => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedItemIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedItemIds(newSet);
  };

  const handleSave = () => {
    if (!name) return alert("请输入组合名称");
    if (selectedItemIds.size === 0) return alert("请至少选择一件商品");

    addBundle({
      id: Date.now().toString(),
      name,
      description,
      itemIds: Array.from(selectedItemIds),
      createdAt: Date.now()
    });
    refreshData();
    navigate('/bundles');
  };

  const filteredItems = data.items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-screen flex flex-col bg-gray-50 pb-safe-area">
      {/* Header */}
      <div className="bg-white px-4 py-3 shadow-sm z-10">
        <div className="flex items-center mb-4">
           <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-bold ml-2">新建组合</h1>
          <button 
            onClick={handleSave}
            className="ml-auto text-brand-600 font-bold text-sm px-3 py-1 rounded-full bg-brand-50"
          >
            保存
          </button>
        </div>
        
        <input 
            type="text" 
            placeholder="组合名称 (如: 夏季出游装)"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full text-lg font-bold placeholder-gray-300 border-none focus:ring-0 p-0 mb-2"
        />
        <input 
            type="text" 
            placeholder="添加描述..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full text-sm text-gray-600 placeholder-gray-300 border-none focus:ring-0 p-0"
        />
      </div>

      {/* Item Selection */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="p-4 bg-gray-50 border-b">
           <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                    type="text"
                    placeholder="搜索要添加的商品..."
                    className="w-full bg-white rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
            {filteredItems.map(item => {
                const isSelected = selectedItemIds.has(item.id);
                return (
                    <div 
                        key={item.id} 
                        onClick={() => toggleSelection(item.id)}
                        className={`flex items-center p-3 rounded-xl border transition-all cursor-pointer ${
                            isSelected ? 'bg-brand-50 border-brand-200' : 'bg-white border-gray-100'
                        }`}
                    >
                        <div className={`mr-4 ${isSelected ? 'text-brand-500' : 'text-gray-300'}`}>
                            {isSelected ? <CheckCircle size={24} fill="currentColor" className="text-white bg-brand-500 rounded-full" /> : <Circle size={24} />}
                        </div>
                        
                        <div className="w-12 h-12 rounded bg-gray-100 mr-3 overflow-hidden">
                             {item.imageUrl && <img src={item.imageUrl} className="w-full h-full object-cover" alt="" />}
                        </div>

                        <div>
                            <h4 className={`font-medium ${isSelected ? 'text-brand-900' : 'text-gray-800'}`}>{item.name}</h4>
                            <span className="text-xs text-gray-500">{item.category}</span>
                        </div>
                    </div>
                )
            })}
        </div>
      </div>
      
      {/* Selected Count Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex justify-between items-center text-sm font-medium text-gray-600 shadow-lg">
          <span>已选择 {selectedItemIds.size} 件商品</span>
      </div>
    </div>
  );
};

export default CreateBundle;