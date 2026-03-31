import { useState, useCallback, useRef } from 'react';
import { 
  TokenUsage, 
  StageTokenUsage, 
  PipelineTokenUsage, 
  ModelDetail,
  StageResult 
} from '../types';
import { 
  estimateTokenCount, 
  estimateCost, 
  getModelPricing,
  MODEL_PRICING 
} from '../data/provider-pricing';

export interface UseTokenTrackerReturn {
  // Current session tracking
  pipelineUsage: PipelineTokenUsage | null;
  currentStageUsage: StageTokenUsage | null;
  
  // Actions
  startPipeline: () => void;
  startStage: (stageId: string, stageName: string, inputText: string) => void;
  recordModelUsage: (modelId: string, input: string, output: string) => void;
  completeStage: () => void;
  completePipeline: () => void;
  reset: () => void;
  
  // Estimates
  estimateRequestCost: (inputText: string, models: ModelDetail[], estimatedOutputRatio?: number) => {
    totalCost: number;
    isFree: boolean;
    breakdown: Record<string, { cost: number; isFree: boolean }>;
  };
  
  // Totals
  totalTokensUsed: number;
  totalCost: number;
}

export function useTokenTracker(): UseTokenTrackerReturn {
  const [pipelineUsage, setPipelineUsage] = useState<PipelineTokenUsage | null>(null);
  const [currentStageUsage, setCurrentStageUsage] = useState<StageTokenUsage | null>(null);
  
  // Use ref for accumulating per-model usage within a stage
  const currentStageModelsRef = useRef<Record<string, TokenUsage>>({});
  const currentStageInputRef = useRef<TokenUsage | null>(null);

  const startPipeline = useCallback(() => {
    setPipelineUsage({
      stages: [],
      grandTotal: { promptTokens: 0, completionTokens: 0, totalTokens: 0, estimatedCost: 0 },
      startedAt: Date.now(),
    });
    setCurrentStageUsage(null);
    currentStageModelsRef.current = {};
  }, []);

  const startStage = useCallback((stageId: string, stageName: string, inputText: string) => {
    const inputTokens = estimateTokenCount(inputText);
    const inputUsage: TokenUsage = {
      promptTokens: inputTokens,
      completionTokens: 0,
      totalTokens: inputTokens,
      estimatedCost: 0, // Input cost calculated per-model
    };
    
    currentStageInputRef.current = inputUsage;
    currentStageModelsRef.current = {};
    
    setCurrentStageUsage({
      stageId,
      stageName,
      input: inputUsage,
      output: { promptTokens: 0, completionTokens: 0, totalTokens: 0, estimatedCost: 0 },
      total: inputUsage,
      perModel: {},
    });
  }, []);

  const recordModelUsage = useCallback((modelId: string, input: string, output: string) => {
    const modelPricing = getModelPricing(modelId);
    const inputTokens = estimateTokenCount(input);
    const outputTokens = estimateTokenCount(output);
    const totalTokens = inputTokens + outputTokens;
    
    const cost = modelPricing 
      ? estimateCost(inputTokens, outputTokens, modelId)
      : 0;
    
    const usage: TokenUsage = {
      promptTokens: inputTokens,
      completionTokens: outputTokens,
      totalTokens,
      estimatedCost: cost,
    };
    
    currentStageModelsRef.current[modelId] = usage;
    
    // Update current stage usage
    setCurrentStageUsage(prev => {
      if (!prev) return null;
      
      const allModelUsages = Object.values(currentStageModelsRef.current);
      const totalOutputTokens = allModelUsages.reduce((sum, u) => sum + u.completionTokens, 0);
      const totalOutputCost = allModelUsages.reduce((sum, u) => sum + u.estimatedCost, 0);
      
      return {
        ...prev,
        output: {
          promptTokens: 0,
          completionTokens: totalOutputTokens,
          totalTokens: totalOutputTokens,
          estimatedCost: totalOutputCost,
        },
        total: {
          promptTokens: prev.input.promptTokens,
          completionTokens: totalOutputTokens,
          totalTokens: prev.input.promptTokens + totalOutputTokens,
          estimatedCost: prev.input.estimatedCost + totalOutputCost,
        },
        perModel: { ...currentStageModelsRef.current },
      };
    });
  }, []);

  const completeStage = useCallback(() => {
    setPipelineUsage(prev => {
      if (!prev || !currentStageUsage) return prev;
      
      const newStages = [...prev.stages, currentStageUsage];
      const grandTotal = newStages.reduce(
        (acc, stage) => ({
          promptTokens: acc.promptTokens + stage.total.promptTokens,
          completionTokens: acc.completionTokens + stage.total.completionTokens,
          totalTokens: acc.totalTokens + stage.total.totalTokens,
          estimatedCost: acc.estimatedCost + stage.total.estimatedCost,
        }),
        { promptTokens: 0, completionTokens: 0, totalTokens: 0, estimatedCost: 0 }
      );
      
      return {
        ...prev,
        stages: newStages,
        grandTotal,
      };
    });
    
    setCurrentStageUsage(null);
    currentStageModelsRef.current = {};
    currentStageInputRef.current = null;
  }, [currentStageUsage]);

  const completePipeline = useCallback(() => {
    setPipelineUsage(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        completedAt: Date.now(),
      };
    });
  }, []);

  const reset = useCallback(() => {
    setPipelineUsage(null);
    setCurrentStageUsage(null);
    currentStageModelsRef.current = {};
    currentStageInputRef.current = null;
  }, []);

  const estimateRequestCost = useCallback((
    inputText: string, 
    models: ModelDetail[], 
    estimatedOutputRatio: number = 3 // Assume output is 3x input tokens
  ) => {
    const inputTokens = estimateTokenCount(inputText);
    const estimatedOutputTokens = Math.round(inputTokens * estimatedOutputRatio);
    
    let totalCost = 0;
    let isFree = true;
    const breakdown: Record<string, { cost: number; isFree: boolean }> = {};
    
    for (const model of models) {
      const modelPricing = getModelPricing(model.identifier);
      const cost = modelPricing 
        ? estimateCost(inputTokens, estimatedOutputTokens, model.identifier)
        : 0;
      
      totalCost += cost;
      if (!modelPricing?.isFree && cost > 0) {
        isFree = false;
      }
      
      breakdown[model.identifier] = {
        cost,
        isFree: modelPricing?.isFree ?? false,
      };
    }
    
    return { totalCost, isFree, breakdown };
  }, []);

  const totalTokensUsed = pipelineUsage?.grandTotal.totalTokens ?? 0;
  const totalCost = pipelineUsage?.grandTotal.estimatedCost ?? 0;

  return {
    pipelineUsage,
    currentStageUsage,
    startPipeline,
    startStage,
    recordModelUsage,
    completeStage,
    completePipeline,
    reset,
    estimateRequestCost,
    totalTokensUsed,
    totalCost,
  };
}

// Helper to extract token usage from API responses where available
export function extractTokenUsageFromResponse(
  response: unknown, 
  provider: string
): TokenUsage | null {
  if (!response || typeof response !== 'object') return null;
  
  const resp = response as Record<string, unknown>;
  
  switch (provider) {
    case 'openai':
      if (resp.usage && typeof resp.usage === 'object') {
        const usage = resp.usage as Record<string, number>;
        return {
          promptTokens: usage.prompt_tokens || 0,
          completionTokens: usage.completion_tokens || 0,
          totalTokens: usage.total_tokens || 0,
          estimatedCost: 0, // Calculated separately
        };
      }
      break;
      
    case 'anthropic':
      if (resp.usage && typeof resp.usage === 'object') {
        const usage = resp.usage as Record<string, number>;
        return {
          promptTokens: usage.input_tokens || 0,
          completionTokens: usage.output_tokens || 0,
          totalTokens: (usage.input_tokens || 0) + (usage.output_tokens || 0),
          estimatedCost: 0,
        };
      }
      break;
      
    case 'groq':
    case 'together':
      // These follow OpenAI format
      if (resp.usage && typeof resp.usage === 'object') {
        const usage = resp.usage as Record<string, number>;
        return {
          promptTokens: usage.prompt_tokens || 0,
          completionTokens: usage.completion_tokens || 0,
          totalTokens: usage.total_tokens || 0,
          estimatedCost: 0,
        };
      }
      break;
      
    case 'gemini':
      if (resp.usageMetadata && typeof resp.usageMetadata === 'object') {
        const usage = resp.usageMetadata as Record<string, number>;
        return {
          promptTokens: usage.promptTokenCount || 0,
          completionTokens: usage.candidatesTokenCount || 0,
          totalTokens: (usage.promptTokenCount || 0) + (usage.candidatesTokenCount || 0),
          estimatedCost: 0,
        };
      }
      break;
  }
  
  return null;
}
