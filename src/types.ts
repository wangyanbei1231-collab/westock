
// 使用 const 对象代替 enum，以符合现代 TypeScript 标准
export const Size = {
  XS: 'XS',
  S: 'S',
  M: 'M',
  L: 'L',
  OTHER: 'Other'
} as const;

// 导出 Size 类型，这样其他文件可以用 Size 作为类型
export type Size = typeof Size[keyof typeof Size];

// 使用 Record 类型定义库存结构，比之前的 interface 写法更简洁兼容
export type StockLevels = Record<Size, number>;

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  imageUrl?: string;
  stock: StockLevels;
  location?: string; // 存放地点
  note?: string;     // 备注信息
  createdAt: number;
}

export interface Bundle {
  id: string;
  name: string;
  description: string;
  itemIds: string[]; // References to InventoryItem.id
  createdAt: number;
}

export interface AppData {
  items: InventoryItem[];
  bundles: Bundle[];
}

export interface AnalyzeImageResponse {
  name: string;
  category: string;
  suggestedStock?: number;
}