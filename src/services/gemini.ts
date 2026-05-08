import { GoogleGenAI, Type } from "@google/genai";

// Initialize the Gemini API client
const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY as string 
});

export const REMIX_STYLES = {
  TRUCK_ART: {
    id: "truck-art",
    name: "Heritage Truck Art",
    description: "Celebrates the vibrant floral, neon, and hand-painted aesthetics of Pakistani local transport.",
    prompt: "Remix this image into the style of Pakistani Truck Art. Use vibrant neon colors (pinks, yellows, teals), heavy black outlines, intricate floral patterns, and geometric borders. Incorporate iconic motifs like lions, birds, and bright hand-painted decals. The result should be maximalist and high-energy.",
  },
  MUGHAL: {
    id: "mughal",
    name: "Mughal Heritage",
    description: "Transforms scenes into symmetrical marble and gold masterpieces inspired by Mughal architecture and Persian motifs.",
    prompt: "Remix this image into the style of Mughal Architecture and Art. Incorporate white marble textures, symmetrical geometric 'jali' patterns, grand domes, and arches. Use a regal palette of gold, deep blues, and ivory. Transform the scene into a majestic heritage site.",
  },
  MULTANI_BLUE: {
    id: "multani-blue",
    name: "Multani Blue",
    description: "Traditional blue pottery aesthetics featuring cobalt patterns and elegant clay-fired glazed textures.",
    prompt: "Remix this image into the style of Multani Blue Pottery. Use a crisp white background with intricate cobalt blue and turquoise floral patterns. Apply a glazed, ceramic texture to the entire composition, mimicking the famous pottery of Multan.",
  },
  PHULKARI: {
    id: "phulkari",
    name: "Phulkari",
    description: "Dense geometric floral embroidery with bright oranges, reds, and purples in Punjabi folk style.",
    prompt: "Remix this image into the style of Phulkari embroidery. Fill the composition with dense, geometric floral patterns using thick stitch-like textures. Use a vibrant palette of mustard yellow, bright orange, deep red, and purple. It should look like a rich Punjabi textile masterpiece.",
  }
} as const;

export type StyleId = keyof typeof REMIX_STYLES;

export interface ArtifactStory {
  identificationAndStatus: string;
  originsAndEvolution: string;
  patternAndSymbolism: string;
  technicalSignature: string;
  didYouKnow: string;
}

/**
 * Helper to handle retries for 429/Quota errors
 */
async function callGenerativeAI<T>(fn: () => Promise<T>, retries = 1): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isQuotaError = error?.status === 429 || 
                        error?.message?.toLowerCase().includes("quota") || 
                        error?.message?.includes("429") ||
                        error?.message?.toLowerCase().includes("limit reached");
    
    if (isQuotaError && retries > 0) {
      console.log(`Quota encountered. Retrying in 2s... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return callGenerativeAI(fn, retries - 1);
    }
    
    if (isQuotaError) {
      throw new Error("QUOTA_EXCEEDED: You have reached the usage limit for the AI. Please try again in a few minutes or check your Gemini API key limits.");
    }
    throw error;
  }
}

export async function tellArtifactStory(base64Data: string, mimeType: string): Promise<ArtifactStory> {
  return callGenerativeAI(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        },
        {
          text: `You are the "VirsaAI Cultural Historian & Technical Analyst." Your goal is to provide a factual, chronological, and data-driven analysis of Pakistani artifacts. Avoid fictional or first-person storytelling. Focus on historical accuracy, geographical origins, and technical craftsmanship.

          Analyze the attached image and provide a cultural narrative in JSON format with the following keys:
          - identificationAndStatus: Identify the craft and its local nomenclature. Mention specific cities/regions. 
          - originsAndEvolution: Historical root (century/civilization) and evolution of techniques.
          - patternAndSymbolism: Analysis of motifs, geometry, or colors and their traditional meaning.
          - technicalSignature: Technical detail distinguishing authentic from fake.
          - didYouKnow: Surprising historical fact.

          HIGHLIGHTING INSTRUCTIONS:
          For EVERY section above, you MUST wrap one key phrase or the most important sentence in **asterisks like this** to highlight it. Choose the most impactful part of your text to emphasize. 

          IMPORTANT: Return ONLY the JSON object.`,
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            identificationAndStatus: {
              type: Type.STRING,
              description: "Flat string identifying the craft and its local regions."
            },
            originsAndEvolution: {
              type: Type.STRING,
              description: "Flat string explaining historical roots."
            },
            patternAndSymbolism: {
              type: Type.STRING,
              description: "Flat string analyzing motifs and meaning."
            },
            technicalSignature: {
              type: Type.STRING,
              description: "Flat string describing authenticity markers."
            },
            didYouKnow: {
              type: Type.STRING,
              description: "Flat string sharing a fun fact."
            }
          },
          required: ["identificationAndStatus", "originsAndEvolution", "patternAndSymbolism", "technicalSignature", "didYouKnow"]
        }
      }
    });

    const text = response.text || "";
    return JSON.parse(text) as ArtifactStory;
  });
}

export async function remixImage(base64Data: string, mimeType: string, styleId: StyleId): Promise<string> {
  const style = REMIX_STYLES[styleId];

  return callGenerativeAI(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        },
        {
          text: `STYLIZED_TRANSFORMATION: Apply the ${style.name} aesthetic to this photo. 
          
          IMAGE_REMIX_REQUIREMENTS:
          1. Apply heavy ${style.name} textures and color palettes.
          2. TRANSFORM the background into a scene matching the style.
          3. Modify clothing and surroundings to match the theme.
          4. CRITICAL IDENTITY PRESERVATION: Keep the person in the photo 100% recognizable. 
             - Maintain exact facial geometry, eye shape, nose structure, and mouth position.
             - Do NOT liquify or morph facial features.
             - Render the face with original structural integrity, while subtly applying style-appropriate color grading and fine textures.
          
          STYLE_PROMPT: ${style.prompt}
          
          OUTPUT_ONLY: Return only the resulting image data. No text.`,
        }
      ],
    });

    // Extract image from response
    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("No image was returned. The AI might be busy or the content was blocked. Please try another photo.");
  });
}
