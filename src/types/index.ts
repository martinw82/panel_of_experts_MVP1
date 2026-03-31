import { z } from 'zod';

// Re-export AIProvider from pricing data for consistency
export { AIProvider } from '../data/provider-pricing';

// ── Enums ──────────────────────────────────────────────

export enum SynthesisStrategy {
  FIRST_SUCCESSFUL = 'firstSuccessful',
  HIGHEST_SCORE = 'highestScore',
  LLM_SYNTHESIS = 'llmSynthesis',
  CUSTOM_SYNTHESIS = 'customSynthesis'
}

export enum StageType {
  EXPAND = 'expand',
  CRITIQUE = 'critique',
  REFINE = 'refine',
  VALIDATE = 'validate',
  STRUCTURE = 'structure',
  EXTRACT = 'extract'
}

// ── Stage Type Metadata ────────────────────────────────

export const STAGE_TYPE_META: Record<StageType, {
  label: string;
  description: string;
  color: string;
  icon: string;
}> = {
  [StageType.EXPAND]: {
    label: 'Expand',
    description: 'Divergent thinking — explore angles, broaden scope',
    color: 'teal',
    icon: '🌱',
  },
  [StageType.CRITIQUE]: {
    label: 'Critique',
    description: 'Adversarial — break assumptions, surface risks',
    color: 'orange',
    icon: '🔍',
  },
  [StageType.REFINE]: {
    label: 'Refine',
    description: 'Convergent — address critiques, strengthen, synthesize',
    color: 'purple',
    icon: '⚡',
  },
  [StageType.VALIDATE]: {
    label: 'Validate',
    description: 'Score feasibility, test assumptions against reality',
    color: 'blue',
    icon: '✓',
  },
  [StageType.STRUCTURE]: {
    label: 'Structure',
    description: 'Organise into frameworks, outlines, hierarchies',
    color: 'amber',
    icon: '📐',
  },
  [StageType.EXTRACT]: {
    label: 'Extract',
    description: 'Pull deliverables — tasks, briefs, action items',
    color: 'green',
    icon: '📦',
  },
};

// ── Convergence Config ─────────────────────────────────

export interface ConvergenceConfig {
  /** Fixed number of rounds (used by EXPAND, STRUCTURE) */
  maxRounds: number;
  /** Similarity threshold to trigger early stop (used by REFINE) */
  similarityThreshold?: number;
  /** Stop when no new items found (used by CRITIQUE) */
  noNewItemsStop?: boolean;
  /** Always single pass (used by EXTRACT, VALIDATE) */
  singlePass?: boolean;
}

// ── Stage Config ───────────────────────────────────────

export interface StageConfig {
  id: string;
  type: StageType;
  name: string;
  description: string;
  promptTemplate: string;
  convergence: ConvergenceConfig;
  synthesisStrategy: SynthesisStrategy;
}

// ── Pipeline Preset ────────────────────────────────────

export interface PipelinePreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  stages: StageConfig[];
}

// ── Model Types ────────────────────────────────────────

import { AIProvider } from '../data/provider-pricing';

export interface ModelDetail {
  name: string;
  provider: AIProvider;
  identifier: string;
  costPer1MInput?: number;
  costPer1MOutput?: number;
  isFree?: boolean;
}

export const ModelAnalysisSchema = z.object({
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  suggestions: z.array(z.string()),
  viabilityScore: z.number().min(1).max(10).optional()
});

export type ModelAnalysis = z.infer<typeof ModelAnalysisSchema>;

export interface ModelContribution {
  model: string;
  provider: AIProvider;
  identifier: string;
  analysis: ModelAnalysis;
  revisedPlan: string;
  // Token usage for this contribution
  tokenUsage?: TokenUsage;
}

// ── Token Usage Types ──────────────────────────────────

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

export interface StageTokenUsage {
  stageId: string;
  stageName: string;
  input: TokenUsage;
  output: TokenUsage;
  total: TokenUsage;
  perModel: Record<string, TokenUsage>; // model identifier -> usage
}

export interface PipelineTokenUsage {
  stages: StageTokenUsage[];
  grandTotal: TokenUsage;
  startedAt: number;
  completedAt?: number;
}

// ── Document Types ─────────────────────────────────────

export interface CompositeDocument {
  round: number;
  compositePlan: string;
  modelContributions: ModelContribution[];
  changeLog: string;
  tokenUsage?: TokenUsage; // Per round token usage
}

export interface StageResult {
  stageId: string;
  stageType: StageType;
  stageName: string;
  documents: CompositeDocument[];
  finalOutput: string;
  convergenceReason?: string;
  tokenUsage?: StageTokenUsage;
}

// ── Pipeline State ─────────────────────────────────────

export interface PipelineState {
  isRunning: boolean;
  currentStageIndex: number;
  currentRoundInStage: number;
  stageResults: StageResult[];
  error?: string;
  tokenUsage?: PipelineTokenUsage;
}

// ── Prompt Template (for initial input) ────────────────

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
}

// ── Settings ───────────────────────────────────────────

export interface AppSettings {
  apiKeys: Record<AIProvider, string>;
  selectedPipelineId: string;
  // New settings for cost control
  maxCostPerRequest?: number;
  preferredFreeModels?: boolean;
}

// ── Input/Output for stage execution ───────────────────

export interface ExecuteStageInput {
  stageConfig: StageConfig;
  inputText: string;
  previousStageResults: StageResult[];
  selectedModels: ModelDetail[];
  apiKeys: Record<string, string>;
}

export interface ExecuteStageOutput {
  result: StageResult;
}

// ── Plugin/Embed Types ─────────────────────────────────

export interface EmbedConfig {
  embed?: boolean;
  compact?: boolean;
  pipeline?: string;
  models?: string[]; // comma-separated model identifiers
  autoRun?: boolean;
  hideHeader?: boolean;
  hideSidebar?: boolean;
}

export interface PluginMessage {
  type: 'panel-of-experts:ready' | 'panel-of-experts:started' | 'panel-of-experts:progress' | 
        'panel-of-experts:stage-complete' | 'panel-of-experts:complete' | 'panel-of-experts:error';
  payload: unknown;
}

// ── Cost Estimate Types ────────────────────────────────

export interface CostEstimate {
  inputTokens: number;
  estimatedOutputTokens: number;
  perModel: Record<string, {
    inputCost: number;
    outputCost: number;
    totalCost: number;
  }>;
  totalCost: number;
  isFree: boolean;
}
