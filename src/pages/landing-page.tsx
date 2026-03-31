import React from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { 
  Users, 
  Play, 
  Zap, 
  Shield, 
  Coins, 
  ArrowRight,
  Sparkles,
  Workflow,
  GitBranch,
  CheckCircle2,
  ExternalLink,
  Github,
  Twitter,
  MessageCircle
} from 'lucide-react';
import { AIProvider, PROVIDER_INFO, getFreeModels } from '../data/provider-pricing';

interface LandingPageProps {
  onLaunch: () => void;
}

export default function LandingPage({ onLaunch }: LandingPageProps) {
  const freeModelCount = getFreeModels().length;
  const freeProviders = Object.values(AIProvider).filter(p => {
    return p === AIProvider.GROQ || p === AIProvider.OLLAMA || p === AIProvider.OPENROUTER;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="border-b bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-6">
          <nav className="flex items-center justify-between mb-16">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl">Panel of Experts</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#providers" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Providers
              </a>
              <Button onClick={onLaunch}>
                Launch Tool <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </nav>

          <div className="max-w-4xl mx-auto text-center py-16 md:py-24">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              {freeModelCount}+ Free AI Models Available
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Multi-Stage AI{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Idea Refinement
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Feed your concept to a panel of AI experts. Watch as they expand, critique, 
              refine, and extract actionable outputs through structured multi-stage pipelines.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={onLaunch} className="text-lg px-8">
                <Play className="h-5 w-5 mr-2" />
                Start Refining
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8" asChild>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                  <Github className="h-5 w-5 mr-2" />
                  View on GitHub
                </a>
              </Button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Browser-only, no data sent to us</span>
              </div>
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4" />
                <span>Free tier options available</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span>Fast parallel execution</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="py-20 container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">How It Works</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Unlike single-pass AI tools, Panel of Experts runs your idea through a structured 
            pipeline of distinct cognitive stages.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <FeatureCard
            icon={<Workflow className="h-6 w-6" />}
            title="Expand"
            description="Divergent thinking — explore angles, broaden scope, find hidden opportunities"
            color="teal"
          />
          <FeatureCard
            icon={<GitBranch className="h-6 w-6" />}
            title="Critique"
            description="Adversarial analysis — break assumptions, surface risks, challenge weak points"
            color="orange"
          />
          <FeatureCard
            icon={<CheckCircle2 className="h-6 w-6" />}
            title="Refine"
            description="Convergent strengthening — address critiques, synthesize improvements"
            color="purple"
          />
          <FeatureCard
            icon={<Shield className="h-6 w-6" />}
            title="Validate"
            description="Feasibility scoring — test against concrete criteria and real-world constraints"
            color="blue"
          />
          <FeatureCard
            icon={<Workflow className="h-6 w-6" />}
            title="Structure"
            description="Information architecture — organize into frameworks, outlines, hierarchies"
            color="amber"
          />
          <FeatureCard
            icon={<Zap className="h-6 w-6" />}
            title="Extract"
            description="Actionable deliverables — pull tasks, briefs, and concrete next steps"
            color="green"
          />
        </div>
      </section>

      {/* Pipeline Presets */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Pipeline Presets</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Ready-made pipelines for common use cases. Or build your own custom pipeline 
              by selecting and ordering stages.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <PresetCard
              icon="💡"
              title="General Idea"
              description="The default pipeline. Works for any concept — business, personal, creative."
              stages={['Expand', 'Critique', 'Refine', 'Extract']}
            />
            <PresetCard
              icon="🏗️"
              title="Code Architecture"
              description="For software projects. Requirements → Review → Design → Tasks."
              stages={['Requirements', 'Review', 'Design', 'Backlog']}
            />
            <PresetCard
              icon="✍️"
              title="Content Project"
              description="For articles, videos, guides. Topic → Validation → Outline → Brief."
              stages={['Topic', 'Validation', 'Outline', 'Brief']}
            />
            <PresetCard
              icon="📣"
              title="Marketing"
              description="Market exploration → Stress test → Strategy → ROI → Plan."
              stages={['Market', 'Test', 'Strategy', 'ROI', 'Plan']}
            />
          </div>
        </div>
      </section>

      {/* Providers Section */}
      <section id="providers" className="py-20 container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">AI Providers</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Connect your preferred AI providers. Multiple models run in parallel for 
            diverse perspectives within each stage.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Free Providers Highlight */}
          <Card className="mb-8 border-green-200 bg-green-50/50 dark:bg-green-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-green-600" />
                Free Tier Available
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {freeProviders.map((provider) => {
                  const info = PROVIDER_INFO[provider];
                  return (
                    <div key={provider} className="flex items-start gap-3 p-3 bg-background rounded-lg">
                      <div className={`px-2 py-1 rounded text-xs font-medium ${info.color}`}>
                        {info.name}
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{info.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-sm text-green-700 dark:text-green-300 mt-4">
                Start with {freeModelCount}+ free models. No API keys required for Groq and Ollama!
              </p>
            </CardContent>
          </Card>

          {/* All Providers */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.values(AIProvider).map((provider) => {
              const info = PROVIDER_INFO[provider];
              const isFree = provider === AIProvider.GROQ || provider === AIProvider.OLLAMA || provider === AIProvider.OPENROUTER;
              
              return (
                <div key={provider} className="flex items-center gap-3 p-3 border rounded-lg">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${info.color}`}>
                    {info.name}
                  </span>
                  {isFree && (
                    <span className="text-xs text-green-600 font-medium">FREE</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
            <CardContent className="py-12 px-8">
              <h2 className="text-3xl font-bold mb-4">Ready to Refine Your Ideas?</h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Start with free models, or bring your own API keys. Your data stays 
                in your browser — we never see your prompts or results.
              </p>
              <Button size="lg" onClick={onLaunch} className="text-lg px-8">
                <Play className="h-5 w-5 mr-2" />
                Launch Panel of Experts
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 bg-primary rounded flex items-center justify-center">
                <Users className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">Panel of Experts</span>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">GitHub</a>
            </div>
            
            <div className="flex items-center gap-4">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <MessageCircle className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <p className="text-center text-xs text-muted-foreground mt-8">
            Open source under MIT License. Built with React, TypeScript, and ❤️.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  description, 
  color 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    teal: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${colorClasses[color]}`}>
          {icon}
        </div>
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function PresetCard({ 
  icon, 
  title, 
  description, 
  stages 
}: { 
  icon: string; 
  title: string; 
  description: string;
  stages: string[];
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="text-3xl mb-4">{icon}</div>
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        <div className="flex flex-wrap gap-1">
          {stages.map((stage, i) => (
            <span key={i} className="text-xs px-2 py-1 bg-muted rounded-full">
              {stage}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
