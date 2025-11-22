
import { GoogleGenAI, type GenerateContentResponse } from "@google/genai";
import { Message, Role, Source, SearchMode, GeneratedMedia, Extension } from "../types";

// Helper to get API Key from storage or env
const getApiKey = (): string => {
  return localStorage.getItem('gemini_api_key') || process.env.API_KEY || '';
};

// Helper to get AI client instance
const getAI = () => {
  const key = getApiKey();
  if (!key) {
    throw new Error("API Key is missing. Please go to Settings > General to configure your Gemini API Key.");
  }
  return new GoogleGenAI({ apiKey: key });
};

export const createNewTab = (): string => {
  return `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Helper to extract sources from grounding metadata
const extractSources = (candidate: any): Source[] => {
  const sources: Source[] = [];
  if (!candidate) return sources;

  // Handle both camelCase (SDK) and snake_case (Raw API) variations
  const metadata = candidate.groundingMetadata || candidate.grounding_metadata;
  
  if (!metadata) return sources;

  const chunks = metadata.groundingChunks || metadata.grounding_chunks;

  if (chunks && Array.isArray(chunks)) {
    chunks.forEach((chunk: any) => {
      if (!chunk) return;
      const web = chunk.web;
      if (web && web.uri) {
        sources.push({
          title: web.title || "Web Source",
          uri: web.uri,
        });
      }
    });
  }
  return sources;
};

export const generateImage = async (prompt: string): Promise<GeneratedMedia> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '16:9'
            }
        });
        
        const base64ImageBytes = response.generatedImages[0].image.imageBytes;
        return {
            type: 'image',
            uri: `data:image/jpeg;base64,${base64ImageBytes}`,
            mimeType: 'image/jpeg'
        };
    } catch (e) {
        console.error("Image generation failed", e);
        throw e;
    }
};

export const generateVideo = async (prompt: string): Promise<GeneratedMedia> => {
    try {
        const ai = getAI();
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            config: {
                numberOfVideos: 1,
                resolution: '720p', // Fast model supports 720p
                aspectRatio: '16:9'
            }
        });

        // Polling loop
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5s
            operation = await ai.operations.getVideosOperation({operation: operation});
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) throw new Error("Video generation failed to return URI");

        // Fetch the actual video bytes using the key manually
        const key = getApiKey();
        const videoResponse = await fetch(`${downloadLink}&key=${key}`);
        const blob = await videoResponse.blob();
        
        // Convert blob to object URL for playback
        const videoUrl = URL.createObjectURL(blob);

        return {
            type: 'video',
            uri: videoUrl,
            mimeType: 'video/mp4'
        };
    } catch (e) {
        console.error("Video generation failed", e);
        throw e;
    }
};

const getExtensionInstructions = (extensions: Extension[]): string => {
    if (!extensions || extensions.length === 0) return "";
    // Format clearly so the model recognizes these as distinct behavioral modifiers
    return extensions.map((ext, i) => 
        `[EXTENSION ${i + 1}: ${ext.name}]\nBEHAVIOR/INSTRUCTION: ${ext.instruction}\n` +
        (ext.widgets ? `WIDGETS_AVAILABLE: You can use special tokens to render widgets. Tokens: ${ext.widgets.map(w => `$$$UI:${w.type}:::${w.content}$$$`).join(', ')}` : "")
    ).join("\n\n");
};

const convertHistoryToApi = (history: Message[]) => {
    return history.slice(-10).map(msg => ({
      role: msg.role === Role.USER ? 'user' : 'model',
      parts: msg.attachment 
        ? [
            { text: msg.content }, 
            { inlineData: { mimeType: msg.attachment.mimeType, data: msg.attachment.base64 } }
          ]
        : [{ text: msg.content || (msg.generatedMedia ? "[Media Generated]" : "") }]
    }));
};

export const streamGeminiResponse = async (
  history: Message[],
  mode: SearchMode,
  activeExtensions: Extension[],
  onChunk: (text: string, sources?: Source[]) => void,
  onFinish: () => void,
  onError: (error: Error) => void
) => {
  try {
    const ai = getAI();
    const currentMessage = history[history.length - 1];
    
    let aggregatedSources: Source[] = [];

    // PARALLEL "DEEP" MODE
    if (mode === 'pro') {
        const parallelModel = "gemini-2.5-flash";
        onChunk("_Initializing Deep Search (5x Parallel Compute)..._\n\n", []);
        
        const previousMessages = history.slice(0, -1);
        const apiHistory = convertHistoryToApi(previousMessages);
        
        const userPrompt = currentMessage.content;
        const attachmentPart = currentMessage.attachment 
            ? { inlineData: { mimeType: currentMessage.attachment.mimeType, data: currentMessage.attachment.base64 } }
            : null;

        const messagePayload = attachmentPart ? [{ text: userPrompt }, attachmentPart] : userPrompt;

        // 1. Launch 5 parallel requests with slight temperature variations
        const promises = Array(5).fill(0).map(async (_, index) => {
             const chat = ai.chats.create({
                model: parallelModel,
                history: apiHistory,
                config: {
                    temperature: 0.7 + (index * 0.15), // Vary temperature to get diverse perspectives
                    tools: [{ googleSearch: {} }, { codeExecution: {} }]
                }
             });
             
             try {
                 const result = await chat.sendMessage({ message: messagePayload });
                 // Extract text and sources
                 const text = result.text || "";
                 const sources = extractSources(result.candidates?.[0]);
                 return { text, sources, index, success: true };
             } catch (e) {
                 console.warn(`Parallel request ${index} failed`, e);
                 return { text: "", sources: [], index, success: false };
             }
        });

        // 2. Wait for all responses
        const results = await Promise.all(promises);
        const successfulResults = results.filter(r => r.success && r.text);
        
        if (successfulResults.length === 0) {
            throw new Error("Deep search failed to get responses from parallel nodes.");
        }

        // 3. Aggregate Sources
        successfulResults.forEach(r => {
            if (r.sources) aggregatedSources.push(...r.sources);
        });
        
        // Deduplicate sources based on URI
        aggregatedSources = Array.from(new Map(aggregatedSources.map(item => [item.uri, item])).values());

        // 4. Synthesize
        onChunk("_Synthesizing responses..._\n\n", []);
        
        const synthesisPrompt = `
            I have executed a 'Deep Search' by running 5 parallel AI queries for the user prompt: "${userPrompt}".
            
            Here are the raw responses from the parallel nodes:
            ${successfulResults.map(r => `[NODE ${r.index + 1}]: ${r.text}`).join('\n\n')}
            
            TASK: 
            Synthesize these responses into a single, masterfully comprehensive, and highly accurate answer.
            - Merge conflicting details by prioritizing the majority consensus or the most detailed explanation.
            - Remove any redundant preambles.
            - Ensure the final tone is cohesive and professional.
            - Do NOT mention "Node 1" or "Node 2". Just present the final truth.
        `;

        const synthesisChat = ai.chats.create({
            model: parallelModel,
            config: {
                systemInstruction: "You are a Master Synthesizer AI. Your goal is to create the perfect answer from multiple inputs."
            }
        });

        const synthesisStream = await synthesisChat.sendMessageStream({ message: synthesisPrompt });

        for await (const chunk of synthesisStream) {
             const responseChunk = chunk as GenerateContentResponse;
             const text = responseChunk.text || "";
             // We stream the synthesis text, attaching the aggregated sources found in the first step
             onChunk(text, aggregatedSources);
        }

    } else {
        // STANDARD MODES
        let model = "gemini-2.5-flash"; 

        if (mode === 'fast' || mode === 'nobs') {
            model = "gemini-flash-lite-latest";
        } 
        
        const previousMessages = history.slice(0, -1);
        const apiHistory = convertHistoryToApi(previousMessages);

        let systemInstruction = mode === 'nobs' 
            ? "Answer with exactly ONE word. No period. No explanation. Just one word." 
            : "You are Saturn, an advanced AI browser assistant. When answering factual questions, you MUST use the Google Search tool to provide verified information and citations. Always verify your answers with search results.";
        
        // FILE GENERATION INSTRUCTION
        systemInstruction += `
        
        IMPORTANT: You have access to a python interpreter. However, the file system is NOT persistent and the user CANNOT access files you save to the sandbox directory directly.
        IF the user asks you to generate a file (like a PDF, CSV, Image, Text, etc.) using Python:
        1. Write the Python code to generate the file.
        2. At the end of your Python script, read the generated file in binary mode.
        3. Print the output to stdout in this EXACT format:
           $$$FILE:::filename.ext:::mime/type$$$base64_encoded_content$$$END_FILE$$$
           
           Example for a PDF:
           with open('output.pdf', 'rb') as f:
               import base64
               print(f"$$$FILE:::output.pdf:::application/pdf$$$\{base64.b64encode(f.read()).decode()\}$$$END_FILE$$$")
        
        4. Do NOT say "I have saved the file to /mnt/data...". Instead, say "I have generated the file for you to download." and the system will handle the rest.
        
        UI WIDGETS:
        You can inject interactive UI elements into the chat using special tokens:
        - $$$UI:BUTTON:::Label$$$ (A clickable button)
        - $$$UI:INPUT:::Placeholder$$$ (A text input field)
        - $$$UI:INFO:::Message$$$ (A distinct info card)
        `;

        // Append extension instructions
        if (mode !== 'nobs') {
            const extInstructions = getExtensionInstructions(activeExtensions);
            if (extInstructions) {
                systemInstruction += `\n\n` +
                    `*** ACTIVE EXTENSION OVERRIDES ***\n` +
                    `The user has installed the following extensions. You MUST adopt their behaviors. ` +
                    `These instructions take PRECEDENCE over your default persona.\n\n` +
                    `${extInstructions}\n` +
                    `*** END EXTENSIONS ***`;
            }
        }

        // Configure Tools
        const tools: any[] = [];
        // Use Google Search in normal, pro, and standard modes (unless it's 'nobs')
        if (mode !== 'nobs') {
            tools.push({ googleSearch: {} });
            tools.push({ codeExecution: {} }); 
        }

        const chat = ai.chats.create({
            model: model,
            history: apiHistory,
            config: {
                tools: tools,
                systemInstruction: systemInstruction,
            },
        });

        let messagePayload;
        if (currentMessage.attachment) {
            messagePayload = [
                { text: currentMessage.content },
                { inlineData: { mimeType: currentMessage.attachment.mimeType, data: currentMessage.attachment.base64 } }
            ];
        } else {
            messagePayload = currentMessage.content;
        }

        const resultStream = await chat.sendMessageStream({
            message: messagePayload
        });

        for await (const chunk of resultStream) {
            const responseChunk = chunk as GenerateContentResponse;
            const text = responseChunk.text || "";
            
            // Robustly extract sources from potentially streaming chunks
            if (responseChunk.candidates && responseChunk.candidates[0]) {
                const newSources = extractSources(responseChunk.candidates[0]);
                if (newSources.length > 0) {
                    aggregatedSources = [...aggregatedSources, ...newSources];
                    // Deduplicate
                    aggregatedSources = Array.from(new Map(aggregatedSources.map(item => [item.uri, item])).values());
                }
            }

            // Always pass sources if we have them, even if text is empty
            onChunk(text, aggregatedSources);
        }
    }

    onFinish();
  } catch (error) {
    console.error("Gemini API Error:", error);
    onError(error instanceof Error ? error : new Error(String(error)));
  }
};
