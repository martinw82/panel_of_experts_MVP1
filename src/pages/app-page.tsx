import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Users, 
  Play, 
  Square, 
  RotateCcw, 
  Settings, 
  ChevronLeft,
  Wallet,
  Sparkles,
  Zap,
  PanelLeft,
  PanelRight,
  Download
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';
import { Toaster } from '../components/ui/toast';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { PipelineSelector } from '../components/pipeline-selector';
import { LLMSelector } from '../components/llm-selector';
import { SettingsDialog } from '../components/settings-dialog';
import { PipelineProgress } from '../components/pipeline-progress';
import { TokenUsagePanel } from '../components/token-usage-panel';
import { useToast } from '../hooks/use-toast';
import { useTokenTracker } from '../hooks/use-token-tracker';
import { PIPELINE_PRESETS } from '../pipelines';
import { executeStage } from '../actions/execute-stage';
import {
  ModelDetail,
  AIProvider,
  AppSettings,
  PipelinePreset,
  PipelineState,
  StageResult,
} from '../types';
import { 
  MODEL_PRICING, 
  getModelPricing,
  formatCost,
  estimateTokenCount 
} from '../data/provider-pricing';

const defaultSettings: AppSettings = {
  apiKeys: {} as Record<AIProvider, string>,
  selectedPipelineId: 'general',
  preferredFreeModels: true,
};

const initialPipelineState: PipelineState = {
  isRunning: false,
  currentStageIndex: 0,
  currentRoundInStage: 0,
  stageResults: [],
};

interface AppPageProps {
  embed?: boolean;
  compact?: boolean;
  hideHeader?: boolean;
  hideSidebar?: boolean;
  initialPipeline?: string;
  initialModels?: string[];
  autoRun?: boolean;
}

export default function AppPage({
  embed = false,
  compact = false,
  hideHeader = false,
  hideSidebar = false,
  initialPipeline,
  initialModels,
  autoRun = false,
}: AppPageProps) {
  // Settings
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [sidebarOpen, setSidebarOpen] = useState(!compact);

  // Pipeline config
  const [selectedPipeline, setSelectedPipeline] = useState<PipelinePreset>(PIPELINE_PRESETS[0]);
  const [selectedModels, setSelectedModels] = useState<ModelDetail[]>([]);
  const [initialPrompt, setInitialPrompt] = useState('');
  const [quickMode, setQuickMode] = useState(false);

  // Pipeline execution state
  const [pipelineState, setPipelineState] = useState<PipelineState>(initialPipelineState);
  const abortControllerRef = useRef<AbortController | null>(null);

  const { toast, toasts, dismiss } = useToast();
  const tokenTracker = useTokenTracker();

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('panel-of-experts-settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings({ ...defaultSettings, ...parsed });
      } catch {
        // ignore
      }
    }
  }, []);

  // Save settings
  useEffect(() => {
    localStorage.setItem('panel-of-experts-settings', JSON.stringify(settings));
  }, [settings]);

  // Initialize from URL params / embed config
  useEffect(() => {
    if (initialPipeline) {
      const pipeline = PIPELINE_PRESETS.find(p => p.id === initialPipeline);
      if (pipeline) setSelectedPipeline(pipeline);
    }
    
    if (initialModels && initialModels.length > 0) {
      const models = initialModels
        .map(id => MODEL_PRICING.find(m => m.identifier === id || m.identifier.endsWith(id)))
        .filter(Boolean)
        .map(m => ({
          name: m!.name,
          provider: m!.provider,
          identifier: m!.identifier,
          costPer1MInput: m!.costPer1MInput,
          costPer1MOutput: m!.costPer1MOutput,
          isFree: m!.isFree,
        }));
      setSelectedModels(models);
    }
  }, [initialPipeline, initialModels]);

  // Auto-run if configured
  useEffect(() => {
    if (autoRun && initialPrompt && selectedModels.length > 0) {
      const timer = setTimeout(() => runPipeline(), 500);
      return () => clearTimeout(timer);
    }
  }, [autoRun]);

  const handlePipelineSelect = (pipeline: PipelinePreset) => {
    setSelectedPipeline(pipeline);
    setSettings(prev => ({ ...prev, selectedPipelineId: pipeline.id }));
  };

  // Cost estimation for current config
  const costEstimate = tokenTracker.estimateRequestCost(initialPrompt, selectedModels);
  const hasFreeModels = selectedModels.some(m => m.isFree);
  const allFree = selectedModels.length > 0 && selectedModels.every(m => m.isFree);

  const validate = (): string | null => {
    if (!initialPrompt.trim()) return 'Enter your idea or concept first';
    if (selectedModels.length === 0) return 'Select at least one AI model';
    const missing = selectedModels.filter(m => !settings.apiKeys[m.provider]);
    if (missing.length > 0) {
      const missingProviders = [...new Set(missing.map(m => m.provider))];
      // Check if any missing are free providers (Groq, Ollama, etc.)
      const paidMissing = missingProviders.filter(p => {
        return p !== AIProvider.GROQ && p !== AIProvider.OLLAMA && p !== AIProvider.OPENROUTER;
      });
      if (paidMissing.length > 0) {
        return `Missing API keys for: ${paidMissing.join(', ')}`;
      }
    }
    return null;
  };

  const runPipeline = async () => {
    const error = validate();
    if (error) {
      toast({ title: 'Cannot start', description: error, variant: 'destructive' });
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setPipelineState({
      isRunning: true,
      currentStageIndex: 0,
      currentRoundInStage: 0,
      stageResults: [],
    });

    tokenTracker.startPipeline();
    const stageResults: StageResult[] = [];

    try {
      for (let i = 0; i < selectedPipeline.stages.length; i++) {
        if (controller.signal.aborted) break;

        const stageConfig = selectedPipeline.stages[i];

        setPipelineState(prev => ({
          ...prev,
          currentStageIndex: i,
          currentRoundInStage: 1,
        }));

        toast({
          title: `Stage ${i + 1}: ${stageConfig.name}`,
          description: stageConfig.description,
        });

        // Determine input for this stage
        const inputText = stageResults.length > 0
          ? stageResults[stageResults.length - 1].finalOutput
          : initialPrompt;

        // Start tracking for this stage
        tokenTracker.startStage(stageConfig.id, stageConfig.name, inputText);

        const result = await executeStage(
          stageConfig,
          inputText,
          stageResults,
          selectedModels,
          settings.apiKeys,
          {
            onRoundComplete: (round) => {
              setPipelineState(prev => ({
                ...prev,
                currentRoundInStage: round + 1,
              }));
            },
            onStageComplete: (stageResult) => {
              stageResults.push(stageResult);
              setPipelineState(prev => ({
                ...prev,
                stageResults: [...stageResults],
              }));
              
              // Track token usage for this stage completion
              // (Actual token usage would come from API responses)
              tokenTracker.completeStage();
            },
          },
          controller.signal
        );

        // If we didn't get added via callback
        if (!stageResults.includes(result)) {
          stageResults.push(result);
          setPipelineState(prev => ({
            ...prev,
            stageResults: [...stageResults],
          }));
          tokenTracker.completeStage();
        }
      }

      if (!controller.signal.aborted) {
        tokenTracker.completePipeline();
        const finalCost = tokenTracker.totalCost;
        
        toast({
          title: 'Pipeline complete',
          description: finalCost === 0 
            ? `All ${selectedPipeline.stages.length} stages finished — FREE!` 
            : `All ${selectedPipeline.stages.length} stages finished — Total: ${formatCost(finalCost)}`,
          variant: 'success',
        });

        // Send completion message for embed mode
        if (embed && window.parent !== window) {
          window.parent.postMessage({
            type: 'panel-of-experts:complete',
            payload: {
              output: stageResults[stageResults.length - 1]?.finalOutput,
              stages: stageResults.length,
              tokens: tokenTracker.totalTokensUsed,
              cost: finalCost,
            }
          }, '*');
        }
      }
    } catch (err) {
      console.error('Pipeline error:', err);
      setPipelineState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Unknown error',
      }));
      toast({
        title: 'Pipeline error',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
      
      if (embed && window.parent !== window) {
        window.parent.postMessage({
          type: 'panel-of-experts:error',
          payload: { error: err instanceof Error ? err.message : 'Unknown error' }
        }, '*');
      }
    } finally {
      setPipelineState(prev => ({ 
        ...prev, 
        isRunning: false,
        tokenUsage: tokenTracker.pipelineUsage || undefined,
      }));
      abortControllerRef.current = null;
    }
  };

  const stopPipeline = () => {
    abortControllerRef.current?.abort();
    setPipelineState(prev => ({ ...prev, isRunning: false }));
    toast({ title: 'Pipeline stopped', description: 'Manually stopped — completed stages are preserved' });
  };

  const resetPipeline = () => {
    setPipelineState(initialPipelineState);
    setInitialPrompt('');
    tokenTracker.reset();
    toast({ title: 'Reset', description: 'Ready for a new run', variant: 'success' });
  };

  const hasResults = pipelineState.stageResults.length > 0;

  // Compact/Embed mode
  if (compact || hideSidebar) {
    return (
      <div className="min-h-screen bg-background">
        {!hideHeader && (
          <header className="border-b bg-card/50 backdrop-blur px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <h1 className="font-bold">Panel of Experts</h1>
              </div>
              <div className="flex items-center gap-2">
                <SettingsDialog settings={settings} onSettingsChange={setSettings} />
                {hasResults && !pipelineState.isRunning && (
                  <Button variant="outline" size="sm" onClick={resetPipeline}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </header>
        )}
        
        <main className="p-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Input & Models</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={initialPrompt}
                    onChange={(e) => setInitialPrompt(e.target.value)}
                    placeholder="Describe your idea..."
                    className="min-h-[100px] text-sm"
                    disabled={pipelineState.isRunning}
                  />
                  
                  <LLMSelector
                    selectedModels={selectedModels}
                    onSelectionChange={setSelectedModels}
                    inputText={initialPrompt}
                    compact
                  />
                  
                  {costEstimate && (
                    <div className={`text-sm p-2 rounded ${allFree ? 'bg-green-50 text-green-700' : 'bg-muted'}`}>
                      Est: {costEstimate.formatted} {allFree && '— FREE!'}
                    </div>
                  )}
                  
                  {pipelineState.isRunning ? (
                    <Button variant="destructive" className="w-full" onClick={stopPipeline}>
                      <Square className="h-4 w-4 mr-2" /> Stop
                    </Button>
                  ) : (
                    <Button 
                      className="w-full" 
                      onClick={runPipeline}
                      disabled={!initialPrompt.trim() || selectedModels.length === 0}
                    >
                      <Play className="h-4 w-4 mr-2" /> Run
                    </Button>
                  )}
                </CardContent>
              </Card>
              
              <TokenUsagePanel pipelineState={pipelineState} compact />
            </div>
            
            <div className="lg:col-span-2">
              <PipelineProgress
                pipeline={selectedPipeline}
                pipelineState={pipelineState}
                onToast={toast}
                compact
              />
            </div>
          </div>
        </main>
        
        <Toaster toasts={toasts} onDismiss={dismiss} />
      </div>
    );
  }

  // Full mode
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-7 w-7 text-primary" />
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Panel of Experts
                </h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  Multi-stage AI refinement
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {hasResults && (
                <Button variant="outline" size="sm" onClick={resetPipeline} disabled={pipelineState.isRunning}>
                  <RotateCcw className="h-4 w-4 mr-1" /> Reset
                </Button>
              )}
              
              <SettingsDialog settings={settings} onSettingsChange={setSettings} />

              {pipelineState.isRunning ? (
                <Button variant="destructive" size="sm" onClick={stopPipeline}>
                  <Square className="h-4 w-4 mr-1" /> Stop
                </Button>
              ) : (
                <Button
                  onClick={runPipeline}
                  disabled={!initialPrompt.trim() || selectedModels.length === 0}
                  className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                >
                  <Play className="h-4 w-4 mr-1" /> Run Pipeline
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left: Configuration Sidebar */}
          <div className={`lg:col-span-4 xl:col-span-3 space-y-4 ${!sidebarOpen ? 'lg:hidden' : ''}`}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Configure</CardTitle>
                <CardDescription>Pipeline, input, and model selection</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="input" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="input">Input</TabsTrigger>
                    <TabsTrigger value="models">Models</TabsTrigger>
                    <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
                  </TabsList>

                  <TabsContent value="input" className="space-y-3">
                    <div>
                      <h3 className="text-sm font-semibold mb-1">Your concept</h3>
                      <p className="text-xs text-muted-foreground mb-3">
                        Describe your idea, project, or concept.
                      </p>
                    </div>
                    <Textarea
                      value={initialPrompt}
                      onChange={(e) => setInitialPrompt(e.target.value)}
                      placeholder={getPlaceholder(selectedPipeline.id)}
                      className="min-h-[200px] text-sm"
                      disabled={pipelineState.isRunning}
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{initialPrompt.length > 0 ? `${initialPrompt.split(/\s+/).filter(Boolean).length} words` : 'No input yet'}</span>
                      {costEstimate && (
                        <span className={allFree ? 'text-green-600 font-medium' : ''}>
                          Est: {costEstimate.formatted}
                        </span>
                      )}
                    </div>
                    
                    {/* Quick Mode Toggle */}
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-amber-500" />
                        <Label htmlFor="quick-mode" className="text-sm cursor-pointer">Quick Mode</Label>
                      </div>
                      <Switch
                        id="quick-mode"
                        checked={quickMode}
                        onCheckedChange={setQuickMode}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Quick mode skips detailed round inspection for faster results.
                    </p>
                  </TabsContent>

                  <TabsContent value="models">
                    <LLMSelector
                      selectedModels={selectedModels}
                      onSelectionChange={setSelectedModels}
                      inputText={initialPrompt}
                    />
                  </TabsContent>

                  <TabsContent value="pipeline">
                    <PipelineSelector
                      pipelines={PIPELINE_PRESETS}
                      selectedPipelineId={selectedPipeline.id}
                      onSelectPipeline={handlePipelineSelect}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Token Usage Panel */}
            <TokenUsagePanel pipelineState={pipelineState} />

            {/* Cost Summary Card */}
            {costEstimate && (
              <Card className={allFree ? 'bg-green-50/50 border-green-200' : ''}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Cost Estimate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-3xl font-bold ${allFree ? 'text-green-600' : ''}`}>
                      {costEstimate.formatted}
                    </span>
                    <span className="text-sm text-muted-foreground">per run</span>
                  </div>
                  
                  {allFree ? (
                    <div className="flex items-center gap-1 mt-2 text-green-600">
                      <Sparkles className="h-4 w-4" />
                      <span className="text-sm font-medium">All selected models are FREE!</span>
                    </div>
                  ) : hasFreeModels ? (
                    <p className="text-xs text-muted-foreground mt-2">
                      Mix of free and paid models. Free models won't incur charges.
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-2">
                      Based on ~{Math.ceil(initialPrompt.length / 4 * 4 / 1000)}K tokens total
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar Toggle (visible when collapsed) */}
          {!sidebarOpen && (
            <div className="lg:col-span-1 flex justify-center">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="h-8 w-8"
              >
                <PanelRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Right: Results */}
          <div className={`${sidebarOpen ? 'lg:col-span-8 xl:col-span-9' : 'lg:col-span-11'}`}>
            <PipelineProgress
              pipeline={selectedPipeline}
              pipelineState={pipelineState}
              onToast={toast}
              compact={quickMode}
            />
          </div>
        </div>
      </main>

      <Toaster toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

function getPlaceholder(pipelineId: string): string {
  switch (pipelineId) {
    case 'code-architecture':
      return 'Describe the software you want to build...\n\nExample: "A real-time collaboration tool for small teams. Users can create shared workspaces, add documents, assign tasks, and chat. Needs to work offline and sync when back online. Target: freelancers and small agencies (2-10 people)."';
    case 'content':
      return 'Describe your content idea...\n\nExample: "A deep-dive article about how solo developers can use AI as a force multiplier. Target audience: indie hackers and bootstrapped founders. Angle: practical workflows, not hype."';
    case 'marketing':
      return 'Describe your marketing challenge...\n\nExample: "Launch campaign for a new project management tool targeting solo builders. Budget: £500. Channels to consider: Twitter/X, indie hacker communities, Product Hunt. Need to generate first 100 signups."';
    case 'research':
      return 'Describe your research topic or question...\n\nExample: "How are solo developers using AI coding assistants to compete with larger teams? What workflows are most effective? What are the limits?"';
    default:
      return 'Describe your idea, concept, or project...\n\nBe specific about what you want to achieve, who it\'s for, and any constraints. The pipeline will expand, critique, refine, and extract actionable outputs from your concept.';
  }
}

// Simple Badge component
function Badge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary text-primary-foreground ${className}`}>
      {children}
    </span>
  );
}
