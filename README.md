# Panel of Experts

Multi-stage AI idea refinement tool. Feed it a concept, pick a pipeline, and watch multiple AI models expand, critique, refine, and extract actionable outputs through structured stages.

## What it does

Unlike single-pass AI tools, Panel of Experts runs your idea through a **pipeline of distinct stages**, each with a different cognitive purpose:

| Stage | Purpose | Convergence |
|-------|---------|-------------|
| **Expand** | Divergent thinking — explore angles, broaden scope | Fixed rounds (2-3) |
| **Critique** | Adversarial — break assumptions, surface risks | Until no new risks found |
| **Refine** | Convergent — address critiques, strengthen | Similarity threshold |
| **Validate** | Score feasibility against concrete criteria | Single pass |
| **Structure** | Organise into frameworks and outlines | 1-2 rounds |
| **Extract** | Pull action items, tasks, deliverables | Single pass |

## Pipeline presets

- **General Idea Development** — Expand → Critique → Refine → Extract
- **Code Architecture** — Requirements → Architecture Review → Technical Design → Task Backlog
- **Content Project** — Topic Exploration → Audience Validation → Outline → Content Brief
- **Marketing Campaign** — Market Exploration → Competitive Stress Test → Strategy → ROI Validation → Campaign Plan
- **Research / Learning** — Landscape Mapping → Assumption Challenging → Thesis Refinement → Research Plan

Each pipeline composes from the stage library. Custom pipelines can be built by selecting and ordering stages.

## Supported AI providers

OpenAI, Anthropic, Together, Google Gemini, Cohere, Mistral. Select multiple models for diverse perspectives — all models run in parallel within each stage.

## Setup

```bash
git clone <repo-url>
cd panel-of-experts
npm install
npm run dev
```

Open `http://localhost:5173`, enter your API keys in Settings, select a pipeline and models, type your concept, and hit **Run Pipeline**.

## Architecture

```
src/
├── actions/          # Stage execution engine
│   └── execute-stage.ts
├── components/       # UI components
│   ├── pipeline-selector.tsx
│   ├── pipeline-progress.tsx
│   ├── llm-selector.tsx
│   ├── settings-dialog.tsx
│   └── ui/           # Radix/shadcn primitives
├── hooks/            # React hooks
├── lib/              # Utilities (similarity, prompt building)
├── pipelines/        # Pipeline preset definitions + stage prompts
│   └── index.ts
├── services/         # AI provider API integrations
│   └── ai-providers.ts
├── types/            # TypeScript types + Zod schemas
│   └── index.ts
└── App.tsx           # Main application + pipeline orchestrator
```

### Key concepts

- **Stage**: A distinct phase with its own prompt template, convergence criteria, and synthesis strategy. Wraps the multi-model iterative refinement engine.
- **Pipeline**: An ordered sequence of stages. Presets are provided for common project types.
- **Convergence**: Each stage decides when it's "done" — fixed rounds, similarity threshold, or no-new-items detection.
- **Inter-stage handoff**: Each stage receives the previous stage's output plus a structured context summary of all completed stages.

## Tech stack

React 18, TypeScript, Vite, Tailwind CSS, Radix UI, Zod

## Security note

API keys are stored in browser localStorage and used client-side. This is fine for a personal tool. For any public deployment, move API calls to server-side functions with keys stored as environment variables.

## License

MIT
