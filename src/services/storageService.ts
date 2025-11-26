import { AppData, InventoryItem, Bundle } from '../types';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { User } from 'firebase/auth';

const STORAGE_KEY = 'we_stock_data_v1';
const PIN_KEY = 'we_stock_pin';

let currentUser: User | null = null;

// 设置当前用户并触发同步
export const setCloudUser = async (user: User | null) => {
    currentUser = user;
    if (user) {
        await syncFromCloud();
    }
};

const getInitialData = (): AppData => ({ items: [], bundles: [] });

// --- 云同步逻辑 ---
export const syncFromCloud = async () => {
    if (!currentUser) return;
    try {
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const cloudData = docSnap.data() as AppData;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudData));
            window.location.reload(); // 简单粗暴但有效：刷新页面加载新数据
        } else {
            await syncToCloud(); // 新用户，上传本地数据作为初始数据
        }
    } catch (e) {
        console.error("Sync Error:", e);
    }
};

const syncToCloud = async () => {
    if (!currentUser) return;
    const data = loadData();
    try {
        await setDoc(doc(db, "users", currentUser.uid), data);
        console.log("已同步至云端");
    } catch (e) {
        console.error("Upload Error:", e);
    }
};

// --- 本地存储 (自动触发上传) ---
export const loadData = (): AppData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : getInitialData();
  } catch (e) {
    return getInitialData();
  }
};

export const saveData = (data: AppData): boolean => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    if (currentUser) syncToCloud(); // 如果已登录，自动同步
    return true;
  } catch (e: any) {
    if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
      alert("⚠️ 存储空间已满！请删除部分数据。");
    }
    return false;
  }
};

// --- 数据操作 (增删改) ---

export const addItem = (item: InventoryItem) => {
  const data = loadData();
  data.items.unshift(item);
  return saveData(data);
};

export const updateItem = (updatedItem: InventoryItem) => {
  const data = loadData();
  const index = data.items.findIndex(i => i.id === updatedItem.id);
  if (index !== -1) {
    data.items[index] = updatedItem;
    return saveData(data);
  }
  return false;
};

export const getItem = (id: string) => {
    const data = loadData();
    return data.items.find(i => i.id === id);
}

export const deleteItem = (id: string) => {
    const data = loadData();
    data.items = data.items.filter(i => i.id !== id);
    data.bundles = data.bundles.map(b => ({
        ...b,
        itemIds: b.itemIds.filter(itemId => itemId !== id)
    }));
    saveData(data);
    return data;
};

export const addBundle = (bundle: Bundle) => {
  const data = loadData();
  data.bundles.unshift(bundle);
  saveData(data);
  return data;
};

export const updateBundle = (updatedBundle: Bundle) => {
  const data = loadData();
  const index = data.bundles.findIndex(b => b.id === updatedBundle.id);
  if (index !== -1) {
    data.bundles[index] = updatedBundle;
    return saveData(data);
  }
  return false;
};

export const getBundle = (id: string) => {
    const data = loadData();
    return data.bundles.find(b => b.id === id);
}

export const deleteBundle = (id: string) => {
    const data = loadData();
    data.bundles = data.bundles.filter(b => b.id !== id);
    saveData(data);
    return data;
}

// --- 安全 & 工具 ---

export const setAppPin = (pin: string) => localStorage.setItem(PIN_KEY, pin);
export const checkAppPin = (inputPin: string) => localStorage.getItem(PIN_KEY) === inputPin;
export const hasAppPin = () => !!localStorage.getItem(PIN_KEY);
export const removeAppPin = () => localStorage.removeItem(PIN_KEY);

export const getStorageUsage = (): string => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY) || '';
        const kb = (stored.length * 2) / 1024;
        return kb < 1024 ? `${kb.toFixed(1)} KB` : `${(kb / 1024).toFixed(2)} MB`;
    } catch { return '未知'; }
}

export const exportData = () => {
    const data = loadData();
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `westock_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export const importData = (jsonString: string): boolean => {
    try {
        const data = JSON.parse(jsonString);
        if (!Array.isArray(data.items) || !Array.isArray(data.bundles)) throw new Error("Format error");
        saveData(data);
        return true;
    } catch (e) { return false; }
};

export const exportBundleToken = (bundleId: string): string => {
    const data = loadData();
    const bundle = data.bundles.find(b => b.id === bundleId);
    if (!bundle) return '';
    const relatedItems = data.items.filter(i => bundle.itemIds.includes(i.id));
    const payload = { type: 'westock_transfer', bundle, items: relatedItems };
    return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
};

export const importBundleToken = (token: string): boolean => {
    try {
        const jsonStr = decodeURIComponent(escape(atob(token)));
        const payload = JSON.parse(jsonStr);
        if (payload.type !== 'westock_transfer' || !payload.bundle || !payload.items) return false;
        const data = loadData();
        
        // Merge items (avoid duplicates)
        payload.items.forEach((newItem: InventoryItem) => {
            if (!data.items.some(exist => exist.id === newItem.id)) data.items.unshift(newItem);
        });
        // Add bundle
        if (!data.bundles.some(b => b.id === payload.bundle.id)) data.bundles.unshift(payload.bundle);
        
        saveData(data);
        return true;
    } catch (e) { return false; }
};
