import React, { useEffect, useRef } from 'react';
import { 
  notifyParent, 
  PLUGIN_MESSAGE_TYPES, 
  PLUGIN_VERSION, 
  PLUGIN_CAPABILITIES,
  onParentCommand,
} from '../lib/plugin-api';
import { PipelineState, ModelDetail } from '../types';

interface EmbeddableWrapperProps {
  children: React.ReactNode;
  pipelineState: PipelineState;
  selectedModels: ModelDetail[];
  onReset: () => void;
  onStop: () => void;
  onSetInput: (text: string) => void;
  onSetPipeline: (id: string) => void;
  onSetModels: (models: string[]) => void;
  onRun: () => void;
}

/**
 * Wrapper component that handles plugin API communication
 * when the app is embedded in a parent dashboard
 */
export function EmbeddableWrapper({
  children,
  pipelineState,
  selectedModels,
  onReset,
  onStop,
  onSetInput,
  onSetPipeline,
  onSetModels,
  onRun,
}: EmbeddableWrapperProps) {
  const notifiedReady = useRef(false);
  const lastStageIndex = useRef(-1);
  const startTime = useRef<number | null>(null);

  // Notify parent when ready
  useEffect(() => {
    if (!notifiedReady.current) {
      notifyParent(PLUGIN_MESSAGE_TYPES.READY, {
        version: PLUGIN_VERSION,
        capabilities: PLUGIN_CAPABILITIES,
      });
      notifiedReady.current = true;
    }
  }, []);

  // Listen for commands from parent
  useEffect(() => {
    const unsubscribe = onParentCommand((command) => {
      switch (command.command) {
        case 'reset':
          onReset();
          break;
        case 'stop':
          onStop();
          break;
        case 'set-input':
          onSetInput(command.text);
          break;
        case 'set-pipeline':
          onSetPipeline(command.pipelineId);
          break;
        case 'set-models':
          onSetModels(command.models);
          break;
        case 'run':
          onRun();
          break;
      }
    });

    return unsubscribe;
  }, [onReset, onStop, onSetInput, onSetPipeline, onSetModels, onRun]);

  // Track pipeline state changes and notify parent
  useEffect(() => {
    // Pipeline started
    if (pipelineState.isRunning && !startTime.current) {
      startTime.current = Date.now();
      notifyParent(PLUGIN_MESSAGE_TYPES.STARTED, {
        pipelineId: 'unknown', // Would need to pass this in
        pipelineName: 'Unknown',
        stageCount: pipelineState.stageResults.length,
        models: selectedModels.map(m => m.identifier),
        estimatedCost: 0, // Would need to calculate this
      });
    }

    // Stage progress
    if (pipelineState.isRunning && pipelineState.currentStageIndex !== lastStageIndex.current) {
      lastStageIndex.current = pipelineState.currentStageIndex;
      notifyParent(PLUGIN_MESSAGE_TYPES.PROGRESS, {
        stageIndex: pipelineState.currentStageIndex,
        stageName: `Stage ${pipelineState.currentStageIndex + 1}`,
        stageType: 'unknown',
        round: pipelineState.currentRoundInStage,
        totalStages: pipelineState.stageResults.length + 1,
      });
    }

    // Stage complete
    const completedStages = pipelineState.stageResults;
    if (completedStages.length > 0) {
      const lastStage = completedStages[completedStages.length - 1];
      notifyParent(PLUGIN_MESSAGE_TYPES.STAGE_COMPLETE, {
        stageIndex: completedStages.length - 1,
        stageName: lastStage.stageName,
        output: lastStage.finalOutput,
        tokenUsage: lastStage.tokenUsage?.total || {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          estimatedCost: 0,
        },
      });
    }

    // Pipeline complete
    if (!pipelineState.isRunning && startTime.current && completedStages.length > 0) {
      const duration = Date.now() - startTime.current;
      const finalStage = completedStages[completedStages.length - 1];
      
      notifyParent(PLUGIN_MESSAGE_TYPES.COMPLETE, {
        pipelineId: 'unknown',
        output: finalStage.finalOutput,
        stages: completedStages.length,
        tokens: {
          prompt: pipelineState.tokenUsage?.grandTotal.promptTokens || 0,
          completion: pipelineState.tokenUsage?.grandTotal.completionTokens || 0,
          total: pipelineState.tokenUsage?.grandTotal.totalTokens || 0,
        },
        cost: pipelineState.tokenUsage?.grandTotal.estimatedCost || 0,
        duration,
      });
      
      startTime.current = null;
    }

    // Error
    if (pipelineState.error) {
      notifyParent(PLUGIN_MESSAGE_TYPES.ERROR, {
        stage: pipelineState.currentStageIndex,
        error: pipelineState.error,
        recoverable: true,
      });
    }
  }, [pipelineState, selectedModels]);

  return <>{children}</>;
}

/**
 * React hook for parent dashboard to interact with embedded Panel of Experts
 * 
 * Usage:
 * const iframeRef = useRef<HTMLIFrameElement>(null);
 * const { run, reset, setInput } = useEmbeddedPanel(iframeRef);
 * 
 * return <iframe ref={iframeRef} src="..." />;
 */
export function useEmbeddedPanel(iframeRef: React.RefObject<HTMLIFrameElement>) {
  const sendMessage = (type: string, payload?: unknown) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type, payload }, '*');
    }
  };

  const sendCommand = (command: { command: string } & Record<string, unknown>) => {
    sendMessage(PLUGIN_MESSAGE_TYPES.COMMAND, command);
  };

  return {
    reset: () => sendCommand({ command: 'reset' }),
    stop: () => sendCommand({ command: 'stop' }),
    setInput: (text: string) => sendCommand({ command: 'set-input', text }),
    setPipeline: (pipelineId: string) => sendCommand({ command: 'set-pipeline', pipelineId }),
    setModels: (models: string[]) => sendCommand({ command: 'set-models', models }),
    run: () => sendCommand({ command: 'run' }),
  };
}
