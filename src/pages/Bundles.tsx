import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Layers, Trash2, ArrowDownToLine, Edit2, Copy, X, Share2 } from 'lucide-react';
import { AppData } from '../types';
import { deleteBundle, exportBundleToken, importBundleToken } from '../services/storageService';
import { useToast } from '../contexts/ToastContext';

interface BundlesProps { data: AppData; refreshData: () => void; }

const Bundles: React.FC<BundlesProps> = ({ data, refreshData }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [shareModalToken, setShareModalToken] = useState<string | null>(null);

  const getBundleImages = (itemIds: string[]) => itemIds.slice(0, 3).map(id => data.items.find(i => i.id === id)?.imageUrl);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('确定要删除这个组合吗？')) {
      deleteBundle(id);
      refreshData();
    }
  };

  const handleEdit = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      navigate(`/create-bundle?id=${id}`);
  };

  const handleShare = (e: React.MouseEvent, bundleId: string) => {
      e.stopPropagation();
      const token = exportBundleToken(bundleId);
      if (!token) { showToast('生成口令失败', 'error'); return; }
      setShareModalToken(token);
  };

  const handleImport = () => {
      const token = prompt("请粘贴朋友发来的“组合分享口令”：");
      if (token && token.trim()) {
          if (importBundleToken(token.trim())) {
              showToast('组合导入成功！', 'success');
              refreshData();
          } else {
              showToast('导入失败：口令格式错误', 'error');
          }
      }
  };

  const getBundleStats = (itemIds: string[]) => {
      let totalPieces = 0;
      itemIds.forEach(id => {
          const item = data.items.find(i => i.id === id);
          if (item) totalPieces += Object.values(item.stock).reduce((a, b) => a + (b as number), 0);
      });
      return { styles: itemIds.length, pieces: totalPieces };
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="bg-white px-4 pt-4 pb-4 sticky top-0 z-10 shadow-sm flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">搭配组合</h1>
        <button onClick={handleImport} className="flex items-center gap-1 text-xs font-bold text-brand-600 bg-brand-50 px-3 py-1.5 rounded-full border border-brand-100 active:bg-brand-100"><ArrowDownToLine size={14} /> 导入组合</button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {data.bundles.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-64 text-gray-400"><Layers size={48} className="mb-4 opacity-20" /><p>暂无搭配组合</p></div>
        ) : (
          data.bundles.map(bundle => {
            const images = getBundleImages(bundle.itemIds);
            const { styles, pieces } = getBundleStats(bundle.itemIds);
            return (
              <div key={bundle.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 active:bg-gray-50 transition-colors cursor-pointer group">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900">{bundle.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">{bundle.description || '无描述'}</p>
                  </div>
                  <div className="flex gap-1">
                     <button onClick={(e) => handleEdit(e, bundle.id)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="编辑"><Edit2 size={16} /></button>
                    <button onClick={(e) => handleShare(e, bundle.id)} className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-full transition-colors" title="复制分享口令"><Share2 size={16} /></button>
                    <button onClick={(e) => handleDelete(e, bundle.id)} className="p-1.5 text-gray-300 hover:text-red-500"><Trash2 size={16} /></button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {images.map((src, idx) => (
                      <div key={idx} className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                        {src ? <img src={src} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300"><span className="text-[8px]">•</span></div>}
                      </div>
                    ))}
                    {styles > 3 && <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">+{styles - 3}</div>}
                  </div>
                  <span className="text-xs text-gray-400 ml-2">共 <span className="font-bold text-gray-600">{styles}</span> 款 <span className="font-bold text-brand-600">{pieces}</span> 件商品</span>
                </div>
              </div>
            );
          })
        )}
      </div>
      <button onClick={() => navigate('/create-bundle')} className="fixed bottom-20 right-4 w-14 h-14 bg-brand-600 text-white rounded-full shadow-lg shadow-brand-500/30 flex items-center justify-center hover:bg-brand-700 active:scale-95 transition-all z-20"><Plus size={28} /></button>

      {/* Share Token Modal */}
      {shareModalToken && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
              <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-[scaleIn_0.2s_ease-out]">
                  <div className="bg-brand-600 p-4 flex justify-between items-center">
                      <h3 className="text-white font-bold flex items-center gap-2"><Share2 size={20} /> 分享组合</h3>
                      <button onClick={() => setShareModalToken(null)} className="text-white/80 hover:text-white bg-white/10 rounded-full p-1"><X size={20} /></button>
                  </div>
                  <div className="p-6">
                      <p className="text-sm text-gray-600 mb-3">复制下方口令，发送给朋友：</p>
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4 relative group">
                          <textarea 
                            readOnly 
                            value={shareModalToken} 
                            className="w-full h-24 bg-transparent text-xs text-gray-500 font-mono break-all resize-none focus:outline-none"
                            onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                          />
                          <div className="absolute bottom-2 right-2 text-[10px] text-gray-400">长按全选复制</div>
                      </div>
                      <button 
                        onClick={() => {
                            navigator.clipboard.writeText(shareModalToken).then(() => showToast('已复制到剪贴板', 'success'));
                        }}
                        className="w-full bg-brand-600 text-white font-bold py-3 rounded-xl hover:bg-brand-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                      >
                          <Copy size={18} /> 一键复制
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Bundles;