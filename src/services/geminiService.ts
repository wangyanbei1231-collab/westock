
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
        // drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
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
          { text: "Analyze this product. Return JSON with 'name' (short, Chinese) and 'category'." },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            category: { type: Type.STRING },
          },
          required: ["name", "category"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as AnalyzeImageResponse;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return { name: "未命名商品", category: "杂项" };
  }
};
