
import { GoogleGenAI, type GenerateContentResponse } from "@google/genai";
import OpenAI from "openai";
import { Message, Role, Source, SearchMode, GeneratedMedia, Extension, Attachment } from "../types";

// Helper to get Gemini API Key
const getGeminiApiKey = (): string => {
    return localStorage.getItem('gemini_api_key') || process.env.API_KEY || '';
};

// Helper to get OpenAI API Key
const getOpenAIApiKey = (): string => {
    return localStorage.getItem('openai_api_key') || process.env.OPENAI_API_KEY || '';
};

// Helper to get Gemini Client
const getGeminiAI = () => {
    const key = getGeminiApiKey();
    if (!key) {
        throw new Error("Gemini API Key is missing. Please go to Settings > General.");
    }
    return new GoogleGenAI({ apiKey: key });
};

// Helper to get OpenAI Client
const getOpenAI = () => {
    const key = getOpenAIApiKey();
    if (!key) {
        throw new Error("OpenAI API Key is missing. Please go to Settings > General.");
    }
    return new OpenAI({
        apiKey: key,
        dangerouslyAllowBrowser: true // Required for client-side usage
    });
};

// Backward compatibility helper
const getApiKey = getGeminiApiKey;
const getAI = getGeminiAI;


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

export const generateImage = async (prompt: string, modelName?: string, attachments?: Attachment[]): Promise<GeneratedMedia> => {
    try {
        const selectedModel = modelName || 'gemini-2.5-flash-image';
        console.log(`Generating image with model: ${selectedModel}`);

        // OpenAI Handling
        if (selectedModel.toLowerCase().includes('chatgpt') || selectedModel.toLowerCase().includes('dall-e') || (getOpenAIApiKey() && selectedModel.startsWith('gpt'))) {
            let imageModel = selectedModel;
            if (imageModel.startsWith('gpt-')) {
                imageModel = 'chatgpt-image-latest'; // Or dall-e-3
            }
            // Map simplified names to OpenAI API model names if needed
            if (imageModel === 'chatgpt-image-latest') imageModel = 'dall-e-3';

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
                    // For mobile app, we might need to download the URL to base64 if we want persistence or offline
                    // But returning URL is fine for now
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

        const ai = getAI();

        // Use generateContent for Gemini models (supporting multimodal output)
        if (selectedModel.toLowerCase().includes('gemini')) {
            const parts: any[] = [{ text: prompt }];

            if (attachments && attachments.length > 0) {
                attachments.forEach(att => {
                    parts.push({ inlineData: { mimeType: att.mimeType, data: att.base64 } });
                });
            }

            const response = await ai.models.generateContent({
                model: selectedModel,
                contents: [
                    {
                        role: 'user',
                        parts: parts
                    }
                ],
                config: {
                    responseModalities: ['IMAGE', 'TEXT'],
                } as any
            });

            const candidate = response.candidates?.[0];
            // Find the part containing the image
            const imagePart = candidate?.content?.parts?.find((p: any) => p.inlineData);

            if (imagePart && imagePart.inlineData) {
                return {
                    type: 'image',
                    uri: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`,
                    mimeType: imagePart.inlineData.mimeType || 'image/jpeg'
                };
            }

            throw new Error("No image data found in the response.");
        }

        // Fallback for Imagen models
        const response = await ai.models.generateImages({
            model: selectedModel,
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


export const generateVideo = async (prompt: string, modelName?: string): Promise<GeneratedMedia> => {
    if (modelName && (modelName.startsWith('gpt') || modelName.includes('sora'))) {
        return generateOpenAIVideo(prompt, 'sora-2-2025-10-06');
    }
    return generateGeminiVideo(prompt);
};

const generateOpenAIVideo = async (prompt: string, model: string): Promise<GeneratedMedia> => {
    try {
        const key = getOpenAIApiKey();

        // 1. Create Video Job
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

        // If it returns URL immediately
        if (data.url || (data.data && data.data[0]?.url)) {
            return {
                type: 'video',
                uri: data.url || data.data[0].url,
                mimeType: 'video/mp4'
            };
        }

        const jobId = data.id;
        if (!jobId) throw new Error("No job ID returned from OpenAI Video API");

        // 2. Poll for Completion
        console.log(`OpenAI Video Job ${jobId} started. Polling...`);
        let status = data.status || 'pending';
        let attempts = 0;
        const maxAttempts = 60; // 5 minutes with 5s interval

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

        // 3. Fetch Final Content
        console.log(`Fetching final video content for ${jobId}...`);
        const contentResponse = await fetch(`https://api.openai.com/v1/videos/${jobId}/content`, {
            headers: { 'Authorization': `Bearer ${key}` }
        });

        if (!contentResponse.ok) {
            // Fallback to extraction logic
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
            operation = await ai.operations.getVideosOperation({ operation: operation });
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
    return history.slice(-10).map(msg => {
        const parts: any[] = [{ text: msg.content || (msg.generatedMedia ? "[Media Generated]" : "") }];

        // Handle legacy single attachment
        if (msg.attachment) {
            parts.push({ inlineData: { mimeType: msg.attachment.mimeType, data: msg.attachment.base64 } });
        }

        // Handle new multiple attachments
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


const getCommonSystemInstruction = (mode: SearchMode, activeExtensions: Extension[], customInstructions?: string) => {
    let instruction = mode === 'direct'
        ? "Answer with the shortest possible answer. Cut to the chase directly in a few words or sentences. Do not use just one word unless absolutely necessary. Be direct and concise. You MUST use the Google Search tool to provide verified information if needed."
        : "You are Saturn, an advanced AI browser assistant. When answering factual questions, you MUST use the Google Search tool to provide verified information and citations. Always verify your answers with search results.";

    // FILE GENERATION INSTRUCTION
    instruction += `
    
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
    if (mode !== 'direct') {
        const extInstructions = getExtensionInstructions(activeExtensions);
        if (extInstructions) {
            instruction += `\n\n` +
                `*** ACTIVE PERSONA/EXTENSION OVERRIDES ***\n` +
                `The user has installed the following personas/extensions. You MUST adopt their behaviors. ` +
                `These instructions take PRECEDENCE over your default persona.\n\n` +
                `${extInstructions}\n` +
                `*** END PERSONAS ***`;
        }

        if (customInstructions) {
            instruction += `\n\n` +
                `*** USER CUSTOM INSTRUCTIONS ***\n` +
                `The user has provided the following global instructions. You MUST follow them:\n` +
                `${customInstructions}\n` +
                `*** END CUSTOM INSTRUCTIONS ***`;
        }
    }
    return instruction;
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
        const systemMsg = getCommonSystemInstruction(mode, activeExtensions, customInstructions);

        const messages: any[] = [
            { role: 'system', content: systemMsg },
            ...history.map(msg => {
                // Handle multimodal content for OpenAI
                if (msg.attachments && msg.attachments.length > 0) {
                    const contentParts: any[] = [{ type: 'text', text: msg.content }];
                    msg.attachments.forEach(att => {
                        // Check mime type support (OpenAI supports images)
                        if (att.mimeType.startsWith('image/')) {
                            contentParts.push({
                                type: 'image_url',
                                image_url: { url: `data:${att.mimeType};base64,${att.base64}` }
                            });
                        }
                    });
                    return { role: msg.role === Role.USER ? 'user' : 'assistant', content: contentParts };
                }

                // Legacy single attachment
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

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
                onChunk(content, []);
            }
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
        const ai = getAI();
        const currentMessage = history[history.length - 1];
        let aggregatedSources: Source[] = [];

        // PARALLEL "DEEP" MODE
        if (mode === 'pro') {
            const parallelModel = modelName || "gemini-2.5-flash";
            onChunk("_Initializing Deep Search (5x Parallel Compute)..._\n\n", []);

            const previousMessages = history.slice(0, -1);
            const apiHistory = convertHistoryToApi(previousMessages);

            const userPrompt = currentMessage.content;
            let messagePayload: any[] = [{ text: userPrompt }];

            if (currentMessage.attachment) {
                messagePayload.push({ inlineData: { mimeType: currentMessage.attachment.mimeType, data: currentMessage.attachment.base64 } });
            }
            if (currentMessage.attachments && currentMessage.attachments.length > 0) {
                currentMessage.attachments.forEach(att => {
                    messagePayload.push({ inlineData: { mimeType: att.mimeType, data: att.base64 } });
                });
            }

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
            let model = modelName || "gemini-2.5-flash";

            if (mode === 'fast' || mode === 'direct') {
                model = "gemini-flash-lite-latest";
            }

            const previousMessages = history.slice(0, -1);
            const apiHistory = convertHistoryToApi(previousMessages);

            const systemInstruction = getCommonSystemInstruction(mode, activeExtensions, customInstructions);

            // Configure Tools
            const tools: any[] = [];
            // Use Google Search in normal, pro, and standard modes (including 'direct' now)
            tools.push({ googleSearch: {} });

            if (mode !== 'direct') {
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

            let messagePayload: any[] = [{ text: currentMessage.content }];

            if (currentMessage.attachment) {
                messagePayload.push({ inlineData: { mimeType: currentMessage.attachment.mimeType, data: currentMessage.attachment.base64 } });
            }

            if (currentMessage.attachments && currentMessage.attachments.length > 0) {
                currentMessage.attachments.forEach(att => {
                    messagePayload.push({ inlineData: { mimeType: att.mimeType, data: att.base64 } });
                });
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

    } catch (e) {
        console.error("Gemini Native Error", e);
        onError(e instanceof Error ? e : new Error(String(e)));
    }
};

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
    const isOpenAI = modelName.startsWith('gpt') || modelName.includes('o1') || modelName.includes('o3');

    if (isOpenAI) {
        return streamOpenAIResponse(history, mode, activeExtensions, modelName, customInstructions, onChunk, onFinish, onError);
    } else {
        return streamGeminiNativeResponse(history, mode, activeExtensions, modelName, customInstructions, onChunk, onFinish, onError);
    }
};

