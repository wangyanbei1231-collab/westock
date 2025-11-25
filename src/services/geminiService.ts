import { GoogleGenAI, Type } from "@google/genai";
import type { AnalyzeImageResponse } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * 核心优化：
 * 1. 强制裁剪为正方形 (Center Crop)
 * 2. 压缩分辨率至 600x600 (足够手机查看，极小体积)
 * 3. 质量压缩至 0.6
 * 目标：图片体积 < 50KB
 */
export const compressImage = (file: File, targetSize = 600, quality = 0.6): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        // 1. Calculate Crop (Square)
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;

        const canvas = document.createElement('canvas');
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            reject(new Error("Canvas context missing"));
            return;
        }

        // 2. Draw cropped and resized image
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, targetSize, targetSize);
        
        // 3. Compress
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export const analyzeItemImage = async (base64Image: string, mimeType: string): Promise<AnalyzeImageResponse> => {
  if (!process.env.API_KEY || process.env.API_KEY.length < 10) {
    return { name: "未命名商品", category: "待分类" };
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: mimeType } },
          { 
            // 🌟 核心升级：增加联网搜索指令
            text: `You are an inventory manager for 'YSQUARE Bijoux'. 
            Your task is to identify this exact product from the official website.
            
            Steps:
            1. Use Google Search to find this product image on 'site:ysquarebijoux.com'.
            2. If you find a match, use the EXACT product name from the website (e.g., "18K Gold Plated Chunky Hoop Earrings").
            3. If no exact match is found on the website, generate a descriptive name following the brand style (Material + Shape + Type).
            4. Determine the category (Necklace, Earrings, Ring, Bracelet, Accessory).

            Return the result in JSON format.` 
          },
        ],
      },
      config: {
        // 🌟 启用 Google 搜索工具
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "The exact product name from the website" },
            category: { type: Type.STRING },
          },
          required: ["name", "category"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    // 清理可能存在的 markdown 标记 (```json ... ```) 尽管 responseMimeType 应该处理这个问题
    const cleanText = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanText) as AnalyzeImageResponse;
    
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return { name: "识别失败", category: "手动输入" };
  }
};