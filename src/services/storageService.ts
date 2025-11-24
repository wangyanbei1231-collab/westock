import type { AppData, InventoryItem, Bundle } from '../types';

const STORAGE_KEY = 'we_stock_data_v1';

const getInitialData = (): AppData => ({
  items: [],
  bundles: []
});

export const loadData = (): AppData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : getInitialData();
  } catch (e) {
    console.error("Failed to load data", e);
    return getInitialData();
  }
};

export const saveData = (data: AppData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const addItem = (item: InventoryItem) => {
  const data = loadData();
  data.items.push(item);
  saveData(data);
  return data;
};

export const addBundle = (bundle: Bundle) => {
  const data = loadData();
  data.bundles.push(bundle);
  saveData(data);
  return data;
};

export const deleteItem = (id: string) => {
    const data = loadData();
    data.items = data.items.filter(i => i.id !== id);
    // Also remove from bundles
    data.bundles = data.bundles.map(b => ({
        ...b,
        itemIds: b.itemIds.filter(itemId => itemId !== id)
    }));
    saveData(data);
    return data;
};

export const deleteBundle = (id: string) => {
    const data = loadData();
    data.bundles = data.bundles.filter(b => b.id !== id);
    saveData(data);
    return data;
}