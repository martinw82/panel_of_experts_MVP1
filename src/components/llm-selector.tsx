import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { 
  Zap, 
  Sparkles, 
  DollarSign, 
  Search, 
  Filter,
  Info,
  ExternalLink,
  Check,
  Wallet
} from 'lucide-react';
import { 
  MODEL_PRICING, 
  AIProvider, 
  PROVIDER_INFO, 
  ModelPricing,
  formatCost,
  getFreeModels,
  getProviderDocsUrl,
  getFreeTierInfo
} from '../data/provider-pricing';
import { ModelDetail } from '../types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

type FilterType = 'all' | 'free' | 'paid';
type SortType = 'default' | 'cost' | 'provider';

interface LLMSelectorProps {
  selectedModels: ModelDetail[];
  onSelectionChange: (selected: ModelDetail[]) => void;
  inputText?: string; // For cost estimation
  compact?: boolean; // For embedded mode
}

export function LLMSelector({ 
  selectedModels, 
  onSelectionChange, 
  inputText = '',
  compact = false 
}: LLMSelectorProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('default');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFreeOnly, setShowFreeOnly] = useState(false);

  // Estimate cost for a single model
  const estimateModelCost = (model: ModelPricing): string => {
    if (model.isFree) return 'FREE';
    const inputCost = (1000 / 1_000_000) * model.costPer1MInput;
    const outputCost = (3000 / 1_000_000) * model.costPer1MOutput; // Assume 3x output
    return `~${formatCost(inputCost + outputCost)}/req`;
  };

  // Calculate estimated cost for current selection
  const estimatedCost = useMemo(() => {
    if (!inputText || selectedModels.length === 0) return null;
    
    const inputTokens = Math.ceil(inputText.length / 4); // Rough estimate
    const outputTokens = inputTokens * 3; // Assume 3x output
    
    let totalCost = 0;
    let hasFree = false;
    let hasPaid = false;
    
    for (const model of selectedModels) {
      const pricing = MODEL_PRICING.find(p => p.identifier === model.identifier);
      if (pricing) {
        if (pricing.isFree) {
          hasFree = true;
        } else {
          hasPaid = true;
          const modelCost = (inputTokens / 1_000_000) * pricing.costPer1MInput +
                           (outputTokens / 1_000_000) * pricing.costPer1MOutput;
          totalCost += modelCost;
        }
      }
    }
    
    return {
      total: totalCost,
      formatted: formatCost(totalCost),
      isFree: !hasPaid && hasFree,
      isMixed: hasFree && hasPaid,
    };
  }, [selectedModels, inputText]);

  // Filter and sort models
  const filteredModels = useMemo(() => {
    let models = [...MODEL_PRICING];
    
    // Apply filter
    if (filter === 'free' || showFreeOnly) {
      models = models.filter(m => m.isFree);
    } else if (filter === 'paid') {
      models = models.filter(m => !m.isFree);
    }
    
    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      models = models.filter(m => 
        m.name.toLowerCase().includes(query) ||
        m.provider.toLowerCase().includes(query) ||
        m.features.some(f => f.toLowerCase().includes(query))
      );
    }
    
    // Apply sort
    if (sortBy === 'cost') {
      models.sort((a, b) => (a.costPer1MInput + a.costPer1MOutput) - (b.costPer1MInput + b.costPer1MOutput));
    } else if (sortBy === 'provider') {
      models.sort((a, b) => a.provider.localeCompare(b.provider));
    }
    
    return models;
  }, [filter, sortBy, searchQuery, showFreeOnly]);

  // Group by provider
  const groupedModels = useMemo(() => {
    const groups: Record<string, ModelPricing[]> = {};
    for (const model of filteredModels) {
      if (!groups[model.provider]) groups[model.provider] = [];
      groups[model.provider].push(model);
    }
    return groups;
  }, [filteredModels]);

  const handleToggle = (model: ModelPricing) => {
    const modelDetail: ModelDetail = {
      name: model.name,
      provider: model.provider,
      identifier: model.identifier,
      costPer1MInput: model.costPer1MInput,
      costPer1MOutput: model.costPer1MOutput,
      isFree: model.isFree,
    };
    
    const isSelected = selectedModels.some(s => s.identifier === model.identifier);
    if (isSelected) {
      onSelectionChange(selectedModels.filter(s => s.identifier !== model.identifier));
    } else {
      onSelectionChange([...selectedModels, modelDetail]);
    }
  };

  const selectAllFree = () => {
    const freeModels = getFreeModels();
    onSelectionChange(freeModels.map(m => ({
      name: m.name,
      provider: m.provider,
      identifier: m.identifier,
      costPer1MInput: m.costPer1MInput,
      costPer1MOutput: m.costPer1MOutput,
      isFree: true,
    })));
  };

  const clearAll = () => {
    onSelectionChange([]);
  };

  const freeCount = selectedModels.filter(m => m.isFree).length;
  const paidCount = selectedModels.filter(m => !m.isFree).length;

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterType)}
            className="text-sm bg-transparent border rounded px-2 py-1"
          >
            <option value="all">All Models</option>
            <option value="free">Free Only</option>
            <option value="paid">Paid Only</option>
          </select>
          {selectedModels.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAll} className="h-7 text-xs">
              Clear
            </Button>
          )}
        </div>
        
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {filteredModels.map((model) => {
            const isSelected = selectedModels.some(s => s.identifier === model.identifier);
            return (
              <div 
                key={model.identifier} 
                className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                  isSelected ? 'bg-primary/10' : 'hover:bg-muted'
                }`}
                onClick={() => handleToggle(model)}
              >
                <div className="flex items-center gap-2">
                  <Checkbox checked={isSelected} />
                  <span className="text-sm">{model.name}</span>
                </div>
                {model.isFree ? (
                  <Badge variant="default" className="bg-green-500 text-xs">FREE</Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">{estimateModelCost(model)}</span>
                )}
              </div>
            );
          })}
        </div>
        
        {selectedModels.length > 0 && (
          <div className="text-xs text-muted-foreground">
            {selectedModels.length} selected ({freeCount} free{paidCount > 0 ? `, ${paidCount} paid` : ''})
          </div>
        )}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Search and Filter Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterType)}
            className="text-sm border rounded-md px-3 py-2 bg-background"
          >
            <option value="all">All</option>
            <option value="free">Free</option>
            <option value="paid">Paid</option>
          </select>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 flex-wrap">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={selectAllFree}
            className="text-xs"
          >
            <Zap className="h-3 w-3 mr-1 text-green-500" />
            Select All Free
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowFreeOnly(!showFreeOnly)}
            className={`text-xs ${showFreeOnly ? 'bg-green-50 border-green-200' : ''}`}
          >
            <Sparkles className="h-3 w-3 mr-1" />
            {showFreeOnly ? 'Show All' : 'Free Only'}
          </Button>
          {selectedModels.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearAll}
              className="text-xs"
            >
              Clear ({selectedModels.length})
            </Button>
          )}
        </div>

        {/* Cost Estimate */}
        {estimatedCost && (
          <Card className={`${estimatedCost.isFree ? 'bg-green-50/50 border-green-200' : 'bg-muted/30'}`}>
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className={`h-4 w-4 ${estimatedCost.isFree ? 'text-green-600' : 'text-amber-600'}`} />
                  <span className="text-sm font-medium">Estimated Cost</span>
                </div>
                <div className="text-right">
                  <span className={`text-lg font-bold ${estimatedCost.isFree ? 'text-green-600' : ''}`}>
                    {estimatedCost.formatted}
                  </span>
                  {estimatedCost.isMixed && (
                    <span className="text-xs text-muted-foreground block">
                      (free + paid models)
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Based on ~{Math.ceil((inputText?.length || 0) / 4 * 4 / 1000)}K tokens total
              </p>
            </CardContent>
          </Card>
        )}

        {/* Provider Groups */}
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
          {Object.entries(groupedModels).map(([provider, models]) => {
            const providerInfo = PROVIDER_INFO[provider as AIProvider];
            const providerSelectedCount = selectedModels.filter(m => m.provider === provider).length;
            
            return (
              <Card key={provider} className="overflow-hidden">
                <CardHeader className="py-3 px-4 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${providerInfo.color}`}>
                        {providerInfo.name}
                      </span>
                      {models.some(m => m.isFree) && (
                        <Badge variant="default" className="bg-green-500 text-[10px] h-5">
                          FREE TIER
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {providerSelectedCount > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {providerSelectedCount} selected
                        </span>
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <a 
                            href={getProviderDocsUrl(provider as AIProvider)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Get API key</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {providerInfo.description}
                  </p>
                </CardHeader>
                <CardContent className="p-3 space-y-1">
                  {models.map((model) => {
                    const isSelected = selectedModels.some(s => s.identifier === model.identifier);
                    return (
                      <div 
                        key={model.identifier}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                          isSelected ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50'
                        }`}
                        onClick={() => handleToggle(model)}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox 
                            checked={isSelected} 
                            className="mt-0.5"
                          />
                          <div>
                            <Label className="text-sm cursor-pointer font-medium">
                              {model.name}
                            </Label>
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {model.features.map((feature, i) => (
                                <span key={i} className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                  {feature}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          {model.isFree ? (
                            <Badge className="bg-green-500 hover:bg-green-600">
                              FREE
                            </Badge>
                          ) : (
                            <div className="text-xs">
                              <div className="font-medium">{formatCost(model.costPer1MInput)}/{formatCost(model.costPer1MOutput)}</div>
                              <div className="text-muted-foreground">in/out per M</div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Selected Summary */}
        {selectedModels.length > 0 && (
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Selected Models ({selectedModels.length})</span>
                {freeCount > 0 && (
                  <Badge variant="default" className="bg-green-500">
                    {freeCount} Free
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-1 max-h-[150px] overflow-y-auto">
                {selectedModels.map(m => {
                  const pricing = MODEL_PRICING.find(p => p.identifier === m.identifier);
                  return (
                    <div key={m.identifier} className="flex items-center justify-between text-sm">
                      <span className="truncate flex-1">{m.name}</span>
                      {pricing?.isFree ? (
                        <span className="text-green-600 text-xs font-medium">FREE</span>
                      ) : (
                        <span className="text-muted-foreground text-xs">
                          {formatCost(pricing?.costPer1MInput || 0)}/M
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Free Providers Info */}
        <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3 border border-green-200 dark:border-green-800">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-green-600 mt-0.5" />
            <div className="text-xs text-green-800 dark:text-green-200">
              <p className="font-medium">Free Tier Options:</p>
              <ul className="mt-1 space-y-0.5 list-disc list-inside">
                <li><strong>Groq:</strong> 20 req/min, 1M tokens/min free</li>
                <li><strong>Gemini:</strong> 1500 requests/day free tier</li>
                <li><strong>OpenRouter:</strong> Limited free daily requests</li>
                <li><strong>Ollama:</strong> Run models locally for free</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

// Simple badge component for use in this file
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
