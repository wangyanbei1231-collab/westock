import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Layers, Trash2, ArrowDownToLine, Edit2, Copy, X, Share2, ClipboardPaste, Loader2, ChevronDown, ChevronUp, Package, Info } from 'lucide-react';
import { AppData, InventoryItem } from '../types';
import { deleteBundle, exportBundleToken, importBundleToken } from '../services/storageService';
import { useToast } from '../contexts/ToastContext';

interface BundlesProps { data: AppData; refreshData: () => void; }

const Bundles: React.FC<BundlesProps> = ({ data, refreshData }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [shareModalToken, setShareModalToken] = useState<string | null>(null);
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importToken, setImportToken] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  
  const [expandedBundles, setExpandedBundles] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
      const newSet = new Set(expandedBundles);
      if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
      setExpandedBundles(newSet);
  };

  const getBundleImages = (itemIds: string[]) => itemIds.slice(0, 3).map(id => data.items.find(i => i.id === id)?.imageUrl);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('确定要删除这个组合吗？')) { deleteBundle(id); refreshData(); }
  };

  const handleEdit = (e: React.MouseEvent, id: string) => { e.stopPropagation(); navigate(`/create-bundle?id=${id}`); };

  const handleShare = async (e: React.MouseEvent, bundleId: string) => {
      e.stopPropagation();
      setIsGeneratingToken(true);
      try {
          const token = await exportBundleToken(bundleId);
          if (!token) { showToast('生成失败，请检查网络', 'error'); } 
          else { setShareModalToken(token); }
      } catch (err) { showToast('网络错误', 'error'); } 
      finally { setIsGeneratingToken(false); }
  };

  const handleImportSubmit = async () => {
      if (!importToken.trim()) { showToast('请输入口令', 'error'); return; }
      setIsImporting(true);
      try {
          const success = await importBundleToken(importToken.trim());
          if (success) { showToast('组合导入成功！', 'success'); refreshData(); setShowImportModal(false); setImportToken(''); } 
          else { showToast('口令无效或已过期', 'error'); }
      } catch (err) { showToast('导入失败，请检查网络', 'error'); } 
      finally { setIsImporting(false); }
  };

  const handlePasteFromClipboard = async () => {
      try {
          const text = await navigator.clipboard.readText();
          if (text) setImportToken(text); else showToast('剪贴板为空', 'info');
      } catch (err) { showToast('无法读取剪贴板，请手动粘贴', 'error'); }
  };

  const getBundleItems = (itemIds: string[]): InventoryItem[] => {
      return itemIds.map(id => data.items.find(i => i.id === id)).filter(Boolean) as InventoryItem[];
  };

  const getItemTotalStock = (item: InventoryItem) => Object.values(item.stock).reduce((a, b) => a + (b as number), 0);

  const handleItemClick = (e: React.MouseEvent, itemId: string) => {
      e.stopPropagation();
      navigate(`/add-item?id=${itemId}`);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {isGeneratingToken && (<div className="fixed inset-0 bg-black/30 z-[60] flex items-center justify-center backdrop-blur-sm"><div className="bg-white px-6 py-4 rounded-xl shadow-xl flex items-center gap-3"><Loader2 className="animate-spin text-brand-600" /><span className="font-bold text-gray-700">正在生成短口令...</span></div></div>)}
      <div className="bg-white px-4 pt-4 pb-4 sticky top-0 z-10 shadow-sm flex justify-between items-center"><h1 className="text-2xl font-bold text-gray-900">搭配组合</h1><button onClick={() => setShowImportModal(true)} className="flex items-center gap-1 text-xs font-bold text-brand-600 bg-brand-50 px-3 py-1.5 rounded-full border border-brand-100 active:bg-brand-100"><ArrowDownToLine size={14} /> 导入组合</button></div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {data.bundles.length === 0 ? (<div className="flex flex-col items-center justify-center h-64 text-gray-400"><Layers size={48} className="mb-4 opacity-20" /><p>暂无搭配组合</p></div>) : (
          data.bundles.map(bundle => {
            const images = getBundleImages(bundle.itemIds);
            const bundleItems = getBundleItems(bundle.itemIds);
            const totalPieces = bundleItems.reduce((acc, item) => acc + getItemTotalStock(item), 0);
            const isExpanded = expandedBundles.has(bundle.id);

            return (
              <div key={bundle.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all">
                {/* Header */}
                <div className="p-4 cursor-pointer active:bg-gray-50" onClick={() => toggleExpand(bundle.id)}>
                    <div className="flex justify-between items-start mb-3">
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg">{bundle.name}</h3>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{bundle.description || '暂无描述'}</p>
                    </div>
                    <div className="flex gap-1">
                        <button onClick={(e) => handleEdit(e, bundle.id)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"><Edit2 size={18} /></button>
                        <button onClick={(e) => handleShare(e, bundle.id)} className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-full transition-colors"><Share2 size={18} /></button>
                        <button onClick={(e) => handleDelete(e, bundle.id)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"><Trash2 size={18} /></button>
                    </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-3">
                            <div className="flex -space-x-2">
                                {images.map((src, idx) => (<div key={idx} className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 overflow-hidden">{src ? <img src={src} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><Package size={12} /></div>}</div>))}
                            </div>
                            <div className="h-4 w-[1px] bg-gray-200 mx-1"></div>
                            <span className="text-xs font-medium text-gray-600">{bundle.itemIds.length} 款 / {totalPieces} 件</span>
                        </div>
                        {isExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                    </div>
                </div>

                {/* Details (Expanded) */}
                {isExpanded && (
                    <div className="bg-gray-50/50 border-t border-gray-100 px-3 py-2 space-y-2 animate-[fadeIn_0.2s_ease-out]">
                        {bundleItems.map(item => (
                            <div 
                                key={item.id} 
                                onClick={(e) => handleItemClick(e, item.id)}
                                className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex gap-3 active:scale-[0.98] transition-transform relative group"
                            >
                                <div className="w-16 h-16 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden border border-gray-100">
                                    {item.imageUrl ? <img src={item.imageUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><Package size={24} /></div>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="text-sm font-bold text-gray-800 truncate">{item.name}</h4>
                                        <div className="text-[10px] font-bold bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded border border-brand-100">
                                            总库存: {getItemTotalStock(item)}
                                        </div>
                                    </div>
                                    {/* Stock Breakdown Grid */}
                                    <div className="grid grid-cols-5 gap-1 mb-1.5">
                                        {Object.entries(item.stock).map(([size, count]) => (
                                            (count as number) > 0 && (
                                                <div key={size} className="flex flex-col items-center bg-gray-50 border border-gray-200 rounded px-0.5 py-0.5">
                                                    <span className="text-[8px] text-gray-400 font-bold uppercase">{size}</span>
                                                    <span className="text-[10px] text-gray-800 font-bold leading-none">{count as number}</span>
                                                </div>
                                            )
                                        ))}
                                    </div>
                                    {item.note && (
                                        <div className="flex items-start gap-1 text-[10px] text-gray-400 bg-yellow-50/50 px-1.5 py-1 rounded">
                                            <Info size={10} className="mt-0.5 flex-shrink-0 text-yellow-500" />
                                            <span className="line-clamp-1">{item.note}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
              </div>
            );
          })
        )}
      </div>
      <button onClick={() => navigate('/create-bundle')} className="fixed bottom-20 right-4 w-14 h-14 bg-brand-600 text-white rounded-full shadow-lg shadow-brand-500/30 flex items-center justify-center hover:bg-brand-700 active:scale-95 transition-all z-20"><Plus size={28} /></button>
      
      {shareModalToken && (<div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"><div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-[scaleIn_0.2s_ease-out]"><div className="bg-brand-600 p-4 flex justify-between items-center"><h3 className="text-white font-bold flex items-center gap-2"><Share2 size={20} /> 分享组合</h3><button onClick={() => setShareModalToken(null)} className="text-white/80 hover:text-white bg-white/10 rounded-full p-1"><X size={20} /></button></div><div className="p-6"><p className="text-sm text-gray-600 mb-3">复制下方短口令，发送给朋友：</p><div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4 relative group"><div className="w-full py-2 bg-transparent text-xl text-brand-700 font-mono font-bold text-center tracking-wider select-all">{shareModalToken}</div></div><button onClick={() => {navigator.clipboard.writeText(shareModalToken).then(() => showToast('已复制到剪贴板', 'success'));}} className="w-full bg-brand-600 text-white font-bold py-3 rounded-xl hover:bg-brand-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"><Copy size={18} /> 一键复制</button></div></div></div>)}
      {showImportModal && (<div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"><div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-[scaleIn_0.2s_ease-out]"><div className="bg-brand-600 p-4 flex justify-between items-center"><h3 className="text-white font-bold flex items-center gap-2"><ArrowDownToLine size={20} /> 导入组合</h3><button onClick={() => setShowImportModal(false)} className="text-white/80 hover:text-white bg-white/10 rounded-full p-1"><X size={20} /></button></div><div className="p-6"><p className="text-sm text-gray-600 mb-3">输入朋友发来的短口令 (WS-...)：</p><div className="relative mb-4"><textarea value={importToken} onChange={(e) => setImportToken(e.target.value)} placeholder="在此粘贴口令..." className="w-full h-16 bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-800 font-mono break-all resize-none focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" /><button onClick={handlePasteFromClipboard} className="absolute bottom-2 right-2 text-[10px] bg-white border border-gray-200 px-2 py-1 rounded-md text-brand-600 font-bold flex items-center gap-1 shadow-sm hover:bg-gray-50"><ClipboardPaste size={12} /> 粘贴</button></div><button onClick={handleImportSubmit} disabled={isImporting} className="w-full bg-brand-600 text-white font-bold py-3 rounded-xl hover:bg-brand-700 active:scale-[0.98] transition-all flex justify-center">{isImporting ? <Loader2 className="animate-spin" /> : '确认导入'}</button></div></div></div>)}
    </div>
  );
};

export default Bundles;