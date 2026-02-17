/**
 * Claude AI Strategy
 *
 * Uses the Anthropic SDK to make game decisions via the Claude API.
 * Implements AIStrategy interface for use in the strategy chain.
 *
 * @req AI-001 - AI model selection (Haiku/Sonnet/Opus)
 * @req AI-002 - AI decision context and reasoning
 */

import Anthropic from '@anthropic-ai/sdk';
import type { AIStrategy, AIDecisionContext, AIDecision, AIModel, AIModelConfig } from '../types/ai';
import { AI_MODEL_CONFIGS } from '../types/ai';
import { buildSystemPrompt, buildUserPrompt, parseClaudeResponse } from './ai-prompts';

/**
 * Map from our model names to Anthropic model IDs
 */
const MODEL_ID_MAP: Record<AIModel, string> = {
  haiku: 'claude-haiku-4-5-20251001',
  sonnet: 'claude-sonnet-4-5-20250929',
  opus: 'claude-opus-4-6',
};

/**
 * Claude AI Strategy - makes decisions by calling the Claude API
 *
 * @req AI-001 - Supports Haiku, Sonnet, and Opus models
 * @req AI-002 - Returns decisions with reasoning
 */
export class ClaudeAIStrategy implements AIStrategy {
  readonly name = 'claude-ai';
  readonly modelId: string;
  readonly maxTokens: number;

  private client: Anthropic;
  private config: AIModelConfig;

  constructor(model: AIModel, apiKey?: string) {
    this.config = AI_MODEL_CONFIGS[model];
    this.modelId = MODEL_ID_MAP[model];
    this.maxTokens = this.config.maxTokens;
    this.client = new Anthropic(apiKey ? { apiKey } : undefined);
  }

  /**
   * Check if this strategy can handle the given context.
   * Returns true if there are valid moves to consider.
   */
  canHandle(context: AIDecisionContext): boolean {
    return context.validMoves.length > 0;
  }

  /**
   * Call Claude API to decide the next move.
   *
   * @throws Error if API call fails, response is unparseable, or suggested move is invalid
   */
  async decideMove(context: AIDecisionContext): Promise<AIDecision> {
    const startTime = Date.now();

    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(context);

    const response = await this.client.messages.create({
      model: this.modelId,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt },
      ],
    });

    const decisionTimeMs = Date.now() - startTime;

    // Extract text content from response
    const textBlock = response.content.find((block: { type: string }) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('Claude API returned no text content');
    }

    const responseText = (textBlock as { type: 'text'; text: string }).text;

    // Parse and validate the response
    const parsed = parseClaudeResponse(responseText, context.validMoves);
    if (!parsed) {
      throw new Error(
        `Claude returned invalid or disallowed move. Response: ${responseText.substring(0, 200)}`
      );
    }

    return {
      move: parsed.move,
      reasoning: parsed.reasoning,
      decisionTimeMs,
      strategyUsed: this.name,
    };
  }
}
