import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { StageResult } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateSimilarity(textA: string, textB: string): number {
  if (!textA || !textB) return 0;
  
  const wordsA = new Set(
    textA.toLowerCase().split(/\s+/).filter(word => word.length > 2)
  );
  const wordsB = new Set(
    textB.toLowerCase().split(/\s+/).filter(word => word.length > 2)
  );
  
  if (wordsA.size === 0 && wordsB.size === 0) return 1;
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  
  const intersection = new Set([...wordsA].filter(word => wordsB.has(word)));
  const union = new Set([...wordsA, ...wordsB]);
  
  return union.size === 0 ? 1 : intersection.size / union.size;
}

export function parsePromptTemplate(template: string): Array<{
  name: string;
  defaultValue?: string;
  isOptional: boolean;
  inputType: 'text' | 'number' | 'textarea';
}> {
  const fields: Array<{
    name: string;
    defaultValue?: string;
    isOptional: boolean;
    inputType: 'text' | 'number' | 'textarea';
  }> = [];
  
  const regex = /\[([^\]]+)\]/g;
  let match;
  
  while ((match = regex.exec(template)) !== null) {
    const content = match[1];
    const [name, defaultValue] = content.split(':').map(s => s.trim());
    
    const isOptional = name.toLowerCase().includes('optional');
    const nameLower = name.toLowerCase();
    
    let inputType: 'text' | 'number' | 'textarea' = 'text';
    
    if (nameLower.includes('notes') || nameLower.includes('problem') || 
        nameLower.includes('strategy') || nameLower.includes('challenge') || 
        nameLower.includes('constraints') || nameLower.includes('proposition') ||
        nameLower.includes('description') || nameLower.includes('concept')) {
      inputType = 'textarea';
    } else if (nameLower.includes('budget') || nameLower.includes('cost') || 
               nameLower.includes('estimate') || nameLower.includes('rate')) {
      inputType = 'number';
    }
    
    if (!fields.find(field => field.name === name)) {
      fields.push({ name, defaultValue, isOptional, inputType });
    }
  }
  
  return fields;
}

export function replacePlaceholders(template: string, values: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    const patterns = [
      new RegExp(`\\[${key}\\]`, 'g'),
      new RegExp(`\\[${key}:[^\\]]*\\]`, 'g')
    ];
    patterns.forEach(pattern => {
      result = result.replace(pattern, value);
    });
  }
  return result;
}

/**
 * Build the prompt for a stage by injecting input text and previous context.
 */
export function buildStagePrompt(
  promptTemplate: string,
  inputText: string,
  previousStageResults: StageResult[]
): string {
  let prompt = promptTemplate.replace('{{input}}', inputText);
  
  // Build previous context from completed stages
  if (previousStageResults.length > 0) {
    const contextParts = previousStageResults.map(result => 
      `### ${result.stageName} (${result.stageType})\n${result.finalOutput}`
    );
    const contextBlock = contextParts.join('\n\n---\n\n');
    
    // Replace mustache-style conditional block
    prompt = prompt.replace(
      /\{\{#previousContext\}\}([\s\S]*?)\{\{\/previousContext\}\}/g,
      (_, inner) => inner.replace('{{previousContext}}', contextBlock)
    );
  } else {
    // Remove the conditional block entirely
    prompt = prompt.replace(
      /\{\{#previousContext\}\}[\s\S]*?\{\{\/previousContext\}\}/g,
      ''
    );
  }
  
  return prompt;
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function downloadAsText(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
