import { PipelinePreset, StageType, SynthesisStrategy } from '../types';

// ── Stage Prompt Templates ─────────────────────────────
// {{input}} = the text being processed (initial prompt or previous stage output)
// {{previousStageOutput}} = structured summary from prior stage (if any)

const EXPAND_PROMPT = `# Stage: Expand — Divergent Exploration

**Input Concept:**

{{input}}

{{#previousContext}}
**Context from Previous Stages:**

{{previousContext}}
{{/previousContext}}

**Your Role:** You are a creative strategist and lateral thinker. Your job is NOT to critique or refine — it is to EXPAND. Generate possibilities. Find angles the author hasn't considered.

**Your Task:**
1. **Adjacent Angles:** Identify 3-5 related directions, variations, or pivots that could strengthen or complement this concept.
2. **Audience Expansion:** Who else could benefit from this beyond the obvious target? What adjacent markets or user groups exist?
3. **Hidden Opportunities:** What non-obvious opportunities does this concept create? What could be built on top of it?
4. **Analogies & Precedents:** What successful concepts from other domains follow a similar pattern? What can be learned from them?
5. **Enriched Concept:** Rewrite the concept incorporating the most promising expansions while preserving the core intent.

**Output Format:**
Respond with clear sections: "Adjacent Angles:", "Audience Expansion:", "Hidden Opportunities:", "Analogies:", "Enriched Concept:". The "Enriched Concept" should be the complete, expanded version.`;

const CRITIQUE_PROMPT = `# Stage: Critique — Adversarial Stress Test

**Concept to Critique:**

{{input}}

{{#previousContext}}
**Context from Previous Stages:**

{{previousContext}}
{{/previousContext}}

**Your Role:** You are a critical expert and seasoned professional acting as Devil's Advocate. Your goal is NOT to improve the concept — it is to rigorously identify flaws, failure points, hidden risks, and questionable assumptions. Be harsh but fair.

**Your Task:**
1. **Critical Flaws (3-5):** What are the most significant weaknesses that could derail this concept?
2. **Hidden Risks:** What technical, market, financial, or execution risks are underestimated or ignored?
3. **Challenged Assumptions:** What core assumptions underpinning this concept are weak or unproven?
4. **Worst-Case Scenario:** Briefly outline a plausible scenario where this concept fails completely.
5. **Risk Severity Scoring:** Rate each identified risk as Critical / High / Medium / Low.

**Output Format:**
Respond with clear sections: "Critical Flaws:", "Hidden Risks:", "Challenged Assumptions:", "Worst-Case Scenario:", "Risk Scores:". Be specific and provide reasoning. Do NOT suggest solutions — output only the critique.`;

const REFINE_PROMPT = `# Stage: Refine — Convergent Strengthening

**Current Concept:**

{{input}}

{{#previousContext}}
**Critique Report to Address:**

{{previousContext}}
{{/previousContext}}

**Your Role:** You are a strategic advisor. Your job is to take the concept and the critique, then produce a STRONGER version that addresses the identified weaknesses while preserving core strengths.

**Your Task:**
1. **Strengths to Preserve:** Identify the top 3 strongest aspects — these must survive refinement.
2. **Weaknesses Addressed:** For each critical flaw or risk from the critique, explain how the refined concept addresses it.
3. **Concrete Improvements:** Provide 3-5 specific, actionable changes that strengthen the concept.
4. **Revised Concept:** Rewrite the complete concept incorporating improvements and addressing critiques.
5. **Viability Score:** Rate overall viability from 1-10 with brief justification.

**Output Format:**
Respond with clear sections: "Strengths:", "Weaknesses Addressed:", "Improvements:", "Revised Concept:", "Viability Score:". The "Revised Concept" must be the complete, updated version.`;

const VALIDATE_PROMPT = `# Stage: Validate — Feasibility Assessment

**Concept to Validate:**

{{input}}

{{#previousContext}}
**Context from Previous Stages:**

{{previousContext}}
{{/previousContext}}

**Your Role:** You are a pragmatic assessor. Score this concept against concrete feasibility criteria. No opinions — evidence-based evaluation only.

**Your Task:**
Evaluate and score each dimension (1-10 scale):

1. **Technical Feasibility:** Can this be built/executed with available technology and skills?
2. **Market Viability:** Is there demonstrated demand or a clear path to demand?
3. **Resource Requirements:** Are the time, money, and people requirements realistic?
4. **Competitive Position:** How defensible is this against existing alternatives?
5. **Execution Complexity:** How many dependencies, unknowns, and coordination points exist?
6. **Time to Value:** How quickly can this deliver meaningful results?

**For each dimension provide:**
- Score (1-10)
- One-line justification
- Key risk or assumption

**Then provide:**
- **Overall Viability Score** (weighted average)
- **Go/No-Go Recommendation** with reasoning
- **Top 3 Assumptions to Test First**

**Output Format:**
Structured scorecard with the dimensions above, followed by "Overall Score:", "Recommendation:", "Assumptions to Test:".`;

const STRUCTURE_PROMPT = `# Stage: Structure — Framework & Organisation

**Content to Structure:**

{{input}}

{{#previousContext}}
**Context from Previous Stages:**

{{previousContext}}
{{/previousContext}}

**Your Role:** You are an information architect. Take the refined concept and organise it into a clear, actionable framework.

**Your Task:**
1. **Core Framework:** Identify the natural structure of this concept — what are the major components, phases, or pillars?
2. **Hierarchy:** Organise elements into a clear hierarchy (primary > secondary > supporting).
3. **Sequencing:** If there's a natural order of execution or priority, make it explicit.
4. **Dependencies:** Map which elements depend on others.
5. **Structured Output:** Rewrite the concept as a well-organised document with clear sections, headings, and logical flow.

**Output Format:**
A clearly structured document with numbered sections, sub-sections where appropriate, and explicit sequencing. Include a brief "Structure Summary" at the top listing the major sections.`;

const EXTRACT_PROMPT = `# Stage: Extract — Actionable Deliverables

**Refined Concept:**

{{input}}

{{#previousContext}}
**Full Pipeline Context:**

{{previousContext}}
{{/previousContext}}

**Your Role:** You are a project planner. Convert this refined concept into concrete, actionable deliverables.

**Your Task:**
1. **Executive Summary:** 3-5 sentence overview of the final concept.
2. **Action Items:** Numbered list of specific tasks to execute, ordered by priority.
3. **Key Decisions Required:** What choices need to be made before execution?
4. **Resource Requirements:** What's needed (time, tools, people, budget)?
5. **Success Metrics:** How will you know this is working?
6. **First Three Steps:** The immediate next actions to take right now.

**Output Format:**
Respond with clear sections: "Executive Summary:", "Action Items:", "Key Decisions:", "Resources:", "Success Metrics:", "Next Steps:". Be specific and actionable — no vague recommendations.`;

// ── Code Architecture Stage Prompts ────────────────────

const CODE_EXPAND_PROMPT = `# Stage: Requirements Exploration

**Project Concept:**

{{input}}

{{#previousContext}}
**Context from Previous Stages:**

{{previousContext}}
{{/previousContext}}

**Your Role:** You are a senior engineer and product manager. Map the full problem space before any design decisions.

**Your Task:**
1. **Core Requirements:** What must this system do? List functional requirements.
2. **Edge Cases:** What happens at boundaries? Error states? Concurrent access? Empty states?
3. **User Stories:** Who uses this and how? Cover primary and secondary user flows.
4. **Non-Functional Requirements:** Performance targets, security needs, scalability expectations, accessibility.
5. **Integration Points:** What external systems, APIs, or services does this touch?
6. **Data Model Sketch:** What are the core entities and their relationships?
7. **Enriched Requirements:** Comprehensive requirements document incorporating all of the above.

**Output Format:**
Respond with clear sections for each task above. The "Enriched Requirements" should be a complete, structured requirements document.`;

const CODE_CRITIQUE_PROMPT = `# Stage: Architecture Review

**Technical Design:**

{{input}}

{{#previousContext}}
**Requirements Context:**

{{previousContext}}
{{/previousContext}}

**Your Role:** You are a principal engineer conducting an architecture review. Find the problems before they become expensive.

**Your Task:**
1. **Scalability Risks:** What breaks at 10x, 100x scale? Where are the bottlenecks?
2. **Security Concerns:** What attack surfaces exist? What data is exposed? Auth/authz gaps?
3. **Technical Debt Risks:** What shortcuts will cost you later? What's over-engineered?
4. **Missing Considerations:** What has been overlooked? Error handling, monitoring, deployment, rollback?
5. **Dependency Risks:** What external dependencies are fragile? What happens when they fail?
6. **Complexity Assessment:** What's unnecessarily complex? What's deceptively simple?

**Output Format:**
Respond with clear sections for each concern. Rate each as Critical / High / Medium / Low. Do NOT propose solutions — critique only.`;

const CODE_REFINE_PROMPT = `# Stage: Technical Design Refinement

**Current Architecture:**

{{input}}

{{#previousContext}}
**Architecture Review Findings:**

{{previousContext}}
{{/previousContext}}

**Your Role:** You are a senior architect. Address the review findings and produce a solid technical design.

**Your Task:**
1. **Strengths to Preserve:** What's well-designed and should stay?
2. **Issues Addressed:** For each critical/high finding, explain the design change.
3. **Technology Choices:** Confirm or revise tech stack decisions with justification.
4. **Revised Architecture:** Complete technical design document including components, data flow, API design, and deployment approach.
5. **Viability Score:** Rate technical viability 1-10.

**Output Format:**
Respond with clear sections. "Revised Architecture" must be the complete, updated technical design.`;

const CODE_EXTRACT_PROMPT = `# Stage: Implementation Task Backlog

**Technical Design:**

{{input}}

{{#previousContext}}
**Full Design Context:**

{{previousContext}}
{{/previousContext}}

**Your Role:** You are a tech lead creating the implementation plan.

**Your Task:**
1. **Architecture Summary:** Brief overview of the final technical design.
2. **Task Backlog:** Ordered list of implementation tasks, each with:
   - Task name
   - Description (1-2 sentences)
   - Estimated effort (S/M/L/XL)
   - Dependencies (which tasks must complete first)
   - Component/area
3. **Spike Tasks:** Tasks that need research or prototyping before committing.
4. **MVP Scope:** Which tasks are essential for a minimum viable version?
5. **Tech Decisions Log:** Key technology choices made and their rationale.
6. **First Sprint:** The first 3-5 tasks to start with.

**Output Format:**
Structured task backlog with clear sections. Tasks should be specific enough to act on.`;

// ── Content Stage Prompts ──────────────────────────────

const CONTENT_EXPAND_PROMPT = `# Stage: Topic Exploration

**Content Concept:**

{{input}}

{{#previousContext}}
**Context from Previous Stages:**

{{previousContext}}
{{/previousContext}}

**Your Role:** You are a content strategist. Explore the topic space before committing to an angle.

**Your Task:**
1. **Angle Variations:** 5+ different angles or framings for this topic. What's the contrarian take? The beginner take? The expert take? The emotional take?
2. **Audience Segments:** Who would care about each angle? What's their context and motivation?
3. **Content Gap Analysis:** What's already been covered well? Where is the gap this content can fill?
4. **Hook Candidates:** 3-5 potential opening hooks or headlines that could grab attention.
5. **Enriched Concept:** The strongest angle with supporting rationale.

**Output Format:**
Respond with clear sections. "Enriched Concept" should be the fully developed content angle.`;

const CONTENT_VALIDATE_PROMPT = `# Stage: Audience Fit Validation

**Content Angle:**

{{input}}

{{#previousContext}}
**Context from Previous Stages:**

{{previousContext}}
{{/previousContext}}

**Your Role:** You are an audience analyst. Score this content concept against audience fit.

**Your Task:**
Score each dimension (1-10):
1. **Relevance:** Does the target audience actually care about this?
2. **Timing:** Is this topic timely or evergreen? Either is fine — but which?
3. **Differentiation:** How distinct is this from existing content on the topic?
4. **Shareability:** Would someone share this? Why?
5. **Depth vs Breadth:** Is the scope right for the format?
6. **Actionability:** Can the reader do something with this?

**Then provide:**
- **Overall Fit Score**
- **Recommended Adjustments** (2-3 specific tweaks)
- **Best Format** (blog, video script, thread, guide, etc.)

**Output Format:**
Structured scorecard followed by recommendations.`;

const CONTENT_STRUCTURE_PROMPT = `# Stage: Content Outline

**Validated Content Concept:**

{{input}}

{{#previousContext}}
**Context from Previous Stages:**

{{previousContext}}
{{/previousContext}}

**Your Role:** You are an editor. Build the skeleton this content needs.

**Your Task:**
1. **Working Title:** Strong, specific headline.
2. **One-Line Summary:** What the reader will take away.
3. **Outline:** Detailed section-by-section outline with:
   - Section heading
   - Key points to cover
   - Estimated word count per section
4. **Opening Hook:** First 2-3 sentences drafted.
5. **Closing CTA:** What should the reader do after consuming this?
6. **Supporting Elements:** What examples, data, quotes, or visuals would strengthen this?

**Output Format:**
Complete editorial outline ready for drafting.`;

const CONTENT_EXTRACT_PROMPT = `# Stage: Content Brief

**Content Outline:**

{{input}}

{{#previousContext}}
**Full Content Context:**

{{previousContext}}
{{/previousContext}}

**Your Role:** You are a content project manager. Create the production brief.

**Your Task:**
1. **Brief Summary:** What this piece is, who it's for, and why it matters.
2. **Production Checklist:** Ordered tasks to produce this content.
3. **Key Messages:** 3-5 points that MUST be communicated.
4. **Tone & Style:** How should this read? Reference points.
5. **Distribution Plan:** Where will this be published? What channels?
6. **Success Metrics:** How will you measure impact?
7. **Deadline & Milestones:** Suggested timeline.

**Output Format:**
Complete content brief ready to hand off for production.`;

// ── Marketing Stage Prompts ────────────────────────────

const MARKETING_EXPAND_PROMPT = `# Stage: Market Opportunity Exploration

**Marketing Concept:**

{{input}}

{{#previousContext}}
**Context from Previous Stages:**

{{previousContext}}
{{/previousContext}}

**Your Role:** You are a marketing strategist. Map the opportunity landscape.

**Your Task:**
1. **Channel Opportunities:** What marketing channels could work? Rank by potential ROI.
2. **Messaging Angles:** 5+ different value propositions or messaging framings.
3. **Audience Segments:** Break down the target into specific, reachable segments.
4. **Competitive Positioning:** How are competitors messaging? Where's the gap?
5. **Quick Wins:** What could generate results in under 30 days?
6. **Enriched Strategy:** The strongest combination of channel + message + audience.

**Output Format:**
Respond with clear sections. "Enriched Strategy" is the fully developed marketing approach.`;

const MARKETING_CRITIQUE_PROMPT = `# Stage: Competitive Stress Test

**Marketing Strategy:**

{{input}}

{{#previousContext}}
**Context from Previous Stages:**

{{previousContext}}
{{/previousContext}}

**Your Role:** You are a competitive analyst. Poke holes in this marketing approach.

**Your Task:**
1. **Competitive Blind Spots:** What are competitors doing that this strategy ignores?
2. **Channel Risks:** Which proposed channels are saturated, expensive, or declining?
3. **Message Weaknesses:** Where is the messaging vague, generic, or unsubstantiated?
4. **Budget Reality Check:** Are the implied costs realistic? What's missing from the budget?
5. **Timing Risks:** Are there seasonal, market, or competitive timing concerns?

**Output Format:**
Risk report with severity ratings. Critique only — no solutions.`;

const MARKETING_VALIDATE_PROMPT = `# Stage: ROI Validation

**Marketing Strategy:**

{{input}}

{{#previousContext}}
**Context from Previous Stages:**

{{previousContext}}
{{/previousContext}}

**Your Role:** You are a marketing analyst. Score this strategy on likely return.

**Your Task:**
Score each dimension (1-10):
1. **Reach Potential:** How many people can this realistically reach?
2. **Conversion Likelihood:** How likely is the audience to act?
3. **Cost Efficiency:** What's the expected cost per result?
4. **Measurability:** Can you track what's working?
5. **Scalability:** Can this grow without proportional cost increase?
6. **Speed to Results:** How quickly will you see signal?

**Then provide:**
- **Overall ROI Score**
- **Go/No-Go Recommendation**
- **Top 3 Metrics to Track**

**Output Format:**
Structured scorecard with recommendation.`;

const MARKETING_EXTRACT_PROMPT = `# Stage: Campaign Plan

**Validated Strategy:**

{{input}}

{{#previousContext}}
**Full Marketing Context:**

{{previousContext}}
{{/previousContext}}

**Your Role:** You are a marketing project manager. Create the execution plan.

**Your Task:**
1. **Campaign Summary:** What, who, where, when, why.
2. **Channel Plan:** Specific channels with tactics for each.
3. **Content Requirements:** What assets need to be created?
4. **Budget Breakdown:** Estimated costs by category.
5. **Timeline:** Week-by-week execution schedule.
6. **KPIs:** Specific metrics with targets.
7. **First Week Actions:** What to do immediately.

**Output Format:**
Complete campaign plan ready for execution.`;

// ── Pipeline Preset Definitions ────────────────────────

export const PIPELINE_PRESETS: PipelinePreset[] = [
  {
    id: 'general',
    name: 'General Idea Development',
    description: 'The default pipeline. Works for any concept — business, personal, creative, technical.',
    icon: '💡',
    stages: [
      {
        id: 'general-expand',
        type: StageType.EXPAND,
        name: 'Explore & Expand',
        description: 'Broaden the concept, find adjacent angles and hidden opportunities',
        promptTemplate: EXPAND_PROMPT,
        convergence: { maxRounds: 3 },
        synthesisStrategy: SynthesisStrategy.LLM_SYNTHESIS,
      },
      {
        id: 'general-critique',
        type: StageType.CRITIQUE,
        name: 'Critical Assessment',
        description: 'Stress test the expanded concept — find flaws and risks',
        promptTemplate: CRITIQUE_PROMPT,
        convergence: { maxRounds: 3, noNewItemsStop: true },
        synthesisStrategy: SynthesisStrategy.LLM_SYNTHESIS,
      },
      {
        id: 'general-refine',
        type: StageType.REFINE,
        name: 'Strengthen & Refine',
        description: 'Address critiques and produce a hardened concept',
        promptTemplate: REFINE_PROMPT,
        convergence: { maxRounds: 5, similarityThreshold: 0.95 },
        synthesisStrategy: SynthesisStrategy.LLM_SYNTHESIS,
      },
      {
        id: 'general-extract',
        type: StageType.EXTRACT,
        name: 'Extract Action Items',
        description: 'Convert the refined concept into actionable deliverables',
        promptTemplate: EXTRACT_PROMPT,
        convergence: { maxRounds: 1, singlePass: true },
        synthesisStrategy: SynthesisStrategy.LLM_SYNTHESIS,
      },
    ],
  },
  {
    id: 'code-architecture',
    name: 'Code Architecture',
    description: 'For software projects. Requirements → Architecture Review → Technical Design → Task Backlog.',
    icon: '🏗️',
    stages: [
      {
        id: 'code-expand',
        type: StageType.EXPAND,
        name: 'Requirements Exploration',
        description: 'Map the problem space — user stories, edge cases, integrations',
        promptTemplate: CODE_EXPAND_PROMPT,
        convergence: { maxRounds: 3 },
        synthesisStrategy: SynthesisStrategy.LLM_SYNTHESIS,
      },
      {
        id: 'code-critique',
        type: StageType.CRITIQUE,
        name: 'Architecture Review',
        description: 'Find scalability bottlenecks, security gaps, and tech debt risks',
        promptTemplate: CODE_CRITIQUE_PROMPT,
        convergence: { maxRounds: 3, noNewItemsStop: true },
        synthesisStrategy: SynthesisStrategy.LLM_SYNTHESIS,
      },
      {
        id: 'code-refine',
        type: StageType.REFINE,
        name: 'Technical Design',
        description: 'Address review findings, make tech choices, produce solid architecture',
        promptTemplate: CODE_REFINE_PROMPT,
        convergence: { maxRounds: 5, similarityThreshold: 0.95 },
        synthesisStrategy: SynthesisStrategy.LLM_SYNTHESIS,
      },
      {
        id: 'code-extract',
        type: StageType.EXTRACT,
        name: 'Task Backlog',
        description: 'Convert design into ordered, estimatable implementation tasks',
        promptTemplate: CODE_EXTRACT_PROMPT,
        convergence: { maxRounds: 1, singlePass: true },
        synthesisStrategy: SynthesisStrategy.LLM_SYNTHESIS,
      },
    ],
  },
  {
    id: 'content',
    name: 'Content Project',
    description: 'For articles, videos, guides. Topic Exploration → Audience Validation → Outline → Brief.',
    icon: '✍️',
    stages: [
      {
        id: 'content-expand',
        type: StageType.EXPAND,
        name: 'Topic Exploration',
        description: 'Explore angles, audiences, hooks, and content gaps',
        promptTemplate: CONTENT_EXPAND_PROMPT,
        convergence: { maxRounds: 2 },
        synthesisStrategy: SynthesisStrategy.LLM_SYNTHESIS,
      },
      {
        id: 'content-validate',
        type: StageType.VALIDATE,
        name: 'Audience Fit',
        description: 'Score the content angle against audience relevance and differentiation',
        promptTemplate: CONTENT_VALIDATE_PROMPT,
        convergence: { maxRounds: 1, singlePass: true },
        synthesisStrategy: SynthesisStrategy.LLM_SYNTHESIS,
      },
      {
        id: 'content-structure',
        type: StageType.STRUCTURE,
        name: 'Content Outline',
        description: 'Build the editorial skeleton — sections, flow, hooks',
        promptTemplate: CONTENT_STRUCTURE_PROMPT,
        convergence: { maxRounds: 2 },
        synthesisStrategy: SynthesisStrategy.LLM_SYNTHESIS,
      },
      {
        id: 'content-extract',
        type: StageType.EXTRACT,
        name: 'Content Brief',
        description: 'Production-ready brief with checklist, style guide, and distribution plan',
        promptTemplate: CONTENT_EXTRACT_PROMPT,
        convergence: { maxRounds: 1, singlePass: true },
        synthesisStrategy: SynthesisStrategy.LLM_SYNTHESIS,
      },
    ],
  },
  {
    id: 'marketing',
    name: 'Marketing Campaign',
    description: 'Market exploration → Competitive stress test → Strategy → ROI validation → Campaign plan.',
    icon: '📣',
    stages: [
      {
        id: 'marketing-expand',
        type: StageType.EXPAND,
        name: 'Market Exploration',
        description: 'Map channels, messaging angles, and audience segments',
        promptTemplate: MARKETING_EXPAND_PROMPT,
        convergence: { maxRounds: 2 },
        synthesisStrategy: SynthesisStrategy.LLM_SYNTHESIS,
      },
      {
        id: 'marketing-critique',
        type: StageType.CRITIQUE,
        name: 'Competitive Stress Test',
        description: 'Find blind spots, channel risks, and messaging weaknesses',
        promptTemplate: MARKETING_CRITIQUE_PROMPT,
        convergence: { maxRounds: 3, noNewItemsStop: true },
        synthesisStrategy: SynthesisStrategy.LLM_SYNTHESIS,
      },
      {
        id: 'marketing-refine',
        type: StageType.REFINE,
        name: 'Strategy Refinement',
        description: 'Strengthen the strategy against competitive findings',
        promptTemplate: REFINE_PROMPT,
        convergence: { maxRounds: 4, similarityThreshold: 0.95 },
        synthesisStrategy: SynthesisStrategy.LLM_SYNTHESIS,
      },
      {
        id: 'marketing-validate',
        type: StageType.VALIDATE,
        name: 'ROI Validation',
        description: 'Score the strategy on likely return before committing',
        promptTemplate: MARKETING_VALIDATE_PROMPT,
        convergence: { maxRounds: 1, singlePass: true },
        synthesisStrategy: SynthesisStrategy.LLM_SYNTHESIS,
      },
      {
        id: 'marketing-extract',
        type: StageType.EXTRACT,
        name: 'Campaign Plan',
        description: 'Execution-ready campaign with timeline, budget, and KPIs',
        promptTemplate: MARKETING_EXTRACT_PROMPT,
        convergence: { maxRounds: 1, singlePass: true },
        synthesisStrategy: SynthesisStrategy.LLM_SYNTHESIS,
      },
    ],
  },
  {
    id: 'research',
    name: 'Research / Learning',
    description: 'For academic, technical, or exploratory research. Landscape → Assumptions → Thesis → Plan.',
    icon: '🔬',
    stages: [
      {
        id: 'research-expand',
        type: StageType.EXPAND,
        name: 'Landscape Mapping',
        description: 'Map the knowledge space — key questions, related fields, existing work',
        promptTemplate: EXPAND_PROMPT,
        convergence: { maxRounds: 3 },
        synthesisStrategy: SynthesisStrategy.LLM_SYNTHESIS,
      },
      {
        id: 'research-critique',
        type: StageType.CRITIQUE,
        name: 'Assumption Challenging',
        description: 'What do we think we know that might be wrong?',
        promptTemplate: CRITIQUE_PROMPT,
        convergence: { maxRounds: 3, noNewItemsStop: true },
        synthesisStrategy: SynthesisStrategy.LLM_SYNTHESIS,
      },
      {
        id: 'research-refine',
        type: StageType.REFINE,
        name: 'Thesis Refinement',
        description: 'Sharpen the research question or hypothesis',
        promptTemplate: REFINE_PROMPT,
        convergence: { maxRounds: 5, similarityThreshold: 0.95 },
        synthesisStrategy: SynthesisStrategy.LLM_SYNTHESIS,
      },
      {
        id: 'research-extract',
        type: StageType.EXTRACT,
        name: 'Research Plan',
        description: 'Methodology, sources, timeline, and deliverables',
        promptTemplate: EXTRACT_PROMPT,
        convergence: { maxRounds: 1, singlePass: true },
        synthesisStrategy: SynthesisStrategy.LLM_SYNTHESIS,
      },
    ],
  },
];

export function getPipelineById(id: string): PipelinePreset | undefined {
  return PIPELINE_PRESETS.find(p => p.id === id);
}
