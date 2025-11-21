import { GoogleGenAI, Type } from "@google/genai";
import { ParsedExpense } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const parseExpenseWithGemini = async (
  text: string,
  memberNames: string[]
): Promise<ParsedExpense | null> => {
  if (!process.env.API_KEY) {
    console.warn("No API Key found");
    return null;
  }

  try {
    const prompt = `
      Phân tích chi tiêu từ văn bản tiếng Việt sau: "${text}".
      Danh sách thành viên hiện có: ${memberNames.join(", ")}.
      Nếu tên người trả không có trong danh sách, hãy chọn người có tên gần giống nhất hoặc để trống nếu không xác định được.
      Amount phải là số nguyên (VND).
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING, description: "Mô tả khoản chi (ví dụ: Ăn tối, Cafe)" },
            amount: { type: Type.NUMBER, description: "Số tiền VNĐ" },
            payerName: { type: Type.STRING, description: "Tên người trả tiền" },
          },
          required: ["description", "amount", "payerName"],
        },
      },
    });

    const jsonText = response.text;
    if (!jsonText) return null;
    
    return JSON.parse(jsonText) as ParsedExpense;
  } catch (error) {
    console.error("Gemini Parse Error:", error);
    return null;
  }
};
