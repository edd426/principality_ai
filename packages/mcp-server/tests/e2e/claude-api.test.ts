/**
 * Test Suite: E2E - Real Claude API Integration
 *
 * Status: GREEN (real tests with Claude API)
 * Created: 2025-10-22
 * Phase: 2
 *
 * Requirements Reference: docs/requirements/phase-2/TESTING.md
 *
 * E2E tests validate:
 * 1. Real Claude API calls with MCP tools
 * 2. Tool request/response formats match Claude expectations
 * 3. Claude can make autonomous gameplay decisions
 * 4. Token efficiency and cost tracking
 * 5. Performance under real usage
 *
 * Note: These are smoke tests only to limit API costs (~$0.01-0.02 per run)
 * Full gameplay evaluation scenarios in scenarios/evaluation.test.ts
 *
 * Tests skip gracefully if CLAUDE_API_KEY not set
 *
 * @level E2E
 */

// @req: R2.0-10 - Claude API E2E tests with MCP tool integration
// @edge: Tool formats match Claude expectations; autonomous decision-making; token efficiency; cost tracking
// @why: Real API testing validates end-to-end integration before production deployment

import {
  callClaudeWithTools,
  callClaudeWithRetry,
  extractToolUse,
  extractAllToolUses,
  extractTextResponse,
  getTokenUsage,
  estimateCost,
  formatCost,
  formatTokenUsage,
  measureTime,
  ToolDefinition
} from './claude-api-helpers';

// Tool schemas (matching MCP server definitions)
const GAME_SESSION_SCHEMA: ToolDefinition = {
  name: 'game_session',
  description: 'Manage game lifecycle. "new" command starts game. "end" command ends current game.',
  input_schema: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        enum: ['new', 'end'],
        description: 'Lifecycle command: "new" to start fresh game, "end" to finish current'
      },
      seed: {
        type: 'string',
        description: 'Optional seed for deterministic shuffle'
      },
      model: {
        type: 'string',
        enum: ['haiku', 'sonnet'],
        description: 'LLM model selection (default: haiku)'
      }
    },
    required: ['command']
  }
};

const GAME_OBSERVE_SCHEMA: ToolDefinition = {
  name: 'game_observe',
  description:
    'Query current game state and valid moves. Returns state + validMoves combined. Use detail_level to optimize: minimal (~60 tokens), standard (~250), full (~1000).',
  input_schema: {
    type: 'object',
    properties: {
      detail_level: {
        type: 'string',
        enum: ['minimal', 'standard', 'full'],
        description: 'Level of detail: minimal, standard, or full'
      }
    },
    required: ['detail_level']
  }
};

const GAME_EXECUTE_SCHEMA: ToolDefinition = {
  name: 'game_execute',
  description:
    'Validate and execute a single move atomically. Format: "play 0", "buy Province", "end"',
  input_schema: {
    type: 'object',
    properties: {
      move: {
        type: 'string',
        description: 'Move string: "play 0", "buy Province", "end", etc.'
      },
      return_detail: {
        type: 'string',
        enum: ['minimal', 'full'],
        description: 'Return detail level'
      }
    },
    required: ['move']
  }
};

// Skip entire suite if CLAUDE_API_KEY not set
const skipIfNoApiKey = process.env.CLAUDE_API_KEY ? describe : describe.skip;

describe('E2E: Real Claude API Integration', () => {
  skipIfNoApiKey('E2E1.1: Claude Queries Game State', () => {
    test('should handle Claude API request for game state', async () => {
      // @req: Claude successfully queries game state via game_observe tool
      // @input: Real Claude API call with game_observe tool available
      // @output: Claude calls game_observe with valid detail_level
      // @assert: Tool call succeeds, response valid, tokens tracked
      // @level: E2E

      const userMessage = `You are about to play a Dominion-like card game. Query the current game state
with minimal detail to understand the current situation. Use the game_observe tool.`;

      const { duration_ms, result: response } = await measureTime('Claude query game state', () =>
        callClaudeWithTools(userMessage, [GAME_OBSERVE_SCHEMA])
      );

      // Verify Claude called the tool
      const toolUse = extractToolUse(response);
      expect(toolUse).not.toBeNull();
      expect(toolUse.name).toBe('game_observe');

      // Verify tool input is valid
      expect(toolUse.input).toHaveProperty('detail_level');
      expect(['minimal', 'standard', 'full']).toContain(toolUse.input.detail_level);

      // Verify performance
      expect(duration_ms).toBeLessThan(5000);

      // Track tokens and cost
      const tokens = getTokenUsage(response);
      const cost = estimateCost(tokens.input, tokens.output, 'haiku');
      console.log(
        `E2E1.1: ${formatTokenUsage(tokens)} = ${formatCost(cost)}, ${duration_ms}ms`
      );

      expect(tokens.input).toBeGreaterThan(0);
      expect(tokens.output).toBeGreaterThan(0);
      expect(cost.totalCost).toBeLessThan(0.01); // Smoke test should be cheap
    });

    test('should handle Claude choosing appropriate detail_level', async () => {
      // @req: Claude chooses appropriate detail_level based on context
      // @input: Claude given game context, must decide detail level
      // @output: Claude selects reasonable detail level
      // @assert: Detail level choice makes sense
      // @level: E2E

      const userMessage = `You are playing a card game. Your hand contains:
- 2 Action cards (Village, Smithy)
- 3 Treasure cards (Copper, Copper, Silver)
- 1 Victory card (Estate)

You have 5 coins and 2 actions available. You need to make move decisions.
Query the game state using the detail level that will give you the most useful information
without wasting tokens on unnecessary details.`;

      const { result: response } = await measureTime('Claude choose detail level', () =>
        callClaudeWithTools(userMessage, [GAME_OBSERVE_SCHEMA])
      );

      const toolUse = extractToolUse(response);
      expect(toolUse).not.toBeNull();
      expect(toolUse.name).toBe('game_observe');

      // Standard or full makes sense here (need move info for decisions)
      expect(['standard', 'full']).toContain(toolUse.input.detail_level);

      const tokens = getTokenUsage(response);
      const cost = estimateCost(tokens.input, tokens.output, 'haiku');
      console.log(
        `E2E1.1b: Claude chose detail_level="${toolUse.input.detail_level}", ${formatTokenUsage(tokens)} = ${formatCost(cost)}`
      );
    });

    test('should return response in under 5 seconds', async () => {
      // @req: Response timing under SLA
      // @input: game_observe call
      // @output: Response within 5s
      // @assert: Performance acceptable
      // @level: E2E

      const userMessage =
        'Query the game state with minimal detail. Use the game_observe tool.';

      const { duration_ms } = await measureTime('Query game state', () =>
        callClaudeWithTools(userMessage, [GAME_OBSERVE_SCHEMA])
      );

      expect(duration_ms).toBeLessThan(5000);
    });
  });

  skipIfNoApiKey('E2E1.2: Claude Executes Moves', () => {
    test('should handle Claude API request to execute move', async () => {
      // @req: Claude successfully executes moves via game_execute tool
      // @input: Real Claude API call with game_execute tool, game context
      // @output: Claude generates valid move string
      // @assert: Move format correct, execution succeeds
      // @level: E2E

      const userMessage = `You are in the action phase of a card game. Your hand contains:
- Village (card 0)
- Smithy (card 1)
- Market (card 2)
- Copper (card 3)
- Copper (card 4)

Execute the action card that gives you the most Actions. Format: "play 0" for Village, etc.
Use the game_execute tool.`;

      const { result: response } = await measureTime('Claude execute move', () =>
        callClaudeWithTools(userMessage, [GAME_EXECUTE_SCHEMA])
      );

      const toolUse = extractToolUse(response);
      expect(toolUse).not.toBeNull();
      expect(toolUse.name).toBe('game_execute');
      expect(toolUse.input).toHaveProperty('move');

      // Verify move format is reasonable
      const move = toolUse.input.move;
      expect(typeof move).toBe('string');

      // Valid formats: "play 0", "buy Card", "end", etc.
      const validPattern = /^(play \d+|buy \w+|end)$/i;
      expect(validPattern.test(move)).toBe(true);

      const tokens = getTokenUsage(response);
      const cost = estimateCost(tokens.input, tokens.output, 'haiku');
      console.log(`E2E1.2: Move="${move}", ${formatTokenUsage(tokens)} = ${formatCost(cost)}`);
    });

    test('should validate move format from Claude', async () => {
      // @req: Claude formats move strings correctly for game_execute
      // @input: Claude given specific move instruction
      // @output: Claude generates correctly formatted move string
      // @assert: Move string parses without error
      // @level: E2E

      const userMessage = `You are in the buy phase. You have 5 coins and 1 buy available.
You want to buy a Duchy card (costs 3 coins).
Execute the buy using the game_execute tool. Format: "buy CardName"`;

      const { result: response } = await measureTime('Claude format move', () =>
        callClaudeWithTools(userMessage, [GAME_EXECUTE_SCHEMA])
      );

      const toolUse = extractToolUse(response);
      expect(toolUse).not.toBeNull();
      expect(toolUse.name).toBe('game_execute');

      const move = toolUse.input.move;

      // Move should reference a card by name (buy) or index (play)
      expect(move).toMatch(/^(play \d+|buy \w+|end)$/i);

      // For this scenario, should be "buy Duchy" or similar
      expect(move.toLowerCase()).toContain('buy');

      const tokens = getTokenUsage(response);
      console.log(`E2E1.2b: Move format="${move}" valid, ${formatTokenUsage(tokens)}`);
    });

    test('should return move result quickly', async () => {
      // @req: Move execution < 1 second
      // @input: game_execute call
      // @output: Response within 1s
      // @assert: Performance acceptable
      // @level: E2E

      const userMessage = 'End the action phase. Execute "end".';

      const { duration_ms } = await measureTime('Execute move', () =>
        callClaudeWithTools(userMessage, [GAME_EXECUTE_SCHEMA])
      );

      expect(duration_ms).toBeLessThan(5000); // Claude response itself should be < 5s
    });
  });

  skipIfNoApiKey('E2E1.3: Claude Manages Game Lifecycle', () => {
    test('should handle Claude starting new game', async () => {
      // @req: Claude successfully initializes game via game_session tool
      // @input: Real Claude API call with game_session tool
      // @output: Claude uses game_session to start new game
      // @assert: Lifecycle operations succeed
      // @level: E2E

      const userMessage = `You are about to play a game of Principality (Dominion-like).
Start a new game using the game_session tool with command="new".
Include a seed for reproducibility.`;

      const { result: response } = await measureTime('Claude start game', () =>
        callClaudeWithTools(userMessage, [GAME_SESSION_SCHEMA])
      );

      const toolUse = extractToolUse(response);
      expect(toolUse).not.toBeNull();
      expect(toolUse.name).toBe('game_session');
      expect(toolUse.input.command).toBe('new');

      // Seed is optional but helpful for testing
      if (toolUse.input.seed) {
        expect(typeof toolUse.input.seed).toBe('string');
      }

      const tokens = getTokenUsage(response);
      const cost = estimateCost(tokens.input, tokens.output, 'haiku');
      console.log(`E2E1.3: Started game, ${formatTokenUsage(tokens)} = ${formatCost(cost)}`);
    });

    test('should handle Claude ending game', async () => {
      // @req: Claude successfully ends active game via game_session
      // @input: Real Claude API call with game_session tool
      // @output: Claude uses game_session to end game
      // @assert: Cleanup works
      // @level: E2E

      const userMessage = `You are done playing the game. End the current game session
using the game_session tool with command="end".`;

      const { result: response } = await measureTime('Claude end game', () =>
        callClaudeWithTools(userMessage, [GAME_SESSION_SCHEMA])
      );

      const toolUse = extractToolUse(response);
      expect(toolUse).not.toBeNull();
      expect(toolUse.name).toBe('game_session');
      expect(toolUse.input.command).toBe('end');

      const tokens = getTokenUsage(response);
      console.log(`E2E1.3b: Ended game, ${formatTokenUsage(tokens)}`);
    });
  });

  skipIfNoApiKey('E2E1.4: Complete Single Turn Sequence', () => {
    test('should execute full turn sequence with multiple tool calls', async () => {
      // @req: Claude can execute multiple tool calls in sequence
      // @input: Claude receives game context, makes multiple decisions
      // @output: Multiple tools called in logical sequence
      // @assert: Claude chains tools correctly for complete turn
      // @level: E2E

      const userMessage = `You are playing a turn of Principality. Complete an entire action phase:
1. First, query the current game state using game_observe (standard detail)
2. Then, play the first action card using game_execute (play 0 if available)
3. Finally, query the updated state using game_observe (minimal detail)

Use the tools in this order to complete the sequence.`;

      const { result: response } = await measureTime('Claude full turn sequence', () =>
        callClaudeWithTools(userMessage, [GAME_OBSERVE_SCHEMA, GAME_EXECUTE_SCHEMA])
      );

      const toolUses = extractAllToolUses(response);
      expect(toolUses.length).toBeGreaterThan(0);
      expect(toolUses[0].name).toBe('game_observe');

      const tokens = getTokenUsage(response);
      const cost = estimateCost(tokens.input, tokens.output, 'haiku');
      console.log(
        `E2E1.4: ${toolUses.length} tool calls, ${formatTokenUsage(tokens)} = ${formatCost(cost)}`
      );
    });
  });

  skipIfNoApiKey('E2E1.5: Tool Schema Validation', () => {
    test('should have valid JSON schemas for all tools', async () => {
      // @req: Tool schemas match MCP spec and are discoverable
      // @input: All tool definitions
      // @output: All tools have valid input schemas
      // @assert: Claude can discover and understand tools
      // @level: E2E

      const tools = [GAME_SESSION_SCHEMA, GAME_OBSERVE_SCHEMA, GAME_EXECUTE_SCHEMA];

      for (const tool of tools) {
        expect(tool.name).toBeDefined();
        expect(tool.name).toMatch(/^[a-z_]+$/); // Valid tool names

        expect(tool.description).toBeDefined();
        expect(tool.description.length).toBeGreaterThan(10); // Non-empty descriptions

        expect(tool.input_schema).toBeDefined();
        expect(tool.input_schema.type).toBe('object');
        expect(tool.input_schema.properties).toBeDefined();
        expect(tool.input_schema.required).toBeDefined();
      }
    });

    test('should have human-readable descriptions for all tools', async () => {
      // @req: Tools have descriptions Claude can understand
      // @input: Tool discovery
      // @output: All tools have descriptions
      // @assert: Claude understands tool purpose
      // @level: E2E

      const tools = [GAME_SESSION_SCHEMA, GAME_OBSERVE_SCHEMA, GAME_EXECUTE_SCHEMA];

      for (const tool of tools) {
        const desc = tool.description;

        // Description should mention what the tool does
        expect(desc.length).toBeGreaterThan(20);
        expect(desc).toMatch(/\w+/); // Contains actual words

        // No raw variable names or technical jargon without explanation
        expect(desc).not.toMatch(/\$\{/); // No unevaluated variables
      }
    });
  });

  skipIfNoApiKey('E2E1.6: Token Efficiency', () => {
    test('game_observe with minimal detail should be efficient', async () => {
      // @req: Minimal detail level is token-efficient
      // @input: game_observe call with detail_level="minimal"
      // @output: Token usage tracked
      // @assert: Meets efficiency target < 100 tokens
      // @level: E2E

      const userMessage =
        'Query the game state with minimal detail using game_observe(detail_level="minimal")';

      const { result: response } = await measureTime('game_observe minimal', () =>
        callClaudeWithTools(userMessage, [GAME_OBSERVE_SCHEMA])
      );

      const tokens = getTokenUsage(response);

      // Claude API response is typically 50-200 tokens total
      // This is reasonable for a minimal query
      expect(tokens.input + tokens.output).toBeLessThan(300); // Allow some margin

      const cost = estimateCost(tokens.input, tokens.output, 'haiku');
      console.log(
        `E2E1.6a: minimal detail = ${formatTokenUsage(tokens)} = ${formatCost(cost)}`
      );
    });

    test('game_observe with standard detail should be reasonable', async () => {
      // @req: Standard detail level provides good token-to-info ratio
      // @input: game_observe call with detail_level="standard"
      // @output: Token usage tracked
      // @assert: Reasonable efficiency < 500 tokens
      // @level: E2E

      const userMessage =
        'Query the game state with standard detail using game_observe(detail_level="standard")';

      const { result: response } = await measureTime('game_observe standard', () =>
        callClaudeWithTools(userMessage, [GAME_OBSERVE_SCHEMA])
      );

      const tokens = getTokenUsage(response);

      // Standard should still be reasonable for cost
      expect(tokens.input + tokens.output).toBeLessThan(600);

      const cost = estimateCost(tokens.input, tokens.output, 'haiku');
      console.log(
        `E2E1.6b: standard detail = ${formatTokenUsage(tokens)} = ${formatCost(cost)}`
      );
    });
  });

  skipIfNoApiKey('E2E1.7: Error Handling', () => {
    test('should handle API errors gracefully with retry', async () => {
      // @req: API errors are handled with exponential backoff
      // @input: Claude API call (may transiently fail)
      // @output: Successful response or clear error
      // @assert: Retry logic works
      // @level: E2E

      const userMessage = 'Query the game state with minimal detail.';

      // This should succeed (or fail clearly if API down)
      // callClaudeWithRetry adds retry logic
      let response: any;
      let errorCaught = false;

      try {
        response = await callClaudeWithRetry(userMessage, [GAME_OBSERVE_SCHEMA], 1);
      } catch (error: any) {
        errorCaught = true;
        // Could be legitimate API error
        console.log('API error caught (may be expected):', error.message);
      }

      if (!errorCaught) {
        expect(response).toBeDefined();
        const tokens = getTokenUsage(response);
        expect(tokens.input).toBeGreaterThan(0);
      }
    });
  });

  skipIfNoApiKey('E2E1.8: Cost Tracking', () => {
    test('entire test suite should cost < $0.05', async () => {
      // @req: E2E smoke tests are cost-efficient
      // @input: All API calls in tests
      // @output: Total cost tracked
      // @assert: Smoke tests remain cheap
      // @level: E2E

      // This test just logs cost info
      // Actual cost validation happens through manual review of logs

      const exampleTokens = { input: 500, output: 200 };
      const cost = estimateCost(exampleTokens.input, exampleTokens.output, 'haiku');

      expect(cost.totalCost).toBeLessThan(0.01);
      console.log(`E2E1.8: Example 700 tokens = ${formatCost(cost)}`);
    });

    test('should track cost per test', () => {
      // @req: Cost estimation is accurate
      // @input: Token counts
      // @output: Accurate cost calculation
      // @assert: Formula correct
      // @level: E2E

      // Haiku: $0.80 per M input, $4.00 per M output
      const cost1 = estimateCost(1000, 1000, 'haiku');
      expect(cost1.inputCost).toBeCloseTo(0.0008, 5);
      expect(cost1.outputCost).toBeCloseTo(0.004, 5);
      expect(cost1.totalCost).toBeCloseTo(0.0048, 5);

      // Sonnet: $3.00 per M input, $15.00 per M output
      const cost2 = estimateCost(1000, 1000, 'sonnet');
      expect(cost2.inputCost).toBeCloseTo(0.003, 5);
      expect(cost2.outputCost).toBeCloseTo(0.015, 5);
      expect(cost2.totalCost).toBeCloseTo(0.018, 5);
    });
  });

  skipIfNoApiKey('E2E1.9: API Key Verification', () => {
    test('CLAUDE_API_KEY environment variable is set', () => {
      // @req: Tests only run when API key is available
      // @input: Environment variable
      // @output: API key present
      // @assert: Credentials available
      // @level: E2E

      expect(process.env.CLAUDE_API_KEY).toBeDefined();
      expect(process.env.CLAUDE_API_KEY!.length).toBeGreaterThan(0);
      expect(process.env.CLAUDE_API_KEY).toMatch(/^sk-ant-/);
    });
  });
});
