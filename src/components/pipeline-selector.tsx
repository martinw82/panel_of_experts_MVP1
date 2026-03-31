import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { PipelinePreset, STAGE_TYPE_META } from '../types';

interface PipelineSelectorProps {
  pipelines: PipelinePreset[];
  selectedPipelineId: string | null;
  onSelectPipeline: (pipeline: PipelinePreset) => void;
}

const stageColorMap: Record<string, string> = {
  teal: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

export function PipelineSelector({ pipelines, selectedPipelineId, onSelectPipeline }: PipelineSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-1">Select a Pipeline</h3>
        <p className="text-sm text-muted-foreground">
          Each pipeline runs your idea through a structured sequence of AI analysis stages.
        </p>
      </div>

      <div className="grid gap-3">
        {pipelines.map((pipeline) => {
          const isSelected = selectedPipelineId === pipeline.id;
          return (
            <Card
              key={pipeline.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => onSelectPipeline(pipeline)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="text-xl">{pipeline.icon}</span>
                    {pipeline.name}
                  </CardTitle>
                  {isSelected && (
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                      Selected
                    </span>
                  )}
                </div>
                <CardDescription className="text-sm">
                  {pipeline.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-1.5">
                  {pipeline.stages.map((stage, i) => {
                    const meta = STAGE_TYPE_META[stage.type];
                    const colorClass = stageColorMap[meta.color] || stageColorMap.purple;
                    return (
                      <React.Fragment key={stage.id}>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
                          {meta.label}
                        </span>
                        {i < pipeline.stages.length - 1 && (
                          <span className="text-muted-foreground text-xs self-center">→</span>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
