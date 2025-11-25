
import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Loader2, Sparkles, MapPin, FileText, Repeat, Scan } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Size, type StockLevels } from '../types';
import { addItem, getItem, updateItem } from '../services/storageService';
import { compressImage, analyzeItemImage } from '../services/geminiService';
import { useToast } from '../contexts/ToastContext';

interface AddItemProps {
  refreshData: () => void;
}

const AddItem: React.FC<AddItemProps> = ({ refreshData }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id'); // 检测是否为编辑模式

  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [note, setNote] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [continuousMode, setContinuousMode] = useState(false); // 连续添加模式
  const [stock, setStock] = useState<StockLevels>({
    [Size.XS]: 0, [Size.S]: 0, [Size.M]: 0, [Size.L]: 0, [Size.OTHER]: 0,
  });

  const commonLocations = ['仓库 A', '店铺前台', '家中', '样品间'];

  // Load data if Editing
  useEffect(() => {
    if (editId) {
        const item = getItem(editId);
        if (item) {
            setName(item.name);
            setCategory(item.category);
            setLocation(item.location || '');
            setNote(item.note || '');
            setImagePreview(item.imageUrl || null);
            setStock(item.stock);
        }
    }
  }, [editId]);

  const vibrate = () => { if (navigator.vibrate) navigator.vibrate(10); };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAiError(null);
      vibrate();
      try {
        // 压缩 + 正方形裁剪
        const compressedDataUrl = await compressImage(file, 600, 0.6);
        setImagePreview(compressedDataUrl);

        if (process.env.API_KEY) {
            setIsAnalyzing(true);
            const base64Data = compressedDataUrl.split(',')[1];
            try {
                const result = await analyzeItemImage(base64Data, 'image/jpeg');
                setName(result.name);
                setCategory(result.category);
                vibrate();
                showToast('AI 识别成功', 'success');
            } catch (error) {
                setAiError("AI 识别失败");
                showToast('AI 识别失败', 'info');
            } finally {
                setIsAnalyzing(false);
            }
        }
      } catch (err) {
        showToast('图片处理失败', 'error');
      }
    }
  };

  const handleStockChange = (size: Size, delta: number) => {
    setStock(prev => {
        const newVal = Math.max(0, prev[size] + delta);
        if (newVal !== prev[size]) vibrate();
        return { ...prev, [size]: newVal };
    });
  };

  const handleSubmit = () => {
    if (!name) { showToast("请输入商品名称", 'error'); return; }
    
    const itemPayload = {
      id: editId || Date.now().toString(),
      name,
      category: category || "未分类",
      imageUrl: imagePreview || undefined,
      stock,
      location: location || "默认位置",
      note,
      createdAt: editId ? (getItem(editId)?.createdAt || Date.now()) : Date.now()
    };
    
    let success = false;
    if (editId) {
        success = updateItem(itemPayload);
        if (success) showToast('更新成功！', 'success');
    } else {
        success = addItem(itemPayload);
        if (success) showToast('入库成功！', 'success');
    }

    if (success) {
        if (navigator.vibrate) navigator.vibrate(50);
        refreshData();
        
        if (continuousMode && !editId) {
            // Reset fields but keep location/category for convenience
            setName('');
            setStock({ [Size.XS]: 0, [Size.S]: 0, [Size.M]: 0, [Size.L]: 0, [Size.OTHER]: 0 });
            setNote('');
            setImagePreview(null);
            // Scroll to top
            window.scrollTo(0,0);
        } else {
            navigate('/inventory');
        }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-safe-area">
      <div className="bg-white px-4 py-3 sticky top-0 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600">
            <ArrowLeft size={24} />
            </button>
            <h1 className="text-lg font-bold ml-2">{editId ? '编辑商品' : '入库新商品'}</h1>
        </div>
        {!editId && (
            <button 
                onClick={() => setContinuousMode(!continuousMode)}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${continuousMode ? 'bg-brand-50 border-brand-200 text-brand-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}
            >
                <Repeat size={12} />
                连续添加
            </button>
        )}
      </div>

      <div className="p-4 space-y-6 pb-24">
        {/* Image Upload */}
        <div className="flex flex-col items-center">
            <div 
                onClick={() => fileInputRef.current?.click()}
                className={`w-40 h-40 bg-gray-100 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer overflow-hidden relative shadow-sm ${aiError ? 'border-red-300' : 'border-gray-300'}`}
            >
                {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                    <>
                        <Scan size={32} className="text-gray-400 mb-1 opacity-50" />
                        <span className="text-xs text-gray-400">点击拍照</span>
                        <span className="text-[10px] text-gray-300 mt-1">自动裁剪正方形</span>
                    </>
                )}
                {isAnalyzing && (
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white backdrop-blur-sm">
                        <Loader2 className="animate-spin mb-2" />
                    </div>
                )}
            </div>
            
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
        </div>

        {/* Basic Info */}
        <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">商品名称</label>
                <div className="relative">
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：白色T恤" className="w-full border-b border-gray-200 py-2 focus:border-brand-500 focus:outline-none bg-transparent font-medium" />
                    {isAnalyzing && <Sparkles className="absolute right-0 top-2 text-brand-400 animate-pulse" size={16} />}
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="例如：上装" className="w-full border-b border-gray-200 py-2 focus:border-brand-500 focus:outline-none bg-transparent" />
            </div>
        </div>

        {/* Stock Matrix */}
        <div className="bg-white p-4 rounded-xl shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-medium text-gray-700">库存数量</h3>
                <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded">总量: {Object.values(stock).reduce((a,b)=>a+b,0)}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                {Object.values(Size).map((size) => (
                    <div key={size} className="flex items-center justify-between border-b border-gray-50 pb-2">
                        <span className="text-gray-600 font-medium text-sm w-8">{size}</span>
                        <div className="flex items-center">
                            <button onClick={() => handleStockChange(size, -1)} className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-l text-gray-600 active:bg-gray-200">-</button>
                            <input type="number" value={stock[size]} readOnly className="w-10 text-center bg-gray-50 h-8 font-bold text-gray-800 text-sm" />
                             <button onClick={() => handleStockChange(size, 1)} className="w-8 h-8 flex items-center justify-center bg-brand-500 text-white rounded-r active:bg-brand-600">+</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Location & Note */}
        <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
             <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2"><MapPin size={16} className="mr-1 text-gray-500" /> 存放地点</label>
                <div className="flex flex-wrap gap-2 mb-2">
                    {commonLocations.map(loc => (
                        <button key={loc} onClick={() => setLocation(loc)} className={`text-xs px-2 py-1 rounded-full border ${location === loc ? 'bg-brand-50 border-brand-200 text-brand-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>{loc}</button>
                    ))}
                </div>
                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="自定义位置" className="w-full border-b border-gray-200 py-1 text-sm focus:border-brand-500 focus:outline-none" />
            </div>
            <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2"><FileText size={16} className="mr-1 text-gray-500" /> 备注</label>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="..." rows={1} className="w-full border-b border-gray-200 py-1 text-sm focus:border-brand-500 focus:outline-none resize-none" />
            </div>
        </div>

      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t z-20 flex gap-3">
        {continuousMode && !editId && (
            <div className="flex-1 bg-gray-100 text-gray-400 font-bold py-3.5 rounded-xl flex items-center justify-center text-sm">
                连续模式开启中
            </div>
        )}
        <button onClick={handleSubmit} className="flex-[2] bg-brand-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-brand-500/20 active:scale-[0.98] transition-all">
            {editId ? '保存修改' : (continuousMode ? '入库并继续' : '确认入库')}
        </button>
      </div>
    </div>
  );
};

export default AddItem;
