/**
 * Claude API E2E Test Helpers
 *
 * Utilities for calling Claude API with MCP tool schemas
 * Handles token tracking and cost estimation
 */

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY
});

export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: any;
}

export interface TokenUsage {
  input: number;
  output: number;
}

export interface CostEstimate {
  inputCost: number;
  outputCost: number;
  totalCost: number;
  model: string;
}

/**
 * Call Claude API with specified tools
 *
 * @param userMessage Message to send to Claude
 * @param tools Array of tool definitions with name, description, input_schema
 * @returns Claude message response with usage info
 */
export async function callClaudeWithTools(
  userMessage: string,
  tools: ToolDefinition[]
): Promise<any> {
  if (!process.env.CLAUDE_API_KEY) {
    throw new Error('CLAUDE_API_KEY environment variable not set');
  }

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    tools: tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.input_schema
    })),
    messages: [
      {
        role: 'user',
        content: userMessage
      }
    ]
  });

  return response;
}

/**
 * Call Claude with tools and handle response
 * Includes retry logic for transient errors
 *
 * @param userMessage Message to send to Claude
 * @param tools Array of tool definitions
 * @param maxRetries Maximum number of retries on transient errors
 * @returns Claude message response
 */
export async function callClaudeWithRetry(
  userMessage: string,
  tools: ToolDefinition[],
  maxRetries: number = 2
): Promise<any> {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await callClaudeWithTools(userMessage, tools);
    } catch (error: any) {
      lastError = error;

      // Only retry on transient errors (rate limits, timeouts, server errors)
      const isTransient =
        error.status === 429 || // Rate limited
        error.status === 503 || // Service unavailable
        error.status === 500 || // Internal server error
        error.code === 'ECONNRESET' ||
        error.code === 'ETIMEDOUT';

      if (!isTransient || attempt === maxRetries) {
        throw error;
      }

      // Exponential backoff
      const delayMs = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}

/**
 * Extract tool use from Claude response
 *
 * @param response Claude message response
 * @returns First tool_use block or null if none
 */
export function extractToolUse(response: any): any | null {
  if (!response || !response.content) {
    return null;
  }

  const content = response.content || [];
  for (const block of content) {
    if (block.type === 'tool_use') {
      return block;
    }
  }
  return null;
}

/**
 * Extract all tool uses from Claude response
 *
 * @param response Claude message response
 * @returns Array of tool_use blocks
 */
export function extractAllToolUses(response: any): any[] {
  if (!response || !response.content) {
    return [];
  }

  const content = response.content || [];
  return content.filter((block: any) => block.type === 'tool_use');
}

/**
 * Extract text response from Claude
 *
 * @param response Claude message response
 * @returns Text content or empty string
 */
export function extractTextResponse(response: any): string {
  if (!response || !response.content) {
    return '';
  }

  const content = response.content || [];
  const textBlock = content.find((block: any) => block.type === 'text');
  return textBlock?.text || '';
}

/**
 * Get token usage from Claude response
 *
 * @param response Claude message response
 * @returns Object with input and output token counts
 */
export function getTokenUsage(response: any): TokenUsage {
  return {
    input: response.usage?.input_tokens || 0,
    output: response.usage?.output_tokens || 0
  };
}

/**
 * Estimate cost based on token usage
 *
 * Haiku rates (as of 2025-10):
 * - Input: $0.80 per 1M tokens
 * - Output: $4.00 per 1M tokens
 *
 * Sonnet rates:
 * - Input: $3.00 per 1M tokens
 * - Output: $15.00 per 1M tokens
 *
 * @param inputTokens Number of input tokens
 * @param outputTokens Number of output tokens
 * @param model Model name ('haiku' or 'sonnet')
 * @returns Cost estimate object
 */
export function estimateCost(
  inputTokens: number,
  outputTokens: number,
  model: string = 'haiku'
): CostEstimate {
  let inputRate: number;
  let outputRate: number;

  if (model === 'sonnet') {
    inputRate = 3.0; // per million
    outputRate = 15.0; // per million
  } else {
    // haiku (default)
    inputRate = 0.8; // per million
    outputRate = 4.0; // per million
  }

  const inputCost = (inputTokens / 1_000_000) * inputRate;
  const outputCost = (outputTokens / 1_000_000) * outputRate;

  return {
    inputCost: Number(inputCost.toFixed(6)),
    outputCost: Number(outputCost.toFixed(6)),
    totalCost: Number((inputCost + outputCost).toFixed(6)),
    model
  };
}

/**
 * Format cost for display
 *
 * @param cost Cost estimate
 * @returns Formatted string like "$0.0001"
 */
export function formatCost(cost: CostEstimate): string {
  if (cost.totalCost < 0.0001) {
    return '<$0.0001';
  }
  return `$${cost.totalCost.toFixed(4)}`;
}

/**
 * Format token usage for display
 *
 * @param usage Token usage
 * @returns Formatted string like "150 input + 75 output = 225 total"
 */
export function formatTokenUsage(usage: TokenUsage): string {
  const total = usage.input + usage.output;
  return `${usage.input} input + ${usage.output} output = ${total} total`;
}

/**
 * Wait for a specified number of milliseconds
 *
 * @param ms Milliseconds to wait
 */
export async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Measure execution time of an async function
 *
 * @param label Label for logging
 * @param fn Async function to measure
 * @returns Promise that resolves to { duration_ms, result }
 */
export async function measureTime<T>(
  label: string,
  fn: () => Promise<T>
): Promise<{ duration_ms: number; result: T }> {
  const start = Date.now();
  const result = await fn();
  const duration_ms = Date.now() - start;

  console.log(`[${label}] ${duration_ms}ms`);

  return { duration_ms, result };
}
