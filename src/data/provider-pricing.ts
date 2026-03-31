// Provider pricing data - costs per 1M tokens (input / output)
// Updated: 2026-03-31
// Free tiers marked with isFree: true

export interface ModelPricing {
  identifier: string;
  name: string;
  provider: AIProvider;
  costPer1MInput: number;  // USD per 1M input tokens
  costPer1MOutput: number; // USD per 1M output tokens
  isFree: boolean;
  freeTierLimit?: string;  // Description of free tier limits
  features: string[];      // Speed, quality, context window highlights
}

export enum AIProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  TOGETHER = 'together',
  GEMINI = 'gemini',
  COHERE = 'cohere',
  MISTRAL = 'mistral',
  GROQ = 'groq',
  OPENROUTER = 'openrouter',
  OLLAMA = 'ollama',
}

export const PROVIDER_INFO: Record<AIProvider, {
  name: string;
  website: string;
  color: string;
  description: string;
}> = {
  [AIProvider.OPENAI]: {
    name: 'OpenAI',
    website: 'https://openai.com',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    description: 'Industry-leading models with broad capabilities',
  },
  [AIProvider.ANTHROPIC]: {
    name: 'Anthropic',
    website: 'https://anthropic.com',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    description: 'Safety-focused with strong reasoning',
  },
  [AIProvider.TOGETHER]: {
    name: 'Together AI',
    website: 'https://together.ai',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    description: 'Open source models, competitive pricing',
  },
  [AIProvider.GEMINI]: {
    name: 'Google Gemini',
    website: 'https://gemini.google.com',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    description: 'Google\'s multimodal AI with large context',
  },
  [AIProvider.COHERE]: {
    name: 'Cohere',
    website: 'https://cohere.com',
    color: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    description: 'Enterprise-focused with strong embeddings',
  },
  [AIProvider.MISTRAL]: {
    name: 'Mistral AI',
    website: 'https://mistral.ai',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    description: 'European AI with efficient open models',
  },
  [AIProvider.GROQ]: {
    name: 'Groq',
    website: 'https://groq.com',
    color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    description: 'Ultra-fast inference with free tier',
  },
  [AIProvider.OPENROUTER]: {
    name: 'OpenRouter',
    website: 'https://openrouter.ai',
    color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    description: 'Unified API for many models',
  },
  [AIProvider.OLLAMA]: {
    name: 'Ollama',
    website: 'https://ollama.ai',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    description: 'Local models - completely free',
  },
};

export const MODEL_PRICING: ModelPricing[] = [
  // OpenAI - Paid
  {
    identifier: 'gpt-4o',
    name: 'GPT-4o',
    provider: AIProvider.OPENAI,
    costPer1MInput: 2.50,
    costPer1MOutput: 10.00,
    isFree: false,
    features: ['128K context', 'Multimodal', 'Fast'],
  },
  {
    identifier: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: AIProvider.OPENAI,
    costPer1MInput: 0.15,
    costPer1MOutput: 0.60,
    isFree: false,
    features: ['128K context', 'Cost-effective', 'Fast'],
  },
  {
    identifier: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: AIProvider.OPENAI,
    costPer1MInput: 10.00,
    costPer1MOutput: 30.00,
    isFree: false,
    features: ['128K context', 'High quality', 'Legacy'],
  },
  {
    identifier: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: AIProvider.OPENAI,
    costPer1MInput: 0.50,
    costPer1MOutput: 1.50,
    isFree: false,
    features: ['16K context', 'Reliable', 'Legacy'],
  },
  // Anthropic - Paid
  {
    identifier: 'claude-3-5-sonnet-20240620',
    name: 'Claude 3.5 Sonnet',
    provider: AIProvider.ANTHROPIC,
    costPer1MInput: 3.00,
    costPer1MOutput: 15.00,
    isFree: false,
    features: ['200K context', 'Excellent reasoning', 'Code expert'],
  },
  {
    identifier: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    provider: AIProvider.ANTHROPIC,
    costPer1MInput: 0.80,
    costPer1MOutput: 4.00,
    isFree: false,
    features: ['200K context', 'Fast', 'Efficient'],
  },
  {
    identifier: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    provider: AIProvider.ANTHROPIC,
    costPer1MInput: 15.00,
    costPer1MOutput: 75.00,
    isFree: false,
    features: ['200K context', 'Highest quality', 'Complex tasks'],
  },
  {
    identifier: 'claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    provider: AIProvider.ANTHROPIC,
    costPer1MInput: 0.25,
    costPer1MOutput: 1.25,
    isFree: false,
    features: ['200K context', 'Fastest', 'Cost-effective'],
  },
  // Together AI - Mixed
  {
    identifier: 'meta-llama/Llama-3.1-8B-Instruct-Turbo',
    name: 'Llama 3.1 8B',
    provider: AIProvider.TOGETHER,
    costPer1MInput: 0.18,
    costPer1MOutput: 0.18,
    isFree: false,
    features: ['128K context', 'Open source', 'Efficient'],
  },
  {
    identifier: 'meta-llama/Llama-3.1-70B-Instruct-Turbo',
    name: 'Llama 3.1 70B',
    provider: AIProvider.TOGETHER,
    costPer1MInput: 0.88,
    costPer1MOutput: 0.88,
    isFree: false,
    features: ['128K context', 'Open source', 'Powerful'],
  },
  {
    identifier: 'meta-llama/Llama-3.1-405B-Instruct-Turbo',
    name: 'Llama 3.1 405B',
    provider: AIProvider.TOGETHER,
    costPer1MInput: 5.00,
    costPer1MOutput: 15.00,
    isFree: false,
    features: ['128K context', 'Largest open model', 'State-of-the-art'],
  },
  // Google Gemini - Mixed (free tier available)
  {
    identifier: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: AIProvider.GEMINI,
    costPer1MInput: 3.50,
    costPer1MOutput: 10.50,
    isFree: false,
    freeTierLimit: 'Free: 1500 requests/day',
    features: ['1M+ context', 'Multimodal', 'Long context'],
  },
  {
    identifier: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: AIProvider.GEMINI,
    costPer1MInput: 0.35,
    costPer1MOutput: 0.70,
    isFree: false,
    freeTierLimit: 'Free: 1500 requests/day',
    features: ['1M+ context', 'Fast', 'Cost-effective'],
  },
  {
    identifier: 'gemini-1.5-flash-8b',
    name: 'Gemini 1.5 Flash 8B',
    provider: AIProvider.GEMINI,
    costPer1MInput: 0.0375,
    costPer1MOutput: 0.15,
    isFree: false,
    freeTierLimit: 'Free: 1500 requests/day',
    features: ['1M+ context', 'Fastest', 'Smallest'],
  },
  // Cohere - Paid
  {
    identifier: 'command-r-plus',
    name: 'Command R+',
    provider: AIProvider.COHERE,
    costPer1MInput: 3.00,
    costPer1MOutput: 15.00,
    isFree: false,
    features: ['128K context', 'RAG optimized', 'Enterprise'],
  },
  {
    identifier: 'command-r',
    name: 'Command R',
    provider: AIProvider.COHERE,
    costPer1MInput: 0.15,
    costPer1MOutput: 0.60,
    isFree: false,
    features: ['128K context', 'RAG optimized', 'Balanced'],
  },
  // Mistral - Paid
  {
    identifier: 'mistral-large-latest',
    name: 'Mistral Large',
    provider: AIProvider.MISTRAL,
    costPer1MInput: 2.00,
    costPer1MOutput: 6.00,
    isFree: false,
    features: ['128K context', 'European', 'High quality'],
  },
  {
    identifier: 'mistral-medium',
    name: 'Mistral Medium',
    provider: AIProvider.MISTRAL,
    costPer1MInput: 2.70,
    costPer1MOutput: 8.10,
    isFree: false,
    features: ['32K context', 'Balanced', 'Legacy'],
  },
  {
    identifier: 'mistral-small',
    name: 'Mistral Small',
    provider: AIProvider.MISTRAL,
    costPer1MInput: 1.00,
    costPer1MOutput: 3.00,
    isFree: false,
    features: ['32K context', 'Fast', 'Cost-effective'],
  },
  // Groq - FREE TIER (Primary free provider)
  {
    identifier: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B (Groq)',
    provider: AIProvider.GROQ,
    costPer1MInput: 0,
    costPer1MOutput: 0,
    isFree: true,
    freeTierLimit: '20 requests/min, 1M tokens/min',
    features: ['128K context', 'Ultra-fast', 'Free tier'],
  },
  {
    identifier: 'llama-3.1-70b-versatile',
    name: 'Llama 3.1 70B (Groq)',
    provider: AIProvider.GROQ,
    costPer1MInput: 0,
    costPer1MOutput: 0,
    isFree: true,
    freeTierLimit: '20 requests/min, 1M tokens/min',
    features: ['128K context', 'Ultra-fast', 'Powerful'],
  },
  {
    identifier: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B (Groq)',
    provider: AIProvider.GROQ,
    costPer1MInput: 0,
    costPer1MOutput: 0,
    isFree: true,
    freeTierLimit: '20 requests/min, 1M tokens/min',
    features: ['128K context', 'Latest', 'Ultra-fast'],
  },
  {
    identifier: 'mixtral-8x7b-32768',
    name: 'Mixtral 8x7B (Groq)',
    provider: AIProvider.GROQ,
    costPer1MInput: 0,
    costPer1MOutput: 0,
    isFree: true,
    freeTierLimit: '20 requests/min, 1M tokens/min',
    features: ['32K context', 'MoE architecture', 'Free tier'],
  },
  {
    identifier: 'gemma2-9b-it',
    name: 'Gemma 2 9B (Groq)',
    provider: AIProvider.GROQ,
    costPer1MInput: 0,
    costPer1MOutput: 0,
    isFree: true,
    freeTierLimit: '20 requests/min, 1M tokens/min',
    features: ['8K context', 'Google', 'Efficient'],
  },
  // OpenRouter - Mixed (some free)
  {
    identifier: 'openrouter/meta-llama/llama-3.1-8b-instruct:free',
    name: 'Llama 3.1 8B (OR Free)',
    provider: AIProvider.OPENROUTER,
    costPer1MInput: 0,
    costPer1MOutput: 0,
    isFree: true,
    freeTierLimit: 'Limited daily requests',
    features: ['128K context', 'Free tier', 'Via OpenRouter'],
  },
  {
    identifier: 'openrouter/google/gemini-flash-1.5:free',
    name: 'Gemini Flash 1.5 (OR Free)',
    provider: AIProvider.OPENROUTER,
    costPer1MInput: 0,
    costPer1MOutput: 0,
    isFree: true,
    freeTierLimit: 'Limited daily requests',
    features: ['1M+ context', 'Free tier', 'Via OpenRouter'],
  },
  // Ollama - Completely Free (local)
  {
    identifier: 'ollama/llama3.1',
    name: 'Llama 3.1 (Ollama)',
    provider: AIProvider.OLLAMA,
    costPer1MInput: 0,
    costPer1MOutput: 0,
    isFree: true,
    freeTierLimit: 'Local - requires Ollama setup',
    features: ['128K context', 'Local', 'Private', 'Free'],
  },
  {
    identifier: 'ollama/mistral',
    name: 'Mistral (Ollama)',
    provider: AIProvider.OLLAMA,
    costPer1MInput: 0,
    costPer1MOutput: 0,
    isFree: true,
    freeTierLimit: 'Local - requires Ollama setup',
    features: ['32K context', 'Local', 'Private', 'Free'],
  },
  {
    identifier: 'ollama/codellama',
    name: 'CodeLlama (Ollama)',
    provider: AIProvider.OLLAMA,
    costPer1MInput: 0,
    costPer1MOutput: 0,
    isFree: true,
    freeTierLimit: 'Local - requires Ollama setup',
    features: ['Code specialized', 'Local', 'Private'],
  },
];

// Helper functions
export function getModelPricing(identifier: string): ModelPricing | undefined {
  return MODEL_PRICING.find(m => m.identifier === identifier);
}

export function getFreeModels(): ModelPricing[] {
  return MODEL_PRICING.filter(m => m.isFree);
}

export function getPaidModels(): ModelPricing[] {
  return MODEL_PRICING.filter(m => !m.isFree);
}

export function getModelsByProvider(provider: AIProvider): ModelPricing[] {
  return MODEL_PRICING.filter(m => m.provider === provider);
}

export function estimateCost(inputTokens: number, outputTokens: number, modelId: string): number {
  const model = getModelPricing(modelId);
  if (!model) return 0;
  
  const inputCost = (inputTokens / 1_000_000) * model.costPer1MInput;
  const outputCost = (outputTokens / 1_000_000) * model.costPer1MOutput;
  return inputCost + outputCost;
}

// Rough token estimation (1 token ≈ 0.75 words for English)
export function estimateTokenCount(text: string): number {
  // Simple estimation: average 4 characters per token
  return Math.ceil(text.length / 4);
}

export function formatCost(cost: number): string {
  if (cost === 0) return 'FREE';
  if (cost < 0.001) return `<$0.001`;
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(3)}`;
}

export function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(2)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`;
  return tokens.toString();
}

// Get API key documentation URL for a provider
export function getProviderDocsUrl(provider: AIProvider): string {
  const docsUrls: Record<AIProvider, string> = {
    [AIProvider.OPENAI]: 'https://platform.openai.com/api-keys',
    [AIProvider.ANTHROPIC]: 'https://console.anthropic.com/settings/keys',
    [AIProvider.TOGETHER]: 'https://api.together.xyz/settings/api-keys',
    [AIProvider.GEMINI]: 'https://aistudio.google.com/app/apikey',
    [AIProvider.COHERE]: 'https://dashboard.cohere.com/api-keys',
    [AIProvider.MISTRAL]: 'https://console.mistral.ai/api-keys/',
    [AIProvider.GROQ]: 'https://console.groq.com/keys',
    [AIProvider.OPENROUTER]: 'https://openrouter.ai/keys',
    [AIProvider.OLLAMA]: 'https://ollama.ai/download',
  };
  return docsUrls[provider] || '#';
}

// Get free tier information for a provider
export function getFreeTierInfo(provider: AIProvider): string {
  const info: Record<AIProvider, string> = {
    [AIProvider.OPENAI]: 'No free tier - pay per use',
    [AIProvider.ANTHROPIC]: 'No free tier - pay per use',
    [AIProvider.TOGETHER]: 'No free tier - pay per use',
    [AIProvider.GEMINI]: 'Free: 1500 requests/day',
    [AIProvider.COHERE]: 'Trial credits available',
    [AIProvider.MISTRAL]: 'Trial credits available',
    [AIProvider.GROQ]: 'Free: 20 req/min, 1M tokens/min',
    [AIProvider.OPENROUTER]: 'Limited free daily requests',
    [AIProvider.OLLAMA]: 'Completely free (local)',
  };
  return info[provider] || '';
}
