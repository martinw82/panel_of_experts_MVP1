/**
 * Plugin API for embedding Panel of Experts in dashboards
 * 
 * Usage:
 * 
 * 1. Embed via iframe:
 *    <iframe src="https://your-domain.com/?embed=1&compact=1&pipeline=code"></iframe>
 * 
 * 2. Listen for events:
 *    window.addEventListener('message', (e) => {
 *      if (e.data.type === 'panel-of-experts:complete') {
 *        console.log('Output:', e.data.payload.output);
 *      }
 *    });
 * 
 * 3. Send commands (optional):
 *    iframe.contentWindow.postMessage({
 *      type: 'panel-of-experts:command',
 *      command: 'reset'
 *    }, '*');
 */

import { EmbedConfig } from '../types';

/**
 * Parse embed configuration from URL search params
 */
export function parseEmbedConfig(params: URLSearchParams): EmbedConfig {
  const modelsParam = params.get('models');
  
  return {
    embed: params.get('embed') === '1' || params.get('embed') === 'true',
    compact: params.get('compact') === '1' || params.get('compact') === 'true',
    hideHeader: params.get('hideHeader') === '1' || params.get('hideHeader') === 'true',
    hideSidebar: params.get('hideSidebar') === '1' || params.get('hideSidebar') === 'true',
    pipeline: params.get('pipeline') || undefined,
    models: modelsParam ? modelsParam.split(',').filter(Boolean) : undefined,
    autoRun: params.get('autoRun') === '1' || params.get('autoRun') === 'true',
  };
}

/**
 * Build embed URL with configuration
 */
export function buildEmbedUrl(
  baseUrl: string,
  config: Partial<EmbedConfig>
): string {
  const params = new URLSearchParams();
  
  if (config.embed) params.set('embed', '1');
  if (config.compact) params.set('compact', '1');
  if (config.hideHeader) params.set('hideHeader', '1');
  if (config.hideSidebar) params.set('hideSidebar', '1');
  if (config.pipeline) params.set('pipeline', config.pipeline);
  if (config.models?.length) params.set('models', config.models.join(','));
  if (config.autoRun) params.set('autoRun', '1');
  
  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Message types for parent-child communication
 */
export const PLUGIN_MESSAGE_TYPES = {
  // Child -> Parent
  READY: 'panel-of-experts:ready',
  STARTED: 'panel-of-experts:started',
  PROGRESS: 'panel-of-experts:progress',
  STAGE_COMPLETE: 'panel-of-experts:stage-complete',
  COMPLETE: 'panel-of-experts:complete',
  ERROR: 'panel-of-experts:error',
  TOKEN_USAGE: 'panel-of-experts:token-usage',
  
  // Parent -> Child
  COMMAND: 'panel-of-experts:command',
} as const;

/**
 * Send a message to the parent window
 */
export function notifyParent(type: string, payload: unknown): void {
  if (window.parent !== window) {
    window.parent.postMessage({ type, payload }, '*');
  }
}

/**
 * Payload types for each message
 */
export interface PluginPayloads {
  [PLUGIN_MESSAGE_TYPES.READY]: {
    version: string;
    capabilities: string[];
  };
  [PLUGIN_MESSAGE_TYPES.STARTED]: {
    pipelineId: string;
    pipelineName: string;
    stageCount: number;
    models: string[];
    estimatedCost: number;
  };
  [PLUGIN_MESSAGE_TYPES.PROGRESS]: {
    stageIndex: number;
    stageName: string;
    stageType: string;
    round: number;
    totalStages: number;
  };
  [PLUGIN_MESSAGE_TYPES.STAGE_COMPLETE]: {
    stageIndex: number;
    stageName: string;
    output: string;
    tokenUsage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
      estimatedCost: number;
    };
  };
  [PLUGIN_MESSAGE_TYPES.COMPLETE]: {
    pipelineId: string;
    output: string;
    stages: number;
    tokens: {
      prompt: number;
      completion: number;
      total: number;
    };
    cost: number;
    duration: number; // milliseconds
  };
  [PLUGIN_MESSAGE_TYPES.ERROR]: {
    stage?: number;
    error: string;
    recoverable: boolean;
  };
  [PLUGIN_MESSAGE_TYPES.TOKEN_USAGE]: {
    stage?: number;
    cumulativeTokens: number;
    cumulativeCost: number;
  };
}

/**
 * Commands that can be sent from parent to child
 */
export type PluginCommand = 
  | { command: 'reset' }
  | { command: 'stop' }
  | { command: 'set-input'; text: string }
  | { command: 'set-pipeline'; pipelineId: string }
  | { command: 'set-models'; models: string[] }
  | { command: 'run' };

/**
 * Listen for commands from parent window
 */
export function onParentCommand(
  handler: (command: PluginCommand) => void
): () => void {
  const listener = (event: MessageEvent) => {
    // Only accept messages from parent
    if (event.source !== window.parent) return;
    
    if (event.data?.type === PLUGIN_MESSAGE_TYPES.COMMAND) {
      handler(event.data.command as PluginCommand);
    }
  };
  
  window.addEventListener('message', listener);
  return () => window.removeEventListener('message', listener);
}

/**
 * React hook for plugin integration (to be used in parent dashboard)
 */
export function usePanelOfExperts(
  iframeRef: React.RefObject<HTMLIFrameElement>
) {
  const sendCommand = (command: PluginCommand) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: PLUGIN_MESSAGE_TYPES.COMMAND, command },
        '*'
      );
    }
  };

  const reset = () => sendCommand({ command: 'reset' });
  const stop = () => sendCommand({ command: 'stop' });
  const setInput = (text: string) => sendCommand({ command: 'set-input', text });
  const setPipeline = (pipelineId: string) => sendCommand({ command: 'set-pipeline', pipelineId });
  const setModels = (models: string[]) => sendCommand({ command: 'set-models', models });
  const run = () => sendCommand({ command: 'run' });

  return {
    reset,
    stop,
    setInput,
    setPipeline,
    setModels,
    run,
  };
}

/**
 * Generate embed code for dashboard integration
 */
export function generateEmbedCode(
  baseUrl: string,
  config: Partial<EmbedConfig>
): string {
  const url = buildEmbedUrl(baseUrl, config);
  
  return `<!-- Panel of Experts Embed -->
<iframe 
  id="panel-of-experts"
  src="${url}"
  width="100%"
  height="800"
  frameborder="0"
  allow="clipboard-write"
></iframe>

<script>
  // Listen for completion
  window.addEventListener('message', (e) => {
    if (e.data.type === 'panel-of-experts:complete') {
      console.log('Pipeline complete:', e.data.payload);
      // Handle the output
    }
  });
  
  // Optional: Send commands
  const iframe = document.getElementById('panel-of-experts');
  // iframe.contentWindow.postMessage({
  //   type: 'panel-of-experts:command',
  //   command: { command: 'run' }
  // }, '*');
</script>`;
}

/**
 * Documentation for integration
 */
export const INTEGRATION_DOCS = `
# Panel of Experts - Dashboard Integration

## Quick Start

1. Embed the tool in your dashboard:
   \`\`\`html
   <iframe 
     src="https://your-domain.com/?embed=1&compact=1"
     width="100%"
     height="800"
   ></iframe>
   \`\`\`

2. Listen for completion:
   \`\`\`javascript
   window.addEventListener('message', (e) => {
     if (e.data.type === 'panel-of-experts:complete') {
       console.log(e.data.payload.output);
     }
   });
   \`\`\`

## URL Parameters

- \`embed=1\` - Enable embed mode (required)
- \`compact=1\` - Compact UI for smaller spaces
- \`hideHeader=1\` - Hide the header bar
- \`hideSidebar=1\` - Hide the config sidebar
- \`pipeline=code\` - Pre-select a pipeline
- \`models=gpt-4o-mini,claude-haiku\` - Pre-select models
- \`autoRun=1\` - Auto-start if input is provided

## Events

### panel-of-experts:ready
Fired when the tool is loaded and ready.

### panel-of-experts:started
Fired when a pipeline starts running.

### panel-of-experts:progress
Fired on each stage/round progress.

### panel-of-experts:stage-complete
Fired when a stage completes.

### panel-of-experts:complete
Fired when the entire pipeline completes. Contains final output.

### panel-of-experts:error
Fired on errors.

## Commands (Parent → Child)

Send commands via postMessage:

\`\`\`javascript
iframe.contentWindow.postMessage({
  type: 'panel-of-experts:command',
  command: { command: 'run' }
}, '*');
\`\`\`

Available commands:
- \`reset\` - Reset the pipeline
- \`stop\` - Stop the current run
- \`set-input\` - Set the input text
- \`set-pipeline\` - Change the pipeline
- \`set-models\` - Change the models
- \`run\` - Start the pipeline
`;

// Version for compatibility checks
export const PLUGIN_VERSION = '1.0.0';
export const PLUGIN_CAPABILITIES = [
  'multi-stage-pipelines',
  'multi-model',
  'token-tracking',
  'cost-estimation',
  'free-models',
  'embeddable',
];
