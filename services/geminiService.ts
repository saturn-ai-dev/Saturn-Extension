import { GoogleGenAI, type GenerateContentResponse } from "@google/genai";
import OpenAI from "openai";
import { Message, Role, Source, SearchMode, GeneratedMedia, Extension } from "../types";
import {
    getEmbeddedOpenAIKey,
    getFallbackGeminiKey,
    getModelForMode,
    recordUsage,
    isModeExhausted,
    isAllCreditsExhausted,
    getExhaustionMessage,
    isImageGenAvailable,
    isVideoGenAvailable,
    getRemainingUsage
} from "./usageService";

// --- HELPERS ---

// Helper to get Gemini API Key (fallback only)
const getGeminiApiKey = (): string => {
    return getFallbackGeminiKey();
};

// Helper to get OpenAI API Key (embedded)
const getOpenAIApiKey = (): string => {
    return getEmbeddedOpenAIKey();
};

// Helper to get Gemini Client (fallback mode)
const getGeminiAI = () => {
    const key = getGeminiApiKey();
    return new GoogleGenAI({ apiKey: key });
};

// Helper to get OpenAI Client
const getOpenAI = () => {
    const key = getOpenAIApiKey();
    return new OpenAI({
        apiKey: key,
        dangerouslyAllowBrowser: true
    });
};

export const createNewTab = (): string => {
    return `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Helper to extract sources from Gemini metadata
const extractGeminiSources = (candidate: any): Source[] => {
    const sources: Source[] = [];
    if (!candidate) return sources;
    const metadata = candidate.groundingMetadata || candidate.grounding_metadata;
    if (!metadata) return sources;
    const chunks = metadata.groundingChunks || metadata.grounding_chunks;
    if (chunks && Array.isArray(chunks)) {
        chunks.forEach((chunk: any) => {
            if (!chunk) return;
            const web = chunk.web;
            if (web && web.uri) {
                sources.push({ title: web.title || "Web Source", uri: web.uri });
            }
        });
    }
    return sources;
};

// --- CORE GENERATION FUNCTIONS ---

export const generateImage = async (prompt: string, modelName?: string): Promise<GeneratedMedia> => {
    // Check if image gen is available (disabled in fallback mode)
    if (!isImageGenAvailable()) {
        throw new Error("🚫 Image generation is not available in fallback mode. All credits have been exhausted.");
    }

    const selectedModel = modelName || 'gemini-2.5-flash-image';
    console.log(`Generating image with model: ${selectedModel}`);

    // OpenAI Handling
    if (selectedModel.toLowerCase().includes('chatgpt') || selectedModel.toLowerCase().includes('dall-e') || selectedModel.startsWith('gpt')) {
        let imageModel = selectedModel;
        if (imageModel.startsWith('gpt-')) {
            imageModel = 'chatgpt-image-latest';
        }

        try {
            const openai = getOpenAI();
            const response = await openai.images.generate({
                model: imageModel as any,
                prompt: prompt,
                n: 1,
                size: "1024x1024"
            });

            const data = response.data[0];
            if (data && data.b64_json) {
                return {
                    type: 'image',
                    uri: `data:image/png;base64,${data.b64_json}`,
                    mimeType: 'image/png'
                };
            } else if (data && data.url) {
                return {
                    type: 'image',
                    uri: data.url,
                    mimeType: 'image/png'
                };
            }
            throw new Error("No image data returned from OpenAI");
        } catch (e) {
            console.error("OpenAI Image Gen Failed", e);
            throw e;
        }
    }

    // Gemini Handling
    try {
        const ai = getGeminiAI();
        if (selectedModel.toLowerCase().includes('gemini')) {
            const response = await ai.models.generateContent({
                model: selectedModel,
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                config: { responseModalities: ['IMAGE', 'TEXT'] } as any
            });
            const candidate = response.candidates?.[0];
            const imagePart = candidate?.content?.parts?.find((p: any) => p.inlineData);
            if (imagePart && imagePart.inlineData) {
                return {
                    type: 'image',
                    uri: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`,
                    mimeType: imagePart.inlineData.mimeType || 'image/jpeg'
                };
            }
            throw new Error("No image data found in response.");
        }

        // Fallback (Imagen or older)
        const response = await ai.models.generateImages({
            model: selectedModel,
            prompt: prompt,
            config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: '16:9' }
        });
        const base64ImageBytes = response.generatedImages[0].image.imageBytes;
        return { type: 'image', uri: `data:image/jpeg;base64,${base64ImageBytes}`, mimeType: 'image/jpeg' };

    } catch (e) {
        console.error("Gemini Image Gen Failed", e);
        throw e;
    }
};

export const generateVideo = async (prompt: string): Promise<GeneratedMedia> => {
    if (!isVideoGenAvailable()) {
        throw new Error("🚫 Video generation is not available in fallback mode. All credits have been exhausted.");
    }
    return generateGeminiVideo(prompt);
};

export const generateVideoWithModel = async (prompt: string, modelName?: string): Promise<GeneratedMedia> => {
    if (!isVideoGenAvailable()) {
        throw new Error("🚫 Video generation is not available in fallback mode. All credits have been exhausted.");
    }
    if (modelName && (modelName.startsWith('gpt') || modelName.includes('sora'))) {
        return generateOpenAIVideo(prompt, 'sora-2-2025-10-06');
    }
    return generateGeminiVideo(prompt);
};

const generateOpenAIVideo = async (prompt: string, model: string): Promise<GeneratedMedia> => {
    try {
        const key = getOpenAIApiKey();

        const response = await fetch('https://api.openai.com/v1/videos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`
            },
            body: JSON.stringify({
                model: model,
                prompt: prompt
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`OpenAI Video Start Error: ${err}`);
        }

        let data = await response.json();

        if (data.url || (data.data && data.data[0]?.url)) {
            return {
                type: 'video',
                uri: data.url || data.data[0].url,
                mimeType: 'video/mp4'
            };
        }

        const jobId = data.id;
        if (!jobId) throw new Error("No job ID returned from OpenAI Video API");

        console.log(`OpenAI Video Job ${jobId} started. Polling...`);
        let status = data.status || 'pending';
        let attempts = 0;
        const maxAttempts = 60;

        while (status !== 'succeeded' && status !== 'completed' && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            attempts++;

            const pollResponse = await fetch(`https://api.openai.com/v1/videos/${jobId}`, {
                headers: { 'Authorization': `Bearer ${key}` }
            });

            if (pollResponse.ok) {
                data = await pollResponse.json();
                status = data.status;
                console.log(`Job ${jobId} status: ${status}`);

                if (status === 'failed') {
                    throw new Error(`Video generation failed: ${data.error?.message || 'Unknown error'}`);
                }
            }
        }

        if (status !== 'succeeded' && status !== 'completed') {
            throw new Error("Video generation timed out.");
        }

        console.log(`Fetching final video content for ${jobId}...`);
        const contentResponse = await fetch(`https://api.openai.com/v1/videos/${jobId}/content`, {
            headers: { 'Authorization': `Bearer ${key}` }
        });

        if (!contentResponse.ok) {
            const finalUrl = data.url ||
                (data.data && data.data[0]?.url) ||
                (data.video && data.video.url) ||
                (data.output && data.output[0]);

            if (finalUrl) {
                return { type: 'video', uri: finalUrl, mimeType: 'video/mp4' };
            }
            throw new Error(`Failed to fetch video content: ${contentResponse.statusText}`);
        }

        const blob = await contentResponse.blob();
        const videoUrl = URL.createObjectURL(blob);

        return {
            type: 'video',
            uri: videoUrl,
            mimeType: 'video/mp4'
        };

    } catch (e) {
        console.error("Sora generation failed", e);
        throw e;
    }
}

const generateGeminiVideo = async (prompt: string): Promise<GeneratedMedia> => {
    try {
        const ai = getGeminiAI();
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
        });

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) throw new Error("Video generation failed to return URI");

        const key = getGeminiApiKey();
        const videoResponse = await fetch(`${downloadLink}&key=${key}`);
        const blob = await videoResponse.blob();
        return { type: 'video', uri: URL.createObjectURL(blob), mimeType: 'video/mp4' };
    } catch (e) {
        console.error("Video generation failed", e);
        throw e;
    }
};

export const generateOptimizedSystemInstructions = async (answers: string[]): Promise<string> => {
    try {
        const ai = getGeminiAI();
        const prompt = `
            You are an expert prompt engineer. User preferences: 
            Tone: ${answers[0]}; Detail: ${answers[1]}; Format: ${answers[2]}; Role: ${answers[3]}
            Write a concise system instruction in second person.
        `;
        const response = await ai.models.generateContent({
            model: 'gemini-flash-lite-latest',
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
        });
        return response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } catch (e) {
        return `Tone: ${answers[0]}\nDepth: ${answers[1]}\nFormat: ${answers[2]}\nContext: ${answers[3]}`;
    }
};

export const generateChatTitle = async (history: Message[]): Promise<string> => {
    try {
        const firstMessage = history[0];
        if (!firstMessage) return "New Chat";
        const ai = getGeminiAI();
        const prompt = `Your sole task is to generate a short, specific title (3-6 words) for this user message:
"${firstMessage.content.slice(0, 500)}"
Return ONLY the title text. Do not suggest options. Do not include conversational filler like "Here is a title". Do not use quotes or markdown.`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: { tools: [], responseModalities: ['TEXT'] }
        });
        const text = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (!text) return "New Chat";

        return text
            .replace(/^Here (is|are).+?:/i, '')
            .replace(/^Title:/i, '')
            .replace(/["*]/g, '')
            .split('\n')[0]
            .trim();
    } catch (e) {
        return "New Chat";
    }
}

const getExtensionInstructions = (extensions: Extension[]): string => {
    if (!extensions || extensions.length === 0) return "";
    return extensions.map((ext, i) =>
        `[EXTENSION ${i + 1}: ${ext.name}]\nBEHAVIOR/INSTRUCTION: ${ext.instruction}\n` +
        (ext.widgets ? `WIDGETS_AVAILABLE: You can use special tokens to render widgets. Tokens: ${ext.widgets.map(w => `$$$UI:${w.type}:::${w.content}$$$`).join(', ')}` : "")
    ).join("\n\n");
};

const convertHistoryToApi = (history: Message[]) => {
    return history.slice(-10).map(msg => {
        const parts: any[] = [{ text: msg.content || (msg.generatedMedia ? "[Media Generated]" : "") }];

        if (msg.attachment) {
            parts.push({ inlineData: { mimeType: msg.attachment.mimeType, data: msg.attachment.base64 } });
        }

        if (msg.attachments && msg.attachments.length > 0) {
            msg.attachments.forEach(att => {
                parts.push({ inlineData: { mimeType: att.mimeType, data: att.base64 } });
            });
        }

        return {
            role: msg.role === Role.USER ? 'user' : 'model',
            parts: parts
        };
    });
};

// --- STREAMING LOGIC ---

/** Reads custom modes from localStorage for the current user */
const getCustomModeConfig = (mode: string): { systemPrompt: string; model: string; provider: 'openai' | 'gemini' } | null => {
    try {
        const users = JSON.parse(localStorage.getItem('deepsearch_users') || '[]');
        const currentId = localStorage.getItem('deepsearch_current_user_id');
        const user = users.find((u: any) => u.id === currentId) || users[0];
        const customMode = user?.customModes?.find((m: any) => m.id === mode);
        if (customMode) {
            return {
                systemPrompt: customMode.systemPrompt,
                model: customMode.model,
                provider: customMode.provider || (customMode.model.startsWith('gemini') ? 'gemini' : 'openai')
            };
        }
    } catch {}
    return null;
};

// Main entry point that dispatches based on usage limits
export const streamGeminiResponse = async (
    history: Message[],
    mode: SearchMode,
    activeExtensions: Extension[],
    modelName: string,
    customInstructions: string | undefined,
    onChunk: (text: string, sources?: Source[]) => void,
    onFinish: () => void,
    onError: (error: Error) => void
) => {
    // Check for custom mode first
    const customModeCfg = getCustomModeConfig(mode);
    if (customModeCfg) {
        const merged = `${customModeCfg.systemPrompt}\n${customInstructions || ''}`.trim();
        if (customModeCfg.provider === 'gemini') {
            return streamGeminiNativeResponse(history, mode as SearchMode, activeExtensions, customModeCfg.model, merged, onChunk, onFinish, onError);
        } else {
            return streamOpenAIResponse(history, mode as SearchMode, activeExtensions, customModeCfg.model, merged, onChunk, onFinish, onError);
        }
    }

    // Check if mode is exhausted and show message
    const exhaustionMsg = getExhaustionMessage(mode);

    // Get the right model based on usage
    const { model, provider, isFallback } = getModelForMode(mode);

    // Record usage for non-fallback modes
    if (!isFallback) {
        recordUsage(mode);
    }

    // If exhausted, prepend a warning
    if (exhaustionMsg) {
        onChunk(exhaustionMsg + '\n\n', undefined);
    }

    if (provider === 'openai') {
        return streamOpenAIResponse(history, mode, activeExtensions, model, customInstructions, onChunk, onFinish, onError);
    } else {
        return streamGeminiNativeResponse(history, mode, activeExtensions, model, customInstructions, onChunk, onFinish, onError);
    }
};

const getCommonSystemInstruction = (mode: SearchMode, activeExtensions: Extension[], customInstructions?: string) => {
    let instruction = mode === 'direct'
        ? "Answer concisely. Verify facts."
        : "You are Saturn, an advanced AI assistant. Verify facts.";

    instruction += `
    PYTHON_TOOL: You can generate files using Python. Print output as:
    $$$FILE:::filename.ext:::mime/type$$$base64_encoded_content$$$END_FILE$$$
    
    UI_WIDGETS:
    - $$$UI:BUTTON:::Label$$$
    - $$$UI:INPUT:::Placeholder$$$
    `;

    const extInstruct = getExtensionInstructions(activeExtensions);
    if (extInstruct) instruction += `\n${extInstruct}`;
    if (customInstructions) instruction += `\nUSER_INSTRUCTIONS: ${customInstructions}`;

    return instruction;
};


// Helper to perform a search using native browser fetch (DuckDuckGo) to ground OpenAI
const getSearchContext = async (query: string): Promise<{ text: string, sources: Source[] }> => {
    try {
        const response = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const sources: Source[] = [];
        let text = "";

        const results = doc.querySelectorAll('.result');
        results.forEach((result, i) => {
            if (i > 5) return;
            const titleEl = result.querySelector('.result__a');
            const snippetEl = result.querySelector('.result__snippet');

            if (titleEl) {
                let url = titleEl.getAttribute('href');
                if (url) {
                    try {
                        const urlObj = new URL(url, 'https://duckduckgo.com');
                        const uddg = urlObj.searchParams.get('uddg');
                        if (uddg) url = decodeURIComponent(uddg);
                    } catch { }
                }

                const title = titleEl.textContent?.trim() || "Source";
                const snippet = snippetEl?.textContent?.trim() || "";

                if (url && url.startsWith('http')) {
                    sources.push({ title, uri: url });
                    text += `Source: ${title} (${url})\nSummary: ${snippet}\n\n`;
                }
            }
        });

        const uniqueSources = Array.from(new Map(sources.map(item => [item.uri, item])).values());
        return { text, sources: uniqueSources };
    } catch (e) {
        console.error("Search context failed", e);
        return { text: "", sources: [] };
    }
};

const streamOpenAIResponse = async (
    history: Message[],
    mode: SearchMode,
    activeExtensions: Extension[],
    modelName: string,
    customInstructions: string | undefined,
    onChunk: (text: string, sources?: Source[]) => void,
    onFinish: () => void,
    onError: (error: Error) => void
) => {
    try {
        const openai = getOpenAI();
        let systemMsg = getCommonSystemInstruction(mode, activeExtensions, customInstructions);
        let externalSources: Source[] = [];

        if (mode !== 'direct' && mode !== 'simple' && mode !== 'image' && mode !== 'video') {
            const lastUserMsg = history[history.length - 1];
            if (lastUserMsg && lastUserMsg.role === Role.USER) {
                try {
                    if (lastUserMsg.content && lastUserMsg.content.length > 2) {
                        const { text: context, sources } = await getSearchContext(lastUserMsg.content);
                        if (context) {
                            systemMsg += `\n\n[WEB SEARCH CONTEXT]\nThe following information was retrieved from a web search to help you answer the user's request. Use it to verify facts and provide up-to-date information.\n\n${context}\n\n[END CONTEXT]`;
                            externalSources = sources;
                        }
                    }
                } catch (e) {
                    console.log("Skipping search context due to error in fetch");
                }
            }
        }

        const messages: any[] = [
            { role: 'system', content: systemMsg },
            ...history.map(msg => {
                if (msg.attachments && msg.attachments.length > 0) {
                    const contentParts: any[] = [{ type: 'text', text: msg.content }];
                    msg.attachments.forEach(att => {
                        if (att.mimeType.startsWith('image/')) {
                            contentParts.push({
                                type: 'image_url',
                                image_url: { url: `data:${att.mimeType};base64,${att.base64}` }
                            });
                        }
                    });
                    return { role: msg.role === Role.USER ? 'user' : 'assistant', content: contentParts };
                }

                if (msg.attachment && msg.attachment.mimeType.startsWith('image/')) {
                    return {
                        role: msg.role === Role.USER ? 'user' : 'assistant',
                        content: [
                            { type: 'text', text: msg.content },
                            { type: 'image_url', image_url: { url: `data:${msg.attachment.mimeType};base64,${msg.attachment.base64}` } }
                        ]
                    };
                }

                return { role: msg.role === Role.USER ? 'user' : 'assistant', content: msg.content };
            })
        ];

        const stream = await openai.chat.completions.create({
            model: modelName,
            messages: messages,
            stream: true,
        });

        let sentSources = false;
        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
                if (!sentSources && externalSources.length > 0) {
                    onChunk(content, externalSources);
                    sentSources = true;
                } else {
                    onChunk(content, undefined);
                }
            }
        }
        if (!sentSources && externalSources.length > 0) {
            onChunk("", externalSources);
        }

        onFinish();

    } catch (e) {
        console.error("OpenAI Stream Error", e);
        onError(e instanceof Error ? e : new Error(String(e)));
    }
};

const streamGeminiNativeResponse = async (
    history: Message[],
    mode: SearchMode,
    activeExtensions: Extension[],
    modelName: string,
    customInstructions: string | undefined,
    onChunk: (text: string, sources?: Source[]) => void,
    onFinish: () => void,
    onError: (error: Error) => void
) => {
    try {
        const ai = getGeminiAI();
        const currentMessage = history[history.length - 1];
        let aggregatedSources: Source[] = [];

        const previousMessages = history.slice(0, -1);
        const apiHistory = convertHistoryToApi(previousMessages);

        let systemInstruction = getCommonSystemInstruction(mode, activeExtensions, customInstructions);

        const tools: any[] = [{ googleSearch: {} }];
        if (mode !== 'direct') tools.push({ codeExecution: {} });

        let model = modelName || "gemini-2.5-flash";

        const chat = ai.chats.create({
            model: model,
            history: apiHistory,
            config: { tools, systemInstruction }
        });

        let messagePayload: any[] = [{ text: currentMessage.content }];
        if (currentMessage.attachment) {
            messagePayload.push({ inlineData: { mimeType: currentMessage.attachment.mimeType, data: currentMessage.attachment.base64 } });
        }
        if (currentMessage.attachments) {
            currentMessage.attachments.forEach(att => {
                messagePayload.push({ inlineData: { mimeType: att.mimeType, data: att.base64 } });
            });
        }

        const resultStream = await chat.sendMessageStream({ message: messagePayload });

        for await (const chunk of resultStream) {
            const responseChunk = chunk as GenerateContentResponse;
            let text = "";
            const parts = responseChunk.candidates?.[0]?.content?.parts;
            if (parts) {
                parts.forEach(part => { if (part.text) text += part.text; });
            } else {
                text = responseChunk.text || "";
            }

            const newSources = extractGeminiSources(responseChunk.candidates?.[0]);
            if (newSources.length > 0) {
                aggregatedSources = [...aggregatedSources, ...newSources];
                aggregatedSources = Array.from(new Map(aggregatedSources.map(item => [item.uri, item])).values());
            }

            onChunk(text, aggregatedSources);
        }
        onFinish();

    } catch (e) {
        console.error("Gemini Native Error", e);
        onError(e instanceof Error ? e : new Error(String(e)));
    }
};
