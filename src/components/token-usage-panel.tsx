import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  Wallet, 
  Coins, 
  Clock, 
  TrendingUp, 
  Download,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles
} from 'lucide-react';
import { 
  TokenUsage, 
  StageTokenUsage, 
  PipelineTokenUsage,
  PipelineState 
} from '../types';
import { formatCost, formatTokens } from '../data/provider-pricing';

interface TokenUsagePanelProps {
  pipelineState: PipelineState;
  compact?: boolean;
}

export function TokenUsagePanel({ pipelineState, compact = false }: TokenUsagePanelProps) {
  const { tokenUsage, isRunning, currentStageIndex } = pipelineState;
  
  if (!tokenUsage && !isRunning) {
    return compact ? null : (
      <Card className="bg-muted/30">
        <CardContent className="py-6 text-center">
          <Coins className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Token usage will appear here when you run a pipeline
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate current session totals
  const grandTotal = tokenUsage?.grandTotal;
  const isFreeSession = grandTotal && grandTotal.estimatedCost === 0;
  
  // Calculate duration
  const duration = tokenUsage?.completedAt && tokenUsage?.startedAt
    ? Math.round((tokenUsage.completedAt - tokenUsage.startedAt) / 1000)
    : tokenUsage?.startedAt
    ? Math.round((Date.now() - tokenUsage.startedAt) / 1000)
    : 0;
  
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const handleExport = () => {
    if (!tokenUsage) return;
    
    const data = {
      summary: {
        totalTokens: grandTotal?.totalTokens || 0,
        totalCost: grandTotal?.estimatedCost || 0,
        duration: duration,
        stages: tokenUsage.stages.length,
      },
      stages: tokenUsage.stages.map(s => ({
        stage: s.stageName,
        inputTokens: s.total.promptTokens,
        outputTokens: s.total.completionTokens,
        totalTokens: s.total.totalTokens,
        cost: s.total.estimatedCost,
        models: Object.entries(s.perModel).map(([id, usage]) => ({
          model: id,
          tokens: usage.totalTokens,
          cost: usage.estimatedCost,
        })),
      })),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `token-usage-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Session Cost:</span>
          <span className={`font-bold ${isFreeSession ? 'text-green-600' : ''}`}>
            {grandTotal ? formatCost(grandTotal.estimatedCost) : '$0.000'}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Tokens:</span>
          <span className="font-medium">
            {grandTotal ? formatTokens(grandTotal.totalTokens) : '0'}
          </span>
        </div>
        {isRunning && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Stage {currentStageIndex + 1}...</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Stats Card */}
      <Card className={`${isFreeSession ? 'bg-green-50/50 border-green-200' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Token Usage
            </CardTitle>
            {isFreeSession && (
              <Badge className="bg-green-500">
                <Sparkles className="h-3 w-3 mr-1" />
                FREE SESSION
              </Badge>
            )}
            {isRunning && (
              <Badge variant="secondary" className="animate-pulse">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Running
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${isFreeSession ? 'text-green-600' : ''}`}>
                {grandTotal ? formatCost(grandTotal.estimatedCost) : '$0.000'}
              </div>
              <div className="text-xs text-muted-foreground">Total Cost</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {grandTotal ? formatTokens(grandTotal.totalTokens) : '0'}
              </div>
              <div className="text-xs text-muted-foreground">Total Tokens</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {formatDuration(duration)}
              </div>
              <div className="text-xs text-muted-foreground">Duration</div>
            </div>
          </div>
          
          {grandTotal && grandTotal.totalTokens > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Input / Output split:</span>
                <span>
                  {formatTokens(grandTotal.promptTokens)} / {formatTokens(grandTotal.completionTokens)}
                </span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full mt-2 overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all"
                  style={{ 
                    width: `${(grandTotal.promptTokens / grandTotal.totalTokens) * 100}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Input</span>
                <span>Output</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stage Breakdown */}
      {tokenUsage && tokenUsage.stages.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Stage Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tokenUsage.stages.map((stage, index) => (
              <StageUsageItem 
                key={stage.stageId} 
                stage={stage} 
                index={index}
                isCurrent={isRunning && index === currentStageIndex}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Current Stage (if running) */}
      {isRunning && pipelineState.stageResults.length === currentStageIndex && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-amber-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="font-medium">Stage {currentStageIndex + 1} in progress...</span>
            </div>
            <p className="text-xs text-amber-600 mt-1">
              Token usage will be calculated when stage completes
            </p>
          </CardContent>
        </Card>
      )}

      {/* Export Button */}
      {tokenUsage && tokenUsage.stages.length > 0 && (
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={handleExport}
        >
          <Download className="h-4 w-4 mr-2" />
          Export Usage Report
        </Button>
      )}
    </div>
  );
}

function StageUsageItem({ 
  stage, 
  index,
  isCurrent 
}: { 
  stage: StageTokenUsage; 
  index: number;
  isCurrent: boolean;
}) {
  const isFree = stage.total.estimatedCost === 0;
  const modelCount = Object.keys(stage.perModel).length;
  
  return (
    <div className={`p-3 rounded-lg border ${isCurrent ? 'border-amber-300 bg-amber-50/50' : 'bg-muted/30'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">#{index + 1}</span>
          <span className="font-medium text-sm">{stage.stageName}</span>
          {isCurrent && (
            <Loader2 className="h-3 w-3 animate-spin text-amber-600" />
          )}
        </div>
        <div className="text-right">
          <span className={`text-sm font-bold ${isFree ? 'text-green-600' : ''}`}>
            {formatCost(stage.total.estimatedCost)}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Tokens:</span>
          <span className="font-medium">{formatTokens(stage.total.totalTokens)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Models:</span>
          <span className="font-medium">{modelCount}</span>
        </div>
      </div>
      
      {/* Per-model breakdown (collapsible) */}
      {modelCount > 0 && (
        <div className="mt-2 pt-2 border-t border-dashed">
          <div className="space-y-1">
            {Object.entries(stage.perModel).map(([modelId, usage]) => (
              <div key={modelId} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground truncate max-w-[150px]">
                  {modelId.split('/').pop()?.split(':')[0]}
                </span>
                <span className={usage.estimatedCost === 0 ? 'text-green-600' : ''}>
                  {formatTokens(usage.totalTokens)} · {formatCost(usage.estimatedCost)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Simple badge component
function Badge({ 
  children, 
  variant = 'default', 
  className = '' 
}: { 
  children: React.ReactNode; 
  variant?: 'default' | 'secondary' | 'outline';
  className?: string;
}) {
  const baseClasses = 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium';
  const variantClasses = {
    default: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    outline: 'border border-input bg-background',
  };
  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}
