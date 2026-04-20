import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function getProductRecommendations(userInterests: string[], recentPurchases: string[]) {
  const prompt = `Based on the user's interests: ${userInterests.join(", ")} and recent purchases: ${recentPurchases.join(", ")}, suggest 3-5 complementary products that would appeal to them on a social shopping app. Return the result in JSON format with title, description, and price.`;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Failed to get recommendations:", error);
    return [];
  }
}
