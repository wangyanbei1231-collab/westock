import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Share2, Link as LinkIcon, Check } from 'lucide-react';

const Share: React.FC = () => {
  const [copied, setCopied] = useState(false);
  // In a real app, this would be dynamic based on the current user/group ID
  const inviteLink = "https://westock.app/invite/8x9d82"; 

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 h-screen flex flex-col items-center bg-gray-50">
      <h1 className="text-2xl font-bold text-gray-900 mb-8 mt-4">邀请协作</h1>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center w-full max-w-sm">
        <div className="w-48 h-48 bg-white rounded-lg mb-6 flex items-center justify-center overflow-hidden border border-gray-100 p-2">
            <QRCodeSVG 
              value={inviteLink} 
              size={180}
              level="M"
              fgColor="#16a34a" // Brand-600
            />
        </div>
        
        <p className="text-center text-gray-600 mb-6 text-sm">
          扫码或复制链接分享给团队成员<br/>共同管理库存
        </p>

        <div className="w-full flex items-center gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4">
            <LinkIcon size={16} className="text-gray-400" />
            <input 
                type="text" 
                value={inviteLink} 
                readOnly 
                className="bg-transparent flex-1 text-sm text-gray-600 focus:outline-none"
            />
        </div>

        <button 
            onClick={handleCopy}
            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                copied ? 'bg-green-100 text-green-700' : 'bg-brand-600 text-white hover:bg-brand-700'
            }`}
        >
            {copied ? <><Check size={18} /> 已复制</> : <><Share2 size={18} /> 复制邀请链接</>}
        </button>
      </div>

      <div className="mt-8 w-full max-w-sm">
          <h3 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">当前成员</h3>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-50">
              <div className="p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-xs">我</div>
                  <div className="flex-1">
                      <p className="text-sm font-bold text-gray-800">管理员 (我)</p>
                      <p className="text-xs text-gray-400">所有权限</p>
                  </div>
              </div>
               <div className="p-4 flex items-center gap-3 opacity-60">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">U2</div>
                  <div className="flex-1">
                      <p className="text-sm font-bold text-gray-800">示例用户</p>
                      <p className="text-xs text-gray-400">待加入...</p>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Share;