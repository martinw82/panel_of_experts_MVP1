import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Copy, Download, ChevronDown, ChevronRight, AlertTriangle, Maximize2, Minimize2 } from 'lucide-react';
import { PipelinePreset, PipelineState, StageResult, CompositeDocument, STAGE_TYPE_META } from '../types';
import { copyToClipboard, downloadAsText } from '../lib/utils';
import { formatCost } from '../data/provider-pricing';

interface PipelineProgressProps {
  pipeline: PipelinePreset;
  pipelineState: PipelineState;
  onToast: (msg: { title?: string; description?: string; variant?: 'default' | 'destructive' | 'success' }) => void;
  compact?: boolean;
}

const stageColorBorder: Record<string, string> = {
  teal: 'border-l-teal-500',
  orange: 'border-l-orange-500',
  purple: 'border-l-purple-500',
  blue: 'border-l-blue-500',
  amber: 'border-l-amber-500',
  green: 'border-l-green-500',
};

const stageColorBg: Record<string, string> = {
  teal: 'bg-teal-50 dark:bg-teal-950',
  orange: 'bg-orange-50 dark:bg-orange-950',
  purple: 'bg-purple-50 dark:bg-purple-950',
  blue: 'bg-blue-50 dark:bg-blue-950',
  amber: 'bg-amber-50 dark:bg-amber-950',
  green: 'bg-green-50 dark:bg-green-950',
};

const stageColorText: Record<string, string> = {
  teal: 'text-teal-700 dark:text-teal-300',
  orange: 'text-orange-700 dark:text-orange-300',
  purple: 'text-purple-700 dark:text-purple-300',
  blue: 'text-blue-700 dark:text-blue-300',
  amber: 'text-amber-700 dark:text-amber-300',
  green: 'text-green-700 dark:text-green-300',
};

export function PipelineProgress({ pipeline, pipelineState, onToast, compact = false }: PipelineProgressProps) {
  const [expandedStages, setExpandedStages] = useState<Set<number>>(new Set());
  const [expandedRounds, setExpandedRounds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('summary');

  const toggleStage = (index: number) => {
    setExpandedStages(prev => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };

  const toggleRound = (key: string) => {
    setExpandedRounds(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleCopy = async (content: string, label: string) => {
    try {
      await copyToClipboard(content);
      onToast({ title: 'Copied', description: `${label} copied to clipboard`, variant: 'success' });
    } catch {
      onToast({ title: 'Copy failed', variant: 'destructive' });
    }
  };

  const handleDownload = (content: string, filename: string) => {
    downloadAsText(content, filename);
    onToast({ title: 'Downloaded', description: filename, variant: 'success' });
  };

  const totalStages = pipeline.stages.length;
  const completedStages = pipelineState.stageResults.length;
  const overallProgress = totalStages > 0 ? (completedStages / totalStages) * 100 : 0;

  // Show empty state
  if (!pipelineState.isRunning && completedStages === 0 && !pipelineState.error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-2">
            <p className="text-lg font-medium text-muted-foreground">Ready to run</p>
            <p className="text-sm text-muted-foreground">
              Configure your input and models, then start the pipeline
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Compact mode - simplified view
  if (compact) {
    return (
      <div className="space-y-3">
        {/* Progress Header */}
        <Card>
          <CardContent className="py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {pipelineState.isRunning ? 'Running...' : completedStages === totalStages ? 'Complete' : 'Ready'}
              </span>
              <span className="text-xs text-muted-foreground">
                {completedStages}/{totalStages} stages
              </span>
            </div>
            <Progress value={overallProgress} className="h-2" />
            
            {/* Stage indicators */}
            <div className="flex gap-1 mt-3 flex-wrap">
              {pipeline.stages.map((stage, i) => {
                const meta = STAGE_TYPE_META[stage.type];
                const isComplete = i < completedStages;
                const isCurrent = i === pipelineState.currentStageIndex && pipelineState.isRunning;
                
                return (
                  <div
                    key={stage.id}
                    className={`
                      flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium
                      ${isComplete ? 'bg-green-100 text-green-800' : ''}
                      ${isCurrent ? 'bg-amber-100 text-amber-800 animate-pulse' : ''}
                      ${!isComplete && !isCurrent ? 'bg-muted text-muted-foreground' : ''}
                    `}
                  >
                    {isComplete && '✓'}
                    {isCurrent && '●'}
                    {meta.label}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Current/Last Result */}
        {completedStages > 0 && (
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Latest Output</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 text-xs"
                  onClick={() => handleCopy(
                    pipelineState.stageResults[completedStages - 1].finalOutput,
                    'Latest output'
                  )}
                >
                  <Copy className="h-3 w-3 mr-1" /> Copy
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-xs bg-muted/50 p-3 rounded-lg max-h-[300px] overflow-y-auto">
                {pipelineState.stageResults[completedStages - 1].finalOutput}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Final Output */}
        {!pipelineState.isRunning && completedStages === totalStages && (
          <Card className="border-green-500/30 bg-green-50/50">
            <CardHeader className="py-3">
              <CardTitle className="text-sm text-green-700 flex items-center gap-2">
                ✓ Pipeline Complete
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <pre className="whitespace-pre-wrap text-xs bg-background p-3 rounded-lg border max-h-[300px] overflow-y-auto">
                {pipelineState.stageResults[completedStages - 1].finalOutput}
              </pre>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => {
                  const allOutput = pipelineState.stageResults
                    .map(r => `${'='.repeat(40)}\n${r.stageName}\n${'='.repeat(40)}\n\n${r.finalOutput}`)
                    .join('\n\n');
                  handleDownload(allOutput, `${pipeline.id}-output.txt`);
                }}
              >
                <Download className="h-3 w-3 mr-1" /> Download All
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Full mode
  return (
    <div className="space-y-4">
      {/* Overall Pipeline Progress */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="flex items-center gap-2">
                {pipeline.icon} {pipeline.name}
              </span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode(viewMode === 'summary' ? 'detailed' : 'summary')}
              >
                {viewMode === 'summary' ? (
                  <><Maximize2 className="h-4 w-4 mr-1" /> Detailed</>
                ) : (
                  <><Minimize2 className="h-4 w-4 mr-1" /> Summary</>
                )}
              </Button>
              <span className="text-sm font-normal text-muted-foreground">
                Stage {Math.min(pipelineState.currentStageIndex + 1, totalStages)} of {totalStages}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={overallProgress} className="h-2 mb-3" />
          
          {/* Stage indicators */}
          <div className="flex gap-1.5 flex-wrap">
            {pipeline.stages.map((stage, i) => {
              const meta = STAGE_TYPE_META[stage.type];
              const isComplete = i < completedStages;
              const isCurrent = i === pipelineState.currentStageIndex && pipelineState.isRunning;
              const isPending = i > pipelineState.currentStageIndex || (!pipelineState.isRunning && i >= completedStages);

              return (
                <div
                  key={stage.id}
                  className={`
                    flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all
                    ${isComplete ? `${stageColorBg[meta.color]} ${stageColorText[meta.color]}` : ''}
                    ${isCurrent ? `${stageColorBg[meta.color]} ${stageColorText[meta.color]} ring-1 ring-current animate-pulse-subtle` : ''}
                    ${isPending ? 'bg-muted text-muted-foreground' : ''}
                  `}
                >
                  {isComplete && '✓ '}
                  {isCurrent && '● '}
                  {meta.label}
                  {isCurrent && ` (round ${pipelineState.currentRoundInStage})`}
                </div>
              );
            })}
          </div>

          {pipelineState.error && (
            <div className="flex items-center gap-2 text-sm text-destructive mt-3">
              <AlertTriangle className="h-4 w-4" />
              <span>{pipelineState.error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stage Results */}
      {viewMode === 'detailed' && pipelineState.stageResults.map((stageResult, stageIndex) => {
        const stageConfig = pipeline.stages[stageIndex];
        const meta = STAGE_TYPE_META[stageResult.stageType];
        const isExpanded = expandedStages.has(stageIndex);
        const borderColor = stageColorBorder[meta.color] || 'border-l-gray-500';

        return (
          <Card key={stageResult.stageId} className={`border-l-4 ${borderColor}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle
                  className="text-base flex items-center gap-2 cursor-pointer"
                  onClick={() => toggleStage(stageIndex)}
                >
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <span className={stageColorText[meta.color]}>{meta.label}</span>
                  <span className="text-foreground">{stageResult.stageName}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    ({stageResult.documents.length} round{stageResult.documents.length !== 1 ? 's' : ''})
                  </span>
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleCopy(stageResult.finalOutput, stageResult.stageName)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDownload(stageResult.finalOutput, `${stageResult.stageId}-output.txt`)}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {stageResult.convergenceReason && (
                <p className="text-xs text-muted-foreground">
                  Completed: {stageResult.convergenceReason}
                </p>
              )}
              {stageResult.tokenUsage && stageResult.tokenUsage.total.estimatedCost > 0 && (
                <p className="text-xs text-muted-foreground">
                  Cost: {formatCost(stageResult.tokenUsage.total.estimatedCost)} · 
                  Tokens: {stageResult.tokenUsage.total.totalTokens.toLocaleString()}
                </p>
              )}
            </CardHeader>

            {isExpanded && (
              <CardContent>
                <Tabs defaultValue="output" className="space-y-3">
                  <TabsList>
                    <TabsTrigger value="output">Final output</TabsTrigger>
                    <TabsTrigger value="rounds">Rounds ({stageResult.documents.length})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="output">
                    <pre className="whitespace-pre-wrap text-sm bg-muted/50 p-4 rounded-lg max-h-[500px] overflow-y-auto">
                      {stageResult.finalOutput}
                    </pre>
                  </TabsContent>

                  <TabsContent value="rounds">
                    <div className="space-y-3">
                      {stageResult.documents.map((doc) => {
                        const roundKey = `${stageIndex}-${doc.round}`;
                        const isRoundExpanded = expandedRounds.has(roundKey);

                        return (
                          <Card key={roundKey} className="border">
                            <CardHeader className="py-3 px-4">
                              <div className="flex items-center justify-between">
                                <CardTitle
                                  className="text-sm flex items-center gap-2 cursor-pointer"
                                  onClick={() => toggleRound(roundKey)}
                                >
                                  {isRoundExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                  Round {doc.round}
                                </CardTitle>
                                <span className="text-xs text-muted-foreground">{doc.changeLog}</span>
                              </div>
                            </CardHeader>

                            {isRoundExpanded && (
                              <CardContent className="px-4 pb-4">
                                <Tabs defaultValue="composite" className="space-y-2">
                                  <TabsList className="h-8">
                                    <TabsTrigger value="composite" className="text-xs">Composite</TabsTrigger>
                                    <TabsTrigger value="contributions" className="text-xs">
                                      Models ({doc.modelContributions.length})
                                    </TabsTrigger>
                                  </TabsList>

                                  <TabsContent value="composite">
                                    <pre className="whitespace-pre-wrap text-xs bg-muted/30 p-3 rounded-lg max-h-[300px] overflow-y-auto">
                                      {doc.compositePlan}
                                    </pre>
                                  </TabsContent>

                                  <TabsContent value="contributions">
                                    <div className="space-y-2">
                                      {doc.modelContributions.map((contrib, ci) => (
                                        <div key={ci} className="border rounded-lg p-3">
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium">{contrib.model}</span>
                                            {contrib.analysis.viabilityScore && (
                                              <span className="text-xs text-muted-foreground">
                                                Score: {contrib.analysis.viabilityScore}/10
                                              </span>
                                            )}
                                          </div>
                                          <pre className="whitespace-pre-wrap text-xs bg-muted/20 p-2 rounded max-h-[200px] overflow-y-auto">
                                            {contrib.revisedPlan}
                                          </pre>
                                        </div>
                                      ))}
                                    </div>
                                  </TabsContent>
                                </Tabs>
                              </CardContent>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            )}
          </Card>
        );
      })}

      {/* Summary view - just final outputs */}
      {viewMode === 'summary' && pipelineState.stageResults.length > 0 && (
        <div className="space-y-3">
          {pipelineState.stageResults.map((stageResult, index) => {
            const meta = STAGE_TYPE_META[stageResult.stageType];
            return (
              <Card key={stageResult.stageId} className={`border-l-4 ${stageColorBorder[meta.color]}`}>
                <CardHeader className="py-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <span className={stageColorText[meta.color]}>{meta.label}</span>
                      <span>{stageResult.stageName}</span>
                    </CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7"
                      onClick={() => handleCopy(stageResult.finalOutput, stageResult.stageName)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="whitespace-pre-wrap text-sm bg-muted/50 p-3 rounded-lg max-h-[200px] overflow-y-auto">
                    {stageResult.finalOutput.substring(0, 500)}
                    {stageResult.finalOutput.length > 500 && '...'}
                  </pre>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Final Output Card — shown when pipeline completes */}
      {!pipelineState.isRunning && completedStages === totalStages && completedStages > 0 && (
        <Card className="border-2 border-green-500/30 bg-green-50/50 dark:bg-green-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
              ✓ Pipeline Complete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <pre className="whitespace-pre-wrap text-sm bg-background p-4 rounded-lg border max-h-[500px] overflow-y-auto">
              {pipelineState.stageResults[completedStages - 1].finalOutput}
            </pre>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(pipelineState.stageResults[completedStages - 1].finalOutput, 'Final output')}
              >
                <Copy className="h-4 w-4 mr-2" /> Copy final output
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const allOutput = pipelineState.stageResults
                    .map(r => `${'='.repeat(60)}\n${r.stageName} (${r.stageType})\n${'='.repeat(60)}\n\n${r.finalOutput}`)
                    .join('\n\n\n');
                  handleDownload(allOutput, `${pipeline.id}-full-output.txt`);
                }}
              >
                <Download className="h-4 w-4 mr-2" /> Download all stages
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
