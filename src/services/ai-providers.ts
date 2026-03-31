import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { AIProvider } from '../data/provider-pricing';

export interface AIProviderResponse {
  content: string;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export async function callAIProvider(
  provider: AIProvider,
  identifier: string,
  prompt: string,
  apiKey: string
): Promise<AIProviderResponse> {
  try {
    switch (provider) {
      case AIProvider.OPENAI:
        return await callOpenAI(identifier, prompt, apiKey);
      case AIProvider.ANTHROPIC:
        return await callAnthropic(identifier, prompt, apiKey);
      case AIProvider.TOGETHER:
        return await callTogether(identifier, prompt, apiKey);
      case AIProvider.GEMINI:
        return await callGemini(identifier, prompt, apiKey);
      case AIProvider.COHERE:
        return await callCohere(identifier, prompt, apiKey);
      case AIProvider.MISTRAL:
        return await callMistral(identifier, prompt, apiKey);
      case AIProvider.GROQ:
        return await callGroq(identifier, prompt, apiKey);
      case AIProvider.OPENROUTER:
        return await callOpenRouter(identifier, prompt, apiKey);
      case AIProvider.OLLAMA:
        return await callOllama(identifier, prompt, apiKey);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  } catch (error) {
    console.error(`Error calling ${provider}:`, error);
    throw error;
  }
}

async function callOpenAI(model: string, prompt: string, apiKey: string): Promise<AIProviderResponse> {
  const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
  const response = await openai.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 4000
  });
  
  const content = response.choices[0]?.message?.content || 'No response generated';
  const usage = response.usage;
  
  return {
    content,
    tokenUsage: usage ? {
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
      totalTokens: usage.total_tokens,
    } : undefined,
  };
}

async function callAnthropic(model: string, prompt: string, apiKey: string): Promise<AIProviderResponse> {
  const anthropic = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  const response = await anthropic.messages.create({
    model,
    max_tokens: 4000,
    temperature: 0.7,
    messages: [{ role: 'user', content: prompt }]
  });
  
  const content = response.content[0];
  const text = content.type === 'text' ? content.text : 'No response generated';
  
  return {
    content: text,
    tokenUsage: response.usage ? {
      promptTokens: response.usage.input_tokens,
      completionTokens: response.usage.output_tokens,
      totalTokens: response.usage.input_tokens + response.usage.output_tokens,
    } : undefined,
  };
}

async function callTogether(model: string, prompt: string, apiKey: string): Promise<AIProviderResponse> {
  const response = await fetch('https://api.together.xyz/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model, messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 4000
    })
  });
  
  if (!response.ok) throw new Error(`Together API error: ${response.status} ${response.statusText}`);
  const data = await response.json();
  
  return {
    content: data.choices[0]?.message?.content || 'No response generated',
    tokenUsage: data.usage ? {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
    } : undefined,
  };
}

async function callGemini(model: string, prompt: string, apiKey: string): Promise<AIProviderResponse> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 4000 }
      })
    }
  );
  
  if (!response.ok) throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
  const data = await response.json();
  
  const text = data.candidates[0]?.content?.parts[0]?.text || 'No response generated';
  const usage = data.usageMetadata;
  
  return {
    content: text,
    tokenUsage: usage ? {
      promptTokens: usage.promptTokenCount,
      completionTokens: usage.candidatesTokenCount,
      totalTokens: usage.totalTokenCount || (usage.promptTokenCount + usage.candidatesTokenCount),
    } : undefined,
  };
}

async function callCohere(model: string, prompt: string, apiKey: string): Promise<AIProviderResponse> {
  // Cohere has two APIs: /generate (legacy) and /chat (newer)
  // Using /chat for better compatibility
  const response = await fetch('https://api.cohere.ai/v1/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ 
      model, 
      message: prompt, 
      temperature: 0.7,
      max_tokens: 4000,
    })
  });
  
  if (!response.ok) throw new Error(`Cohere API error: ${response.status} ${response.statusText}`);
  const data = await response.json();
  
  return {
    content: data.text || 'No response generated',
    tokenUsage: data.meta?.billed_units ? {
      promptTokens: data.meta.billed_units.input_tokens || 0,
      completionTokens: data.meta.billed_units.output_tokens || 0,
      totalTokens: (data.meta.billed_units.input_tokens || 0) + (data.meta.billed_units.output_tokens || 0),
    } : undefined,
  };
}

async function callMistral(model: string, prompt: string, apiKey: string): Promise<AIProviderResponse> {
  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model, messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 4000
    })
  });
  
  if (!response.ok) throw new Error(`Mistral API error: ${response.status} ${response.statusText}`);
  const data = await response.json();
  
  return {
    content: data.choices[0]?.message?.content || 'No response generated',
    tokenUsage: data.usage ? {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
    } : undefined,
  };
}

// ── NEW PROVIDERS ──────────────────────────────────────

// Groq - Ultra-fast inference with generous free tier
async function callGroq(model: string, prompt: string, apiKey: string): Promise<AIProviderResponse> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json', 
      'Authorization': `Bearer ${apiKey}` 
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 4000,
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${response.status} ${error}`);
  }
  
  const data = await response.json();
  
  return {
    content: data.choices[0]?.message?.content || 'No response generated',
    tokenUsage: data.usage ? {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
    } : undefined,
  };
}

// OpenRouter - Unified API for many models, some free
async function callOpenRouter(model: string, prompt: string, apiKey: string): Promise<AIProviderResponse> {
  // Remove 'openrouter/' prefix if present
  const actualModel = model.replace(/^openrouter\//, '');
  
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json', 
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': window.location.origin, // Required by OpenRouter
      'X-Title': 'Panel of Experts', // Optional but recommended
    },
    body: JSON.stringify({
      model: actualModel,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 4000,
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} ${error}`);
  }
  
  const data = await response.json();
  
  return {
    content: data.choices[0]?.message?.content || 'No response generated',
    tokenUsage: data.usage ? {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
    } : undefined,
  };
}

// Ollama - Local models
async function callOllama(model: string, prompt: string, apiKey: string): Promise<AIProviderResponse> {
  // Ollama runs locally, typically on port 11434
  // Remove 'ollama/' prefix if present
  const actualModel = model.replace(/^ollama\//, '');
  
  // Try default Ollama port
  const baseUrl = 'http://localhost:11434';
  
  try {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: actualModel,
        prompt,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 4000,
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status}. Make sure Ollama is running on ${baseUrl}`);
    }
    
    const data = await response.json();
    
    return {
      content: data.response || 'No response generated',
      // Ollama doesn't provide token counts in the same way
      tokenUsage: data.eval_count ? {
        promptTokens: data.prompt_eval_count || 0,
        completionTokens: data.eval_count || 0,
        totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
      } : undefined,
    };
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(
        `Cannot connect to Ollama at ${baseUrl}. ` +
        'Make sure Ollama is installed and running. ' +
        'Install from https://ollama.ai'
      );
    }
    throw error;
  }
}

// Helper to check if a provider requires an API key
export function requiresApiKey(provider: AIProvider): boolean {
  return provider !== AIProvider.OLLAMA; // Ollama is local, doesn't need API key
}

// Helper to get provider documentation URL
export function getProviderDocsUrl(provider: AIProvider): string {
  const docs: Record<AIProvider, string> = {
    [AIProvider.OPENAI]: 'https://platform.openai.com/api-keys',
    [AIProvider.ANTHROPIC]: 'https://console.anthropic.com/settings/keys',
    [AIProvider.TOGETHER]: 'https://api.together.ai/settings/api-keys',
    [AIProvider.GEMINI]: 'https://aistudio.google.com/app/apikey',
    [AIProvider.COHERE]: 'https://dashboard.cohere.com/api-keys',
    [AIProvider.MISTRAL]: 'https://console.mistral.ai/api-keys/',
    [AIProvider.GROQ]: 'https://console.groq.com/keys',
    [AIProvider.OPENROUTER]: 'https://openrouter.ai/keys',
    [AIProvider.OLLAMA]: 'https://ollama.ai/download',
  };
  return docs[provider];
}

// Helper to get free tier info
export function getFreeTierInfo(provider: AIProvider): string {
  const info: Record<AIProvider, string> = {
    [AIProvider.OPENAI]: 'Free trial credits available',
    [AIProvider.ANTHROPIC]: '$5 free credits for new accounts',
    [AIProvider.TOGETHER]: '$5 free credits for new accounts',
    [AIProvider.GEMINI]: '1500 requests/day free tier',
    [AIProvider.COHERE]: 'Trial credits available',
    [AIProvider.MISTRAL]: 'Free trial available',
    [AIProvider.GROQ]: '20 req/min, 1M tokens/min free',
    [AIProvider.OPENROUTER]: 'Some models available for free',
    [AIProvider.OLLAMA]: 'Completely free - runs locally',
  };
  return info[provider];
}
