import {
  StageConfig,
  ModelDetail,
  ModelContribution,
  ModelAnalysis,
  CompositeDocument,
  StageResult,
  SynthesisStrategy,
  TokenUsage,
} from '../types';
import { callAIProvider } from '../services/ai-providers';
import { calculateSimilarity, buildStagePrompt } from '../lib/utils';
import { estimateTokenCount, estimateCost, getModelPricing } from '../data/provider-pricing';

export interface ExecuteStageCallbacks {
  onRoundComplete: (round: number, document: CompositeDocument) => void;
  onStageComplete: (result: StageResult) => void;
  onModelResponse?: (modelId: string, usage: TokenUsage) => void;
}

export async function executeStage(
  stageConfig: StageConfig,
  inputText: string,
  previousStageResults: StageResult[],
  selectedModels: ModelDetail[],
  apiKeys: Record<string, string>,
  callbacks: ExecuteStageCallbacks,
  abortSignal?: AbortSignal
): Promise<StageResult> {
  const documents: CompositeDocument[] = [];
  let currentRound = 1;
  let shouldTerminate = false;
  let convergenceReason: string | undefined;

  // Track token usage for this stage
  const stageTokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCost: number;
    perModel: Record<string, TokenUsage>;
  } = {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    estimatedCost: 0,
    perModel: {},
  };

  // Build the stage-specific prompt
  const stagePrompt = buildStagePrompt(
    stageConfig.promptTemplate,
    inputText,
    previousStageResults
  );

  const maxRounds = stageConfig.convergence.maxRounds;

  while (currentRound <= maxRounds && !shouldTerminate) {
    if (abortSignal?.aborted) {
      convergenceReason = 'Manually stopped';
      break;
    }

    // Get the plan to analyze (initial prompt or previous round's composite)
    const planToAnalyze = documents.length > 0
      ? documents[documents.length - 1].compositePlan
      : stagePrompt;

    // For rounds after the first, use the refinement wrapper
    const roundPrompt = currentRound === 1
      ? planToAnalyze
      : buildRoundPrompt(stageConfig, planToAnalyze);

    // Call each selected model
    const modelContributions: ModelContribution[] = [];

    for (const model of selectedModels) {
      if (abortSignal?.aborted) break;

      try {
        const apiKey = apiKeys[model.provider];
        if (!apiKey) throw new Error(`Missing API key for ${model.provider}`);

        const startTime = Date.now();
        const response = await callAIProvider(
          model.provider,
          model.identifier,
          roundPrompt,
          apiKey
        );

        // Track token usage
        let tokenUsage: TokenUsage;
        
        if (response.tokenUsage) {
          // Use actual token usage from API
          tokenUsage = {
            promptTokens: response.tokenUsage.promptTokens,
            completionTokens: response.tokenUsage.completionTokens,
            totalTokens: response.tokenUsage.totalTokens,
            estimatedCost: estimateCost(
              response.tokenUsage.promptTokens,
              response.tokenUsage.completionTokens,
              model.identifier
            ),
          };
        } else {
          // Estimate token usage
          const promptTokens = estimateTokenCount(roundPrompt);
          const completionTokens = estimateTokenCount(response.content);
          tokenUsage = {
            promptTokens,
            completionTokens,
            totalTokens: promptTokens + completionTokens,
            estimatedCost: estimateCost(promptTokens, completionTokens, model.identifier),
          };
        }

        // Accumulate stage totals
        stageTokenUsage.promptTokens += tokenUsage.promptTokens;
        stageTokenUsage.completionTokens += tokenUsage.completionTokens;
        stageTokenUsage.totalTokens += tokenUsage.totalTokens;
        stageTokenUsage.estimatedCost += tokenUsage.estimatedCost;
        
        // Track per-model usage
        if (!stageTokenUsage.perModel[model.identifier]) {
          stageTokenUsage.perModel[model.identifier] = {
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
            estimatedCost: 0,
          };
        }
        const modelUsage = stageTokenUsage.perModel[model.identifier];
        modelUsage.promptTokens += tokenUsage.promptTokens;
        modelUsage.completionTokens += tokenUsage.completionTokens;
        modelUsage.totalTokens += tokenUsage.totalTokens;
        modelUsage.estimatedCost += tokenUsage.estimatedCost;

        // Notify callback
        callbacks.onModelResponse?.(model.identifier, tokenUsage);

        const analysis = parseModelResponse(response.content);
        const revisedPlan = extractRevisedPlan(response.content);

        modelContributions.push({
          model: model.name,
          provider: model.provider,
          identifier: model.identifier,
          analysis,
          revisedPlan,
          tokenUsage,
        });
      } catch (error) {
        console.error(`Error with model ${model.name}:`, error);
        modelContributions.push({
          model: model.name,
          provider: model.provider,
          identifier: model.identifier,
          analysis: {
            strengths: [],
            weaknesses: [],
            suggestions: [`Error: ${error instanceof Error ? error.message : 'Unknown error'}`],
          },
          revisedPlan: `Error: Could not generate output — ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }

    // Create composite document for this round
    const document = await createCompositeDocument(
      currentRound,
      modelContributions,
      stageConfig.synthesisStrategy,
      apiKeys,
      documents[documents.length - 1]
    );

    // Add token usage to document
    document.tokenUsage = {
      promptTokens: stageTokenUsage.promptTokens,
      completionTokens: stageTokenUsage.completionTokens,
      totalTokens: stageTokenUsage.totalTokens,
      estimatedCost: stageTokenUsage.estimatedCost,
    };

    documents.push(document);
    callbacks.onRoundComplete(currentRound, document);

    // Check termination conditions
    if (stageConfig.convergence.singlePass) {
      shouldTerminate = true;
      convergenceReason = 'Single pass complete';
    } else {
      const termination = checkTermination(
        stageConfig,
        documents[documents.length - 2],
        document,
        currentRound,
        maxRounds
      );
      shouldTerminate = termination.shouldTerminate;
      convergenceReason = termination.reason;
    }

    if (!shouldTerminate) currentRound++;
  }

  if (!convergenceReason && currentRound > maxRounds) {
    convergenceReason = 'Maximum rounds reached';
  }

  const result: StageResult = {
    stageId: stageConfig.id,
    stageType: stageConfig.type,
    stageName: stageConfig.name,
    documents,
    finalOutput: documents.length > 0
      ? documents[documents.length - 1].compositePlan
      : inputText,
    convergenceReason,
    tokenUsage: {
      stageId: stageConfig.id,
      stageName: stageConfig.name,
      input: {
        promptTokens: estimateTokenCount(inputText),
        completionTokens: 0,
        totalTokens: estimateTokenCount(inputText),
        estimatedCost: 0,
      },
      output: {
        promptTokens: stageTokenUsage.promptTokens,
        completionTokens: stageTokenUsage.completionTokens,
        totalTokens: stageTokenUsage.totalTokens,
        estimatedCost: stageTokenUsage.estimatedCost,
      },
      total: {
        promptTokens: estimateTokenCount(inputText) + stageTokenUsage.promptTokens,
        completionTokens: stageTokenUsage.completionTokens,
        totalTokens: estimateTokenCount(inputText) + stageTokenUsage.totalTokens,
        estimatedCost: stageTokenUsage.estimatedCost,
      },
      perModel: stageTokenUsage.perModel,
    },
  };

  callbacks.onStageComplete(result);
  return result;
}

// ── Internal helpers ───────────────────────────────────

function buildRoundPrompt(stageConfig: StageConfig, currentPlan: string): string {
  // For subsequent rounds, wrap the current plan in a refinement context
  return `# Continue: ${stageConfig.name}

**Current output from previous round:**

${currentPlan}

**Your Task:** Review and improve upon the above output. Apply the same analytical framework as before. Focus on what can be strengthened, what was missed, and what needs more depth. Produce an improved version.

**Output Format:** Use the same format as before. Include a complete revised version.`;
}

function parseModelResponse(response: string): ModelAnalysis {
  try {
    const parsed = JSON.parse(response);
    if (parsed.strengths && parsed.weaknesses && parsed.suggestions) {
      return {
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
        viabilityScore: typeof parsed.viabilityScore === 'number' ? parsed.viabilityScore : undefined,
      };
    }
  } catch {
    // Fall through to regex parsing
  }

  const strengths = extractSection(response, 'Strengths:');
  const weaknesses = extractSection(response, 'Weaknesses:');
  const suggestions = extractSection(response, 'Suggestions:');
  const viabilityMatch = response.match(/Viability Score:\s*(\d+(?:\.\d+)?)/i);
  const viabilityScore = viabilityMatch ? parseFloat(viabilityMatch[1]) : undefined;

  return {
    strengths: strengths.length > 0 ? strengths : ['Analysis included in full response'],
    weaknesses: weaknesses.length > 0 ? weaknesses : ['Analysis included in full response'],
    suggestions: suggestions.length > 0 ? suggestions : ['See full response for details'],
    viabilityScore,
  };
}

function extractSection(text: string, sectionName: string): string[] {
  const regex = new RegExp(`${sectionName}\\s*([\\s\\S]*?)(?=\\n\\s*[A-Z][^:]*:|$)`, 'i');
  const match = text.match(regex);
  if (!match) return [];
  return match[1]
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.match(/^-+$|^\*+$|^=+$/))
    .map(line => line.replace(/^[-*•\d.]+\s*/, ''))
    .filter(line => line.length > 0);
}

function extractRevisedPlan(response: string): string {
  // Try multiple section names
  const sectionNames = [
    'Revised Concept:', 'Revised Plan:', 'Revised Architecture:',
    'Enriched Concept:', 'Enriched Requirements:', 'Enriched Strategy:',
    'Structured Output:', 'Content Outline:', 'Campaign Plan:',
  ];
  
  for (const name of sectionNames) {
    const regex = new RegExp(`${name}\\s*([\\s\\S]*?)(?=\\n\\s*(?:Viability Score:|Overall Score:|$))`, 'i');
    const match = response.match(regex);
    if (match && match[1].trim().length > 50) {
      return match[1].trim();
    }
  }
  
  return response;
}

async function createCompositeDocument(
  round: number,
  modelContributions: ModelContribution[],
  synthesisStrategy: SynthesisStrategy,
  apiKeys: Record<string, string>,
  previousDocument?: CompositeDocument
): Promise<CompositeDocument> {
  const successfulContributions = modelContributions.filter(
    c => !c.revisedPlan.startsWith('Error:')
  );

  let compositePlan: string;
  let strategy: string;

  switch (synthesisStrategy) {
    case SynthesisStrategy.FIRST_SUCCESSFUL:
      compositePlan = successfulContributions[0]?.revisedPlan || modelContributions[0]?.revisedPlan || 'No output available';
      strategy = 'firstSuccessful';
      break;

    case SynthesisStrategy.HIGHEST_SCORE: {
      const sorted = [...successfulContributions].sort((a, b) => {
        return (b.analysis.viabilityScore ?? -1) - (a.analysis.viabilityScore ?? -1);
      });
      compositePlan = sorted[0]?.revisedPlan || successfulContributions[0]?.revisedPlan || 'No output available';
      strategy = 'highestScore';
      break;
    }

    case SynthesisStrategy.LLM_SYNTHESIS:
    case SynthesisStrategy.CUSTOM_SYNTHESIS:
      if (successfulContributions.length > 1) {
        try {
          compositePlan = await synthesizeWithLLM(successfulContributions, apiKeys);
          strategy = 'llmSynthesis';
        } catch (error) {
          console.error('LLM synthesis failed, falling back:', error);
          compositePlan = successfulContributions[0]?.revisedPlan || 'Synthesis failed';
          strategy = 'fallbackToFirst';
        }
      } else {
        compositePlan = successfulContributions[0]?.revisedPlan || 'No output available';
        strategy = 'singleModel';
      }
      break;

    default:
      compositePlan = successfulContributions[0]?.revisedPlan || 'No output available';
      strategy = 'default';
  }

  const similarity = previousDocument ? calculateSimilarity(previousDocument.compositePlan, compositePlan) : 0;
  const changeLog = previousDocument
    ? `Similarity to previous round: ${(similarity * 100).toFixed(1)}%. Strategy: ${strategy}.`
    : `Initial round. Strategy: ${strategy}.`;

  return { round, compositePlan, modelContributions, changeLog };
}

async function synthesizeWithLLM(
  contributions: ModelContribution[],
  apiKeys: Record<string, string>
): Promise<string> {
  const modelPlansText = contributions
    .map(c => `--- Model: ${c.model} ---\n${c.revisedPlan}`)
    .join('\n\n');

  const prompt = `# Synthesis

**Goal:** Combine the best elements from these model outputs into a single, superior version.

**Model Outputs:**

${modelPlansText}

**Instructions:**
1. Extract the strongest ideas from each output.
2. Resolve any conflicts by choosing the most logical approach.
3. Produce a single, coherent, comprehensive result.
4. Output only the synthesized result — no commentary.`;

  const model = contributions[0];
  const apiKey = apiKeys[model.provider];
  if (!apiKey) throw new Error(`Missing API key for synthesis: ${model.provider}`);

  const response = await callAIProvider(model.provider, model.identifier, prompt, apiKey);
  return response.content;
}

function checkTermination(
  stageConfig: StageConfig,
  previousDoc: CompositeDocument | undefined,
  currentDoc: CompositeDocument,
  currentRound: number,
  maxRounds: number
): { shouldTerminate: boolean; reason?: string } {
  // Max rounds
  if (currentRound >= maxRounds) {
    return { shouldTerminate: true, reason: 'Maximum rounds reached' };
  }

  if (!previousDoc) return { shouldTerminate: false };

  // Similarity threshold (primarily for REFINE stages)
  if (stageConfig.convergence.similarityThreshold) {
    const similarity = calculateSimilarity(previousDoc.compositePlan, currentDoc.compositePlan);
    if (similarity >= stageConfig.convergence.similarityThreshold) {
      return { shouldTerminate: true, reason: `Converged (${(similarity * 100).toFixed(0)}% similarity)` };
    }
  }

  // No new items stop (primarily for CRITIQUE stages)
  if (stageConfig.convergence.noNewItemsStop) {
    const hasNewItems = currentDoc.modelContributions.some(contrib => {
      const prevContrib = previousDoc.modelContributions.find(
        prev => prev.identifier === contrib.identifier
      );
      if (!prevContrib) return true;

      // Check for new suggestions/weaknesses not seen before
      const allPrevItems = [
        ...prevContrib.analysis.weaknesses,
        ...prevContrib.analysis.suggestions,
      ];
      const newItems = [
        ...contrib.analysis.weaknesses,
        ...contrib.analysis.suggestions,
      ].filter(item =>
        item.length > 10 &&
        !allPrevItems.some(prev => calculateSimilarity(item, prev) > 0.8)
      );
      return newItems.length > 0;
    });

    if (!hasNewItems) {
      return { shouldTerminate: true, reason: 'No significant new findings' };
    }
  }

  // Viability score convergence
  const prevScores = previousDoc.modelContributions.map(c => c.analysis.viabilityScore).filter((s): s is number => s !== undefined);
  const currScores = currentDoc.modelContributions.map(c => c.analysis.viabilityScore).filter((s): s is number => s !== undefined);

  if (prevScores.length > 0 && currScores.length > 0) {
    const prevAvg = prevScores.reduce((a, b) => a + b, 0) / prevScores.length;
    const currAvg = currScores.reduce((a, b) => a + b, 0) / currScores.length;
    if (Math.abs(currAvg - prevAvg) < 0.2) {
      return { shouldTerminate: true, reason: 'Viability scores converged' };
    }
  }

  return { shouldTerminate: false };
}
