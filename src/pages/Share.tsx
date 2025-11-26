import React, { useRef, useState } from 'react';
import { Download, Upload, Database, Lock, ShieldCheck, ChevronRight, LogIn, LogOut, Cloud } from 'lucide-react';
import { exportData, importData, getStorageUsage, setAppPin, hasAppPin, removeAppPin } from '../services/storageService';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

interface ShareProps { refreshData?: () => void; }

const Share: React.FC<ShareProps> = ({ refreshData }) => {
  const { showToast } = useToast();
  const { currentUser, login, logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasPin, setHasPin] = useState(hasAppPin());
  const storageUsed = getStorageUsage();

  const handleExport = () => { exportData(); showToast('备份文件下载已开始', 'success'); };
  const handleImportClick = () => { if (window.confirm('⚠️ 警告：恢复备份将覆盖当前数据！确定吗？')) fileInputRef.current?.click(); };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
          if (importData(event.target?.result as string)) { showToast('数据恢复成功！', 'success'); if (refreshData) refreshData(); } 
          else { showToast('数据文件格式错误', 'error'); }
          if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsText(file);
  };
  const handlePinSetting = () => {
      if (hasPin) { if (window.confirm('确定要移除应用锁吗？')) { removeAppPin(); setHasPin(false); showToast('应用锁已移除', 'info'); } } 
      else { const p1 = prompt("请设置 6 位数字 PIN 码："); if (p1 && p1.length >= 4) { setAppPin(p1); setHasPin(true); showToast('应用锁设置成功！', 'success'); } else if (p1) { showToast('密码太短', 'error'); } }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-safe-area">
      <div className="bg-gray-900 text-white p-6 pt-10 pb-16 rounded-b-[2.5rem] shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/20 bg-brand-500 flex items-center justify-center">
                {currentUser?.photoURL ? <img src={currentUser.photoURL} alt="Avatar" className="w-full h-full object-cover" /> : <span className="text-xl font-bold">{currentUser ? currentUser.email?.[0].toUpperCase() : '访'}</span>}
            </div>
            <div>
                {currentUser ? <><h1 className="text-xl font-bold">{currentUser.displayName || '用户'}</h1><p className="text-gray-400 text-sm flex items-center gap-1"><Cloud size={12} className="text-green-400" /> 已连接云端</p></> : <><h1 className="text-xl font-bold">访客模式</h1><p className="text-gray-400 text-sm">数据仅保存在本地</p></>}
            </div>
        </div>
        <div className="absolute top-8 right-6">
            {currentUser ? <button onClick={logout} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"><LogOut size={20} /></button> : <button onClick={login} className="px-4 py-2 bg-brand-600 hover:bg-brand-500 rounded-full text-sm font-bold flex items-center gap-2 transition-colors"><LogIn size={16} /> 登录同步</button>}
        </div>
      </div>
      <div className="px-4 -mt-10 space-y-4 pb-24 relative z-20">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2"><ShieldCheck size={18} className="text-brand-600" /><h2 className="font-bold text-gray-800">隐私与安全</h2></div>
             <div className="p-0"><button onClick={handlePinSetting} className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"><div className="flex items-center gap-3"><div className={`w-10 h-10 rounded-full flex items-center justify-center ${hasPin ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}><Lock size={20} /></div><div className="text-left"><span className="block text-sm font-bold text-gray-800">应用锁</span><span className="block text-xs text-gray-500">{hasPin ? '已开启 (点击管理)' : '未开启 (点击设置)'}</span></div></div><ChevronRight size={16} className="text-gray-300" /></button></div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2"><Database size={18} className="text-blue-600" /><h2 className="font-bold text-gray-800">数据管理</h2></div>
             <div className="p-4 grid grid-cols-2 gap-4">
                <button onClick={handleExport} className="flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 rounded-xl p-4 transition-colors"><Download size={24} className="text-gray-600 mb-2" /><span className="text-sm font-bold text-gray-800">备份数据</span></button>
                <button onClick={handleImportClick} className="flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 rounded-xl p-4 transition-colors"><Upload size={24} className="text-gray-600 mb-2" /><span className="text-sm font-bold text-gray-800">恢复数据</span></button>
                <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileChange} />
             </div>
             <div className="px-4 py-2 bg-gray-50 text-[10px] text-gray-400 text-center">已用空间: {storageUsed}</div>
        </div>
        {!currentUser && <div className="p-4 bg-yellow-50 text-yellow-800 text-xs rounded-xl border border-yellow-100 text-center">提示：当前为访客模式，数据仅保存在本机。<br/>建议登录以启用多设备同步。</div>}
      </div>
    </div>
  );
};

export default Share;
