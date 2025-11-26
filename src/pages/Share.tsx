import React, { useRef, useState } from 'react';
import { Download, Upload, Database, Lock, ShieldCheck, ChevronRight, LogIn, LogOut, Cloud, Mail, Key, RefreshCw } from 'lucide-react';
import { exportData, importData, getStorageUsage, setAppPin, hasAppPin, removeAppPin, forceSync } from '../services/storageService';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

interface ShareProps { refreshData?: () => void; }

const Share: React.FC<ShareProps> = ({ refreshData }) => {
  const { showToast } = useToast();
  const { currentUser, login, logout, loginEmail, signupEmail } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasPin, setHasPin] = useState(hasAppPin());
  const storageUsed = getStorageUsage();

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const isWeChat = /MicroMessenger/i.test(navigator.userAgent);

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

  const handleForceSync = async (direction: 'up' | 'down') => {
      if (!currentUser) { showToast('请先登录', 'error'); return; }
      if (!window.confirm(direction === 'up' ? '确定要将【本机数据】覆盖【云端数据】吗？' : '确定要拉取【云端数据】覆盖【本机数据】吗？')) return;
      
      setSyncing(true);
      try {
          await forceSync(direction);
          showToast('同步成功！', 'success');
      } catch (e: any) {
          showToast('同步失败: ' + e.message, 'error');
      } finally {
          setSyncing(false);
      }
  };

  const handleGoogleLogin = async () => {
      if (isWeChat) { showToast('微信暂不支持谷歌登录，请使用邮箱登录', 'info'); return; }
      try { await login(); setShowLoginModal(false); showToast('登录成功', 'success'); } catch (e) { showToast('登录失败，请检查网络', 'error'); }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
      e.preventDefault(); setLoading(true);
      try {
          if (isSignUp) { await signupEmail(email, password); showToast('注册成功并登录', 'success'); } 
          else { await loginEmail(email, password); showToast('登录成功', 'success'); }
          setShowLoginModal(false);
      } catch (err: any) {
          showToast(err.message.includes('auth/invalid-credential') ? '账号或密码错误' : '操作失败: ' + err.code, 'error');
      } finally { setLoading(false); }
  };

  // 截取 UID 后6位用于显示
  const shortUid = currentUser ? currentUser.uid.slice(-6).toUpperCase() : '';

  return (
    <div className="min-h-screen bg-gray-50 pb-safe-area">
      <div className="bg-gray-900 text-white p-6 pt-10 pb-16 rounded-b-[2.5rem] shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/20 bg-brand-500 flex items-center justify-center">
                {currentUser?.photoURL ? <img src={currentUser.photoURL} alt="Avatar" className="w-full h-full object-cover" /> : <span className="text-xl font-bold">{currentUser ? (currentUser.displayName?.[0] || currentUser.email?.[0] || 'U').toUpperCase() : '访'}</span>}
            </div>
            <div>
                {currentUser ? (
                    <>
                        <h1 className="text-xl font-bold">{currentUser.displayName || currentUser.email?.split('@')[0] || '用户'}</h1>
                        <p className="text-gray-400 text-xs flex items-center gap-1 mt-1 font-mono bg-white/10 px-2 py-0.5 rounded-full w-fit">
                            ID: {shortUid} <Cloud size={10} className="text-green-400 ml-1" />
                        </p>
                    </>
                ) : (
                    <><h1 className="text-xl font-bold">访客模式</h1><p className="text-gray-400 text-sm">数据仅保存在本地</p></>
                )}
            </div>
        </div>
        <div className="absolute top-8 right-6">
            {currentUser ? <button onClick={logout} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"><LogOut size={20} /></button> : <button onClick={() => setShowLoginModal(true)} className="px-4 py-2 bg-brand-600 hover:bg-brand-500 rounded-full text-sm font-bold flex items-center gap-2 transition-colors"><LogIn size={16} /> 登录同步</button>}
        </div>
      </div>

      <div className="px-4 -mt-10 space-y-4 pb-24 relative z-20">
        
        {currentUser && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2"><RefreshCw size={18} className={`text-brand-600 ${syncing ? 'animate-spin' : ''}`} /><h2 className="font-bold text-gray-800">云端同步控制</h2></div>
                <div className="p-4 flex gap-3">
                    <button onClick={() => handleForceSync('up')} className="flex-1 py-2 bg-gray-50 hover:bg-brand-50 text-brand-700 text-xs font-bold rounded-lg border border-transparent hover:border-brand-200 transition-all">↑ 强制上传 (本机→云端)</button>
                    <button onClick={() => handleForceSync('down')} className="flex-1 py-2 bg-gray-50 hover:bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-transparent hover:border-blue-200 transition-all">↓ 强制拉取 (云端→本机)</button>
                </div>
                <div className="px-4 pb-2 text-[10px] text-gray-400 text-center">若两端数据不一致，请核对上方 ID 是否相同</div>
            </div>
        )}

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

      {/* Login Modal */}
      {showLoginModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-[scaleIn_0.2s_ease-out]">
                  <div className="p-6 pb-0">
                      <h2 className="text-xl font-bold text-gray-800 mb-1">{isSignUp ? '注册账号' : '登录账号'}</h2>
                      <p className="text-sm text-gray-500 mb-6">同步数据，多端共享</p>
                      <form onSubmit={handleEmailAuth} className="space-y-4">
                          <div className="space-y-1"><label className="text-xs font-bold text-gray-500 ml-1">邮箱</label><div className="flex items-center bg-gray-50 rounded-xl px-3 border border-gray-200 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500 transition-all"><Mail size={18} className="text-gray-400" /><input type="email" required className="flex-1 bg-transparent py-3 px-2 outline-none text-sm" placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)} /></div></div>
                          <div className="space-y-1"><label className="text-xs font-bold text-gray-500 ml-1">密码</label><div className="flex items-center bg-gray-50 rounded-xl px-3 border border-gray-200 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500 transition-all"><Key size={18} className="text-gray-400" /><input type="password" required minLength={6} className="flex-1 bg-transparent py-3 px-2 outline-none text-sm" placeholder="至少6位" value={password} onChange={e => setPassword(e.target.value)} /></div></div>
                          <button type="submit" disabled={loading} className="w-full bg-brand-600 text-white font-bold py-3 rounded-xl hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center">{loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (isSignUp ? '注册并登录' : '登录')}</button>
                      </form>
                      <div className="mt-4 flex items-center justify-between text-xs"><button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-brand-600 font-bold hover:underline">{isSignUp ? '已有账号？去登录' : '没有账号？去注册'}</button><button type="button" onClick={() => setShowLoginModal(false)} className="text-gray-400 hover:text-gray-600">暂不登录</button></div>
                  </div>
                  <div className="relative my-6"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-400">或者</span></div></div>
                  <div className="p-6 pt-0 bg-gray-50/50"><button onClick={handleGoogleLogin} className={`w-full bg-white border border-gray-200 text-gray-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors ${isWeChat ? 'opacity-50 cursor-not-allowed' : ''}`}><svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>Google 登录 {isWeChat && '(微信不支持)'}</button></div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Share;