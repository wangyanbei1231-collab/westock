import { AppData, InventoryItem, Bundle } from '../types';
import { doc, getDoc, setDoc, collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { User } from 'firebase/auth';
import { getIDBItem, setIDBItem } from './idb';

const STORAGE_KEY = 'we_stock_data_v1';
const PIN_KEY = 'we_stock_pin';

let currentUser: User | null = null;

export const setCloudUser = async (user: User | null) => {
    currentUser = user;
    if (user) await syncFromCloud();
};

const getInitialData = (): AppData => ({ items: [], bundles: [] });

// --- 核心存储逻辑 (IndexedDB + 云同步) ---

export const loadData = async (): Promise<AppData> => {
  try {
    const dbData = await getIDBItem<AppData>(STORAGE_KEY);
    if (dbData) return dbData;

    const localStr = localStorage.getItem(STORAGE_KEY);
    if (localStr) {
        const localData = JSON.parse(localStr);
        await setIDBItem(STORAGE_KEY, localData); 
        localStorage.removeItem(STORAGE_KEY); 
        return localData;
    }
    return getInitialData();
  } catch (e) { return getInitialData(); }
};

export const saveData = async (data: AppData): Promise<boolean> => {
  try {
    await setIDBItem(STORAGE_KEY, data);
    if (currentUser) syncToCloud().catch(console.error);
    return true;
  } catch (e: any) {
    alert("存储失败: " + e.message);
    return false;
  }
};

// --- 云同步 ---
export const syncFromCloud = async () => {
    if (!currentUser) return;
    try {
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const cloudData = docSnap.data() as AppData;
            console.log("云端 -> 本地");
            await setIDBItem(STORAGE_KEY, cloudData);
            window.location.reload(); 
        } else {
            const localData = await loadData();
            if (localData.items.length > 0) {
                console.log("本地 -> 云端 (初始化)");
                await syncToCloud();
            }
        }
    } catch (e) { console.error(e); }
};

const syncToCloud = async () => {
    if (!currentUser) return;
    const data = await loadData();
    try {
        await setDoc(doc(db, "users", currentUser.uid), data);
        console.log("已同步至云端");
    } catch (e) { console.error(e); }
};

export const forceSync = async (direction: 'up' | 'down') => {
    if (!currentUser) throw new Error("未登录");
    if (direction === 'up') {
        await syncToCloud();
    } else {
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            await setIDBItem(STORAGE_KEY, docSnap.data());
            window.location.reload();
        } else {
            throw new Error("云端无数据");
        }
    }
};

// --- CRUD Operations (Async) ---
export const addItem = async (item: InventoryItem) => { const d = await loadData(); d.items.unshift(item); return saveData(d); };
export const updateItem = async (item: InventoryItem) => { const d = await loadData(); const i = d.items.findIndex(x => x.id === item.id); if(i!==-1) d.items[i]=item; return saveData(d); };
export const getItem = async (id: string) => (await loadData()).items.find(i => i.id === id);
export const deleteItem = async (id: string) => { const d = await loadData(); d.items = d.items.filter(i => i.id !== id); d.bundles = d.bundles.map(b => ({...b, itemIds: b.itemIds.filter(x => x !== id)})); return saveData(d); };
export const addBundle = async (bundle: Bundle) => { const d = await loadData(); d.bundles.unshift(bundle); return saveData(d); };
export const updateBundle = async (bundle: Bundle) => { const d = await loadData(); const i = d.bundles.findIndex(b => b.id === bundle.id); if(i!==-1) d.bundles[i]=bundle; return saveData(d); };
export const getBundle = async (id: string) => (await loadData()).bundles.find(b => b.id === id);
export const deleteBundle = async (id: string) => { const d = await loadData(); d.bundles = d.bundles.filter(b => b.id !== id); return saveData(d); };

// --- Security ---
export const setAppPin = (p: string) => localStorage.setItem(PIN_KEY, p);
export const checkAppPin = (p: string) => localStorage.getItem(PIN_KEY) === p;
export const hasAppPin = () => !!localStorage.getItem(PIN_KEY);
export const removeAppPin = () => localStorage.removeItem(PIN_KEY);
export const getStorageUsage = () => "容量无限 (IndexedDB)";

export const exportData = async () => { const d = await loadData(); const b = new Blob([JSON.stringify(d,null,2)],{type:'application/json'}); const a = document.createElement('a'); a.href=URL.createObjectURL(b); a.download=`westock_backup.json`; a.click(); };
export const importData = async (s: string) => { try { const d = JSON.parse(s); if (!Array.isArray(d.items)) throw new Error("Fmt"); await saveData(d); return true; } catch { return false; } };

// --- Share Token (Parallel Upload) ---
export const exportBundleToken = async (bundleId: string): Promise<string> => {
    const data = await loadData();
    const bundle = data.bundles.find(b => b.id === bundleId);
    if (!bundle) return '';
    const relatedItems = data.items.filter(i => bundle.itemIds.includes(i.id));
    try {
        const shareRef = await addDoc(collection(db, "shared_bundles"), {
            type: 'westock_share_v2', bundle, itemCount: relatedItems.length, createdAt: new Date().toISOString()
        });
        const uploadPromises = relatedItems.map(async (item) => {
            const itemRef = doc(collection(db, "shared_bundles", shareRef.id, "items"));
            // 大文件保护：如果单品 > 1MB，剔除图片
            const size = new TextEncoder().encode(JSON.stringify(item)).length;
            if (size > 900000) {
                const { imageUrl, ...rest } = item;
                return setDoc(itemRef, { ...rest, note: (rest.note||'')+' [图片过大]' });
            }
            return setDoc(itemRef, item);
        });
        await Promise.all(uploadPromises);
        return `WS-${shareRef.id}`;
    } catch (e) { console.error(e); return ''; }
};

export const importBundleToken = async (token: string): Promise<boolean> => {
    if (!token.startsWith('WS-')) return false;
    const docId = token.replace('WS-', '');
    try {
        const docSnap = await getDoc(doc(db, "shared_bundles", docId));
        if (!docSnap.exists()) return false;
        const meta = docSnap.data();
        
        let itemsToImport: InventoryItem[] = [];
        const itemsSnap = await getDocs(collection(db, "shared_bundles", docId, "items"));
        itemsSnap.forEach(d => itemsToImport.push(d.data() as InventoryItem));

        const data = await loadData();
        itemsToImport.forEach(newItem => { if (!data.items.some(e => e.id === newItem.id)) data.items.unshift(newItem); });
        if (meta.bundle && !data.bundles.some(b => b.id === meta.bundle.id)) data.bundles.unshift(meta.bundle);
        
        await saveData(data);
        return true;
    } catch (e) { console.error(e); return false; }
};