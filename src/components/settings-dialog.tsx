import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Settings, ExternalLink, Sparkles, Wallet, AlertTriangle } from 'lucide-react';
import { AppSettings, AIProvider } from '../types';
import { 
  PROVIDER_INFO, 
  getProviderDocsUrl, 
  getFreeTierInfo,
  getFreeModels,
  requiresApiKey 
} from '../data/provider-pricing';

interface SettingsDialogProps {
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
}

export function SettingsDialog({ settings, onSettingsChange }: SettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [activeTab, setActiveTab] = useState<'providers' | 'preferences'>('providers');

  useEffect(() => { setLocalSettings(settings); }, [settings]);

  const handleSave = () => {
    onSettingsChange(localSettings);
    setOpen(false);
  };

  const handleApiKeyChange = (provider: AIProvider, value: string) => {
    setLocalSettings(prev => ({
      ...prev,
      apiKeys: { ...prev.apiKeys, [provider]: value }
    }));
  };

  const configuredCount = Object.values(localSettings.apiKeys).filter(k => k && k.trim().length > 0).length;
  const freeProvidersCount = Object.values(AIProvider).filter(p => !requiresApiKey(p)).length;

  // Group providers by free/paid
  const freeProviders = Object.values(AIProvider).filter(p => !requiresApiKey(p));
  const paidProviders = Object.values(AIProvider).filter(p => requiresApiKey(p));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Settings className="h-4 w-4" />
          {configuredCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-green-500 text-[10px] text-white flex items-center justify-center">
              {configuredCount}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure AI providers and application preferences
          </DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg mb-4">
          <button
            onClick={() => setActiveTab('providers')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'providers' ? 'bg-background shadow-sm' : 'hover:bg-muted-foreground/10'
            }`}
          >
            <Settings className="h-4 w-4" />
            API Keys
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'preferences' ? 'bg-background shadow-sm' : 'hover:bg-muted-foreground/10'
            }`}
          >
            <Wallet className="h-4 w-4" />
            Preferences
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pr-2">
          {activeTab === 'providers' ? (
            <div className="space-y-6">
              {/* Free Providers Section */}
              <div>
                <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-green-500" />
                  Free Providers
                  <span className="text-xs text-muted-foreground">({freeProvidersCount} available)</span>
                </h3>
                <div className="space-y-3">
                  {freeProviders.map((provider) => {
                    const info = PROVIDER_INFO[provider];
                    return (
                      <div key={provider} className="p-3 bg-green-50/50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">{info.name}</span>
                            <p className="text-xs text-muted-foreground">{info.description}</p>
                          </div>
                          <a
                            href={getProviderDocsUrl(provider)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-green-600 hover:underline flex items-center gap-1"
                          >
                            Setup <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                        <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                          {getFreeTierInfo(provider)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Paid Providers Section */}
              <div>
                <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
                  <Wallet className="h-4 w-4" />
                  Paid Providers
                  <span className="text-xs text-muted-foreground">(API key required)</span>
                </h3>
                <div className="space-y-3">
                  {paidProviders.map((provider) => {
                    const info = PROVIDER_INFO[provider];
                    const hasKey = localSettings.apiKeys[provider]?.trim().length > 0;
                    
                    return (
                      <div key={provider} className={`p-3 rounded-lg border ${hasKey ? 'bg-green-50/30 border-green-200' : 'bg-muted/30'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${info.color}`}>
                              {info.name}
                            </span>
                            {hasKey && (
                              <span className="text-xs text-green-600 flex items-center gap-1">
                                ✓ Configured
                              </span>
                            )}
                          </div>
                          <a
                            href={getProviderDocsUrl(provider)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                          >
                            Get key <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{info.description}</p>
                        <div className="space-y-1.5">
                          <Input
                            type="password"
                            value={localSettings.apiKeys[provider] || ''}
                            onChange={(e) => handleApiKeyChange(provider, e.target.value)}
                            placeholder={`${info.name} API key`}
                            className="text-sm"
                          />
                          <p className="text-xs text-muted-foreground">
                            {getFreeTierInfo(provider)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Security Note */}
              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  API keys are stored in your browser's localStorage and used client-side. 
                  This is fine for personal use. For production deployments, use a backend proxy.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Cost Preferences */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Cost Control</h3>
                
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <Label htmlFor="prefer-free" className="font-medium cursor-pointer">
                      Prefer Free Models
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Show free models first in the selector
                    </p>
                  </div>
                  <Switch
                    id="prefer-free"
                    checked={localSettings.preferredFreeModels ?? true}
                    onCheckedChange={(checked) => 
                      setLocalSettings(prev => ({ ...prev, preferredFreeModels: checked }))
                    }
                  />
                </div>

                <div className="p-3 bg-muted rounded-lg">
                  <Label htmlFor="max-cost" className="font-medium">
                    Max Cost Per Request
                  </Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Warn when estimated cost exceeds this amount (0 = no limit)
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">$</span>
                    <Input
                      id="max-cost"
                      type="number"
                      min="0"
                      step="0.01"
                      value={localSettings.maxCostPerRequest || ''}
                      onChange={(e) => 
                        setLocalSettings(prev => ({ 
                          ...prev, 
                          maxCostPerRequest: parseFloat(e.target.value) || undefined 
                        }))
                      }
                      placeholder="No limit"
                      className="w-32"
                    />
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="text-sm font-medium mb-2">Available Models</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Free models:</span>
                    <span className="font-medium text-green-600">{getFreeModels().length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total providers:</span>
                    <span className="font-medium">{Object.keys(AIProvider).length}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Settings</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
