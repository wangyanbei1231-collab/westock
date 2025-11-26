import { AppData, InventoryItem, Bundle } from '../types';
import { doc, getDoc, setDoc, collection, writeBatch, getDocs, addDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { User } from 'firebase/auth';

const STORAGE_KEY = 'we_stock_data_v1';
const PIN_KEY = 'we_stock_pin';

let currentUser: User | null = null;

export const setCloudUser = async (user: User | null) => {
    currentUser = user;
    if (user) await syncFromCloud();
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
            console.log("已从云端拉取数据");
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudData));
            window.location.reload(); 
        } else {
            // 智能合并：云端无数据但本地有数据，自动上传
            const localData = loadData();
            if (localData.items.length > 0 || localData.bundles.length > 0) {
                console.log("云端为空，上传本地数据初始化");
                await syncToCloud();
            }
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
        throw e;
    }
};

export const forceSync = async (direction: 'up' | 'down') => {
    if (!currentUser) throw new Error("未登录");
    if (direction === 'up') {
        await syncToCloud();
    } else {
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(docSnap.data()));
            window.location.reload();
        } else {
            throw new Error("云端没有数据 (请检查是否登录了同一账号)");
        }
    }
};

// --- 本地存储 ---
export const loadData = (): AppData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : getInitialData();
  } catch (e) { return getInitialData(); }
};

export const saveData = (data: AppData): boolean => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    if (currentUser) syncToCloud();
    return true;
  } catch (e: any) {
    if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
      alert("⚠️ 存储空间已满！建议清理图片或删除旧数据。");
    }
    return false;
  }
};

// --- CRUD Operations ---
export const addItem = (item: InventoryItem) => { const d = loadData(); d.items.unshift(item); return saveData(d); };
export const updateItem = (item: InventoryItem) => { const d = loadData(); const i = d.items.findIndex(x => x.id === item.id); if(i!==-1) d.items[i]=item; return saveData(d); };
export const getItem = (id: string) => loadData().items.find(i => i.id === id);
export const deleteItem = (id: string) => { const d = loadData(); d.items = d.items.filter(i => i.id !== id); d.bundles = d.bundles.map(b => ({...b, itemIds: b.itemIds.filter(x => x !== id)})); saveData(d); return d; };
export const addBundle = (bundle: Bundle) => { const d = loadData(); d.bundles.unshift(bundle); saveData(d); return d; };
export const updateBundle = (bundle: Bundle) => { const d = loadData(); const i = d.bundles.findIndex(b => b.id === bundle.id); if(i!==-1) d.bundles[i]=bundle; return saveData(d); };
export const getBundle = (id: string) => loadData().bundles.find(b => b.id === id);
export const deleteBundle = (id: string) => { const d = loadData(); d.bundles = d.bundles.filter(b => b.id !== id); saveData(d); return d; };

// --- Security ---
export const setAppPin = (p: string) => localStorage.setItem(PIN_KEY, p);
export const checkAppPin = (p: string) => localStorage.getItem(PIN_KEY) === p;
export const hasAppPin = () => !!localStorage.getItem(PIN_KEY);
export const removeAppPin = () => localStorage.removeItem(PIN_KEY);
export const getStorageUsage = () => { try { return ((localStorage.getItem(STORAGE_KEY)||'').length*2/1024/1024).toFixed(2) + ' MB'; } catch { return '未知'; }};
export const exportData = () => { const b = new Blob([JSON.stringify(loadData(),null,2)],{type:'application/json'}); const a = document.createElement('a'); a.href=URL.createObjectURL(b); a.download=`westock_backup.json`; a.click(); };
export const importData = (s: string) => { try { saveData(JSON.parse(s)); return true; } catch { return false; } };

// --- 🔥 核心升级：大文件分片分享 (Split & Batch) ---

export const exportBundleToken = async (bundleId: string): Promise<string> => {
    const data = loadData();
    const bundle = data.bundles.find(b => b.id === bundleId);
    if (!bundle) return '';

    const relatedItems = data.items.filter(i => bundle.itemIds.includes(i.id));
    
    try {
        // 1. 创建分享主文档 (自动生成 ID)
        const shareRef = await addDoc(collection(db, "shared_bundles"), {
            type: 'westock_share_v2', // 标记为 V2 版本
            bundle,
            itemCount: relatedItems.length,
            createdAt: new Date().toISOString()
        });

        // 2. 使用 Batch 将每个 Item 写入子集合
        // Firestore Batch 最多 500 个操作，如果商品超多需要分批，但一般组合够用了
        const batch = writeBatch(db);
        relatedItems.forEach(item => {
            // 在 shared_bundles/{shareId}/items 下创建文档
            const itemRef = doc(collection(db, "shared_bundles", shareRef.id, "items"));
            batch.set(itemRef, item);
        });

        // 3. 提交所有写入
        await batch.commit();
        return `WS-${shareRef.id}`; // 返回短口令
    } catch (e) {
        console.error("Share upload failed:", e);
        return '';
    }
};

export const importBundleToken = async (token: string): Promise<boolean> => {
    if (!token.startsWith('WS-')) return false;
    const docId = token.replace('WS-', '');
    
    try {
        // 1. 获取元数据
        const docRef = doc(db, "shared_bundles", docId);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) return false;
        const meta = docSnap.data();
        
        let itemsToImport: InventoryItem[] = [];

        if (meta.type === 'westock_share_v2') {
            // V2: Items 在子集合里
            const itemsSnapshot = await getDocs(collection(db, "shared_bundles", docId, "items"));
            itemsSnapshot.forEach(doc => {
                itemsToImport.push(doc.data() as InventoryItem);
            });
        } else {
             // 兼容旧版 (如果有)
             itemsToImport = meta.items || [];
        }

        // 2. 合并数据到本地
        const data = loadData();
        itemsToImport.forEach((newItem) => {
            if (!data.items.some(exist => exist.id === newItem.id)) {
                data.items.unshift(newItem);
            }
        });
        if (meta.bundle && !data.bundles.some(b => b.id === meta.bundle.id)) {
            data.bundles.unshift(meta.bundle);
        }
        
        saveData(data);
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};