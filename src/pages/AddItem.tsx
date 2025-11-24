import React, { useState, useRef } from 'react';
import { Camera, ArrowLeft, Loader2, Sparkles, MapPin, FileText } from 'lucide-react';
import { useNavigate } from 'react-dom';
import { Size, type StockLevels } from '../types';
import { addItem } from '../services/storageService';
import { fileToBase64, analyzeItemImage } from '../services/geminiService';

interface AddItemProps {
  refreshData: () => void;
}

const AddItem: React.FC<AddItemProps> = ({ refreshData }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [note, setNote] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stock, setStock] = useState<StockLevels>({
    [Size.XS]: 0,
    [Size.S]: 0,
    [Size.M]: 0,
    [Size.L]: 0,
    [Size.OTHER]: 0,
  });

  const commonLocations = ['仓库 A', '店铺前台', '家中', '样品间'];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await fileToBase64(file);
      const dataUrl = `data:${file.type};base64,${base64}`;
      setImagePreview(dataUrl);

      // Trigger Gemini Analysis
      if (process.env.API_KEY) {
        setIsAnalyzing(true);
        try {
          const result = await analyzeItemImage(base64, file.type);
          setName(result.name);
          setCategory(result.category);
        } catch (error) {
            console.error(error);
          alert("AI 识别失败，请手动输入");
        } finally {
          setIsAnalyzing(false);
        }
      }
    }
  };

  const handleStockChange = (size: Size, delta: number) => {
    setStock(prev => ({
      ...prev,
      [size]: Math.max(0, prev[size] + delta)
    }));
  };

  const handleSubmit = () => {
    if (!name) {
      alert("请输入商品名称");
      return;
    }
    const newItem = {
      id: Date.now().toString(),
      name,
      category: category || "未分类",
      imageUrl: imagePreview || undefined,
      stock,
      location: location || "默认位置",
      note,
      createdAt: Date.now()
    };
    addItem(newItem);
    refreshData();
    navigate('/inventory');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-safe-area">
      {/* Header */}
      <div className="bg-white px-4 py-3 sticky top-0 flex items-center shadow-sm z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold ml-2">入库新商品</h1>
      </div>

      <div className="p-4 space-y-6 pb-24">
        {/* Image Upload */}
        <div className="flex flex-col items-center">
            <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-48 bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 cursor-pointer overflow-hidden relative group"
            >
                {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                    <>
                        <Camera size={40} className="mb-2" />
                        <span className="text-sm">点击拍照或上传图片</span>
                    </>
                )}
                
                {/* AI Overlay */}
                {isAnalyzing && (
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white backdrop-blur-sm">
                        <Loader2 className="animate-spin mb-2" />
                        <span className="text-sm font-medium">AI 正在识别商品...</span>
                    </div>
                )}
            </div>
            <input 
                ref={fileInputRef} 
                type="file" 
                accept="image/*" 
                capture="environment" 
                className="hidden" 
                onChange={handleFileChange}
            />
            
            {imagePreview && !isAnalyzing && (
                 <button 
                 onClick={() => fileInputRef.current?.click()}
                 className="mt-2 text-sm text-brand-600 font-medium"
               >
                 重新上传
               </button>
            )}
        </div>

        {/* Basic Info */}
        <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">商品名称</label>
                <div className="relative">
                    <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="例如：纯棉白色T恤"
                        className="w-full border-b border-gray-200 py-2 focus:border-brand-500 focus:outline-none bg-transparent"
                    />
                    {isAnalyzing && <Sparkles className="absolute right-0 top-2 text-brand-400 animate-pulse" size={16} />}
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                <input 
                    type="text" 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="例如：上装"
                    className="w-full border-b border-gray-200 py-2 focus:border-brand-500 focus:outline-none bg-transparent"
                />
            </div>
        </div>

        {/* Location & Note */}
        <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
             <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                    <MapPin size={16} className="mr-1 text-gray-500" /> 存放地点
                </label>
                <input 
                    type="text" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="输入或选择位置"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                    {commonLocations.map(loc => (
                        <button 
                            key={loc}
                            onClick={() => setLocation(loc)}
                            className={`text-xs px-2 py-1 rounded-full border ${
                                location === loc 
                                ? 'bg-brand-50 border-brand-200 text-brand-700' 
                                : 'bg-gray-50 border-gray-200 text-gray-600'
                            }`}
                        >
                            {loc}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                    <FileText size={16} className="mr-1 text-gray-500" /> 备注信息
                </label>
                <textarea 
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="输入关于商品的备注信息..."
                    rows={2}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                />
            </div>
        </div>

        {/* Stock Matrix */}
        <div className="bg-white p-4 rounded-xl shadow-sm">
            <h3 className="text-sm font-medium text-gray-700 mb-4">库存数量</h3>
            <div className="space-y-4">
                {Object.values(Size).map((size) => (
                    <div key={size} className="flex items-center justify-between">
                        <span className="text-gray-600 font-medium w-12">{size}</span>
                        <div className="flex items-center bg-gray-50 rounded-lg p-1">
                            <button 
                                onClick={() => handleStockChange(size, -1)}
                                className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 active:scale-90 transition-transform"
                            >
                                -
                            </button>
                            <input 
                                type="number" 
                                value={stock[size]} 
                                readOnly
                                className="w-12 text-center bg-transparent font-bold text-gray-800"
                            />
                             <button 
                                onClick={() => handleStockChange(size, 1)}
                                className="w-8 h-8 flex items-center justify-center bg-brand-500 text-white rounded shadow-sm active:scale-90 transition-transform"
                            >
                                +
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* Footer Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t z-20">
        <button 
            onClick={handleSubmit}
            className="w-full bg-brand-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-brand-500/20 active:scale-[0.98] transition-all"
        >
            确认入库
        </button>
      </div>
    </div>
  );
};

export default AddItem;