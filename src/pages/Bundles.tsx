import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Layers, Trash2, Share2 } from 'lucide-react';
import { type AppData } from '../types';
import { deleteBundle } from '../services/storageService';

interface BundlesProps {
  data: AppData;
  refreshData: () => void;
}

const Bundles: React.FC<BundlesProps> = ({ data, refreshData }) => {
  const navigate = useNavigate();

  const getBundleImages = (itemIds: string[]) => {
    return itemIds.slice(0, 3).map(id => {
      const item = data.items.find(i => i.id === id);
      return item?.imageUrl;
    });
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('确定要删除这个组合吗？')) {
      deleteBundle(id);
      refreshData();
    }
  };

  const handleShare = (e: React.MouseEvent, bundleName: string, itemCount: number) => {
      e.stopPropagation();
      const shareText = `【WeStock库存分享】\n组合名称：${bundleName}\n包含商品：${itemCount}件\n快来看看这个搭配方案！`;
      navigator.clipboard.writeText(shareText).then(() => {
          alert('分享文案已复制到剪贴板！');
      }).catch(() => {
          alert('复制失败，请手动截图分享。');
      });
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="bg-white px-4 pt-4 pb-4 sticky top-0 z-10 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">搭配组合</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {data.bundles.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-64 text-gray-400">
             <Layers size={48} className="mb-4 opacity-20" />
             <p>暂无搭配组合</p>
           </div>
        ) : (
          data.bundles.map(bundle => {
            const images = getBundleImages(bundle.itemIds);
            const itemCount = bundle.itemIds.length;
            
            return (
              <div key={bundle.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 active:bg-gray-50 transition-colors cursor-pointer group">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900">{bundle.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">{bundle.description || '无描述'}</p>
                  </div>
                  <div className="flex gap-1">
                    <button 
                        onClick={(e) => handleShare(e, bundle.name, itemCount)}
                        className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-full transition-colors"
                        title="分享组合"
                    >
                        <Share2 size={16} />
                    </button>
                    <button 
                        onClick={(e) => handleDelete(e, bundle.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        title="删除"
                    >
                        <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {images.map((src, idx) => (
                      <div key={idx} className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                        {src ? (
                          <img src={src} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300">
                             <span className="text-[8px]">•</span>
                          </div>
                        )}
                      </div>
                    ))}
                    {itemCount > 3 && (
                      <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                        +{itemCount - 3}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 ml-2">共 {itemCount} 件商品</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <button
        onClick={() => navigate('/create-bundle')}
        className="fixed bottom-20 right-4 w-14 h-14 bg-brand-600 text-white rounded-full shadow-lg shadow-brand-500/30 flex items-center justify-center hover:bg-brand-700 active:scale-95 transition-all z-20"
      >
        <Plus size={28} />
      </button>
    </div>
  );
};

export default Bundles;