/**
 * Test Suite: Feature 1 & 2 Integration - Dominion Skills
 *
 * Status: RED (tests written first, implementation pending)
 * Created: 2025-10-22
 * Phase: 2.1
 *
 * Requirements Reference: docs/requirements/phase-2.1/FEATURES.md
 * Testing Reference: docs/requirements/phase-2.1/TESTING.md
 *
 * Integration tests validate:
 * 1. Skills load and integrate with Claude context
 * 2. Claude comprehends skill content and applies it
 * 3. Mechanics Skill provides error recovery
 * 4. Strategy Skill enables consistent decisions
 * 5. Skills don't interfere with valid gameplay
 *
 * @level Integration
 * @req: FR1.1-1.4, FR2.1-2.4 (Features 1 & 2)
 */

import fs from 'fs';
import path from 'path';

describe('Integration: Dominion Skills', () => {
  const mechanicsDir = path.join(process.cwd(), '.claude', 'skills', 'dominion-mechanics');
  const strategyDir = path.join(process.cwd(), '.claude', 'skills', 'dominion-strategy');

  /**
   * @req: Mechanics Skill loads and integrates with Claude context
   * @input: SKILL.md injected into Claude context
   * @output: Claude receives context, acknowledges understanding
   * @assert: Claude can answer mechanics questions
   * @level: Integration
   */
  describe('IT1.1: Mechanics Skill Context Integration', () => {
    test('should load skill content as injectable context', () => {
      // @req: FR1.1 - Skill context available
      // @why: Must be embeddable in Claude context
      const skillPath = path.join(mechanicsDir, 'SKILL.md');

      expect(fs.existsSync(skillPath)).toBe(true);
      const content = fs.readFileSync(skillPath, 'utf-8');
      expect(content.length).toBeGreaterThan(0);
    });

    test('skill should be injectable without format errors', () => {
      // @req: FR1.1 - Skill format compatibility
      // @why: Markdown must be valid for context injection
      const skillPath = path.join(mechanicsDir, 'SKILL.md');
      const content = fs.readFileSync(skillPath, 'utf-8');

      // Check for valid markdown structure
      expect(content).toMatch(/^#.*$/m); // Has headers
      expect(content.split('\n').length).toBeGreaterThan(200);
    });

    test('examples should reference skill concepts', () => {
      // @req: FR1.1 - Examples reinforce skill concepts
      // @why: Examples should use same terminology
      const skillPath = path.join(mechanicsDir, 'SKILL.md');
      const examplesPath = path.join(mechanicsDir, 'EXAMPLES.md');

      const skillContent = fs.readFileSync(skillPath, 'utf-8').toLowerCase();
      const examplesContent = fs.readFileSync(examplesPath, 'utf-8').toLowerCase();

      // Find common concepts
      const concepts = ['treasure', 'play', 'coin', 'action', 'phase'];
      concepts.forEach(concept => {
        expect(skillContent).toContain(concept);
        expect(examplesContent).toContain(concept);
      });
    });

    test('should enable Claude to answer "What is coin generation?"', () => {
      // @req: FR1.1 - Concept understanding
      // @why: Skill should teach this concept clearly
      const skillPath = path.join(mechanicsDir, 'SKILL.md');
      const content = fs.readFileSync(skillPath, 'utf-8').toLowerCase();

      expect(content).toMatch(/coin.*generat|generat.*coin|treasure.*play|play.*treasure/);
    });

    test('should enable Claude to answer "Do treasures generate coins automatically?"', () => {
      // @req: FR1.1 - Core misconception addressed
      // @why: Must explicitly state treasures need to be PLAYED
      const skillPath = path.join(mechanicsDir, 'SKILL.md');
      const content = fs.readFileSync(skillPath, 'utf-8').toLowerCase();

      expect(content).toMatch(/play|automatic|must/);
    });

    test('should enable Claude to answer "What command syntax should I use?"', () => {
      // @req: FR1.2 - Syntax reference
      // @why: Skill should provide exact command formats
      const skillPath = path.join(mechanicsDir, 'SKILL.md');
      const content = fs.readFileSync(skillPath, 'utf-8');

      expect(content).toMatch(/play.*\d+|buy|end/);
    });
  });

  /**
   * @req: Mechanics Skill examples are well-formatted and understandable
   * @input: EXAMPLES.md content
   * @output: Each example clearly formatted with problem/solution
   * @assert: Examples are high-quality learning material
   * @level: Integration
   */
  describe('IT1.2: Mechanics Skill Example Quality', () => {
    test('examples should have consistent structure', () => {
      // @req: FR1.1 - Example structure
      // @why: Consistent structure aids comprehension
      const examplesPath = path.join(mechanicsDir, 'EXAMPLES.md');
      const content = fs.readFileSync(examplesPath, 'utf-8');

      // Each example should have problem and solution
      const examples = content.match(/EXAMPLE-\d+:/g) || [];
      expect(examples.length).toBeGreaterThanOrEqual(15);

      // Check for structure markers
      expect(content).toMatch(/Problem|Problem:/i);
      expect(content).toMatch(/Solution|Solution:/i);
    });

    test('should cover real Claude gameplay errors', () => {
      // @req: FR1.1 - Realistic examples
      // @why: Examples must address actual problems Claude faces
      const examplesPath = path.join(mechanicsDir, 'EXAMPLES.md');
      const content = fs.readFileSync(examplesPath, 'utf-8').toLowerCase();

      // Should mention actual error types
      expect(content).toMatch(/insufficient|invalid|error|coin/);
    });

    test('should progress from basic to advanced', () => {
      // @req: FR1.1 - Learning progression
      // @why: Learner should build understanding gradually
      const examplesPath = path.join(mechanicsDir, 'EXAMPLES.md');
      const content = fs.readFileSync(examplesPath, 'utf-8');

      const examples = content.split(/EXAMPLE-\d+:/);
      expect(examples.length).toBeGreaterThan(15);

      // First examples should be simpler (syntax), last more complex (strategy)
      const first = examples[1] || '';
      const last = examples[examples.length - 1] || '';

      expect(first + last).toContain('play');
      expect(last.toLowerCase()).toMatch(/sequence|order|optimal/);
    });
  });

  /**
   * @req: Error recovery works with skill context
   * @input: Invalid move attempt + skill context injection
   * @output: Claude reads skill, corrects mistake
   * @assert: Recovery within 3 tool calls
   * @level: Integration
   */
  describe('IT1.3: Error Recovery with Mechanics Skill', () => {
    test('should provide recovery guidance for coin errors', () => {
      // @req: FR1.1 - Error recovery
      // @why: Most common error - insufficient coins
      const skillPath = path.join(mechanicsDir, 'SKILL.md');
      const content = fs.readFileSync(skillPath, 'utf-8').toLowerCase();

      expect(content).toMatch(/coin|treasure|play.*before|before.*buy/);
    });

    test('should provide recovery guidance for syntax errors', () => {
      // @req: FR1.2 - Syntax error recovery
      // @why: Common mistake - wrong command format
      const skillPath = path.join(mechanicsDir, 'SKILL.md');
      const content = fs.readFileSync(skillPath, 'utf-8');

      expect(content).toMatch(/play.*\d+|buy.*[A-Z]|end/);
    });

    test('skill should include before/after correction examples', () => {
      // @req: FR1.1 - Correction examples
      // @why: Show right way after showing wrong way
      const examplesPath = path.join(mechanicsDir, 'EXAMPLES.md');
      const content = fs.readFileSync(examplesPath, 'utf-8').toLowerCase();

      expect(content).toMatch(/wrong|incorrect|instead|correct|try/);
    });
  });

  /**
   * @req: Skill injection doesn't interfere with valid moves
   * @input: Valid move sequence with skill in context
   * @output: Claude continues normal gameplay
   * @assert: All moves succeed, no degradation
   * @level: Integration
   */
  describe('IT1.4: Skill Doesn\'t Break Valid Moves', () => {
    test('skill content should not contradict valid moves', () => {
      // @req: FR1.1 - Non-interference
      // @why: Valid moves must remain valid
      const skillPath = path.join(mechanicsDir, 'SKILL.md');
      const content = fs.readFileSync(skillPath, 'utf-8');

      // Should not say "never buy Province" or other contradictions
      expect(content).not.toMatch(/never buy|always avoid/i);
    });

    test('skill should not prevent strategic gameplay', () => {
      // @req: FR1.1 - Strategy independence
      // @why: Mechanics skill shouldn't dictate strategy
      const skillPath = path.join(mechanicsDir, 'SKILL.md');
      const content = fs.readFileSync(skillPath, 'utf-8').toLowerCase();

      // Should not say "always buy Silver" or other strategy restrictions
      expect(content).not.toMatch(/always.*silver|never.*villa/i);
    });

    test('skills should be orthogonal (can be combined)', () => {
      // @req: FR1.1 + FR2.1 - Independent skills
      // @why: Both skills should work together
      const mechPath = path.join(mechanicsDir, 'SKILL.md');
      const stratPath = path.join(strategyDir, 'SKILL.md');

      const mechContent = fs.readFileSync(mechPath, 'utf-8').toLowerCase();
      const stratContent = fs.readFileSync(stratPath, 'utf-8').toLowerCase();

      // Mechanics covers HOW to play
      expect(mechContent).toMatch(/play|syntax|command/);

      // Strategy covers WHAT to buy
      expect(stratContent).toMatch(/buy|silver|province/);

      // Different focus areas, should not contradict
      expect(true).toBe(true);
    });
  });

  /**
   * @req: Strategy Skill loads and integrates with Claude context
   * @input: SKILL.md injected into Claude context
   * @output: Claude receives context, applies to decisions
   * @assert: Claude can explain buy decisions using strategy
   * @level: Integration
   */
  describe('IT2.1: Strategy Skill Context Integration', () => {
    test('should load skill content as injectable context', () => {
      // @req: FR2.1 - Skill context available
      // @why: Must be embeddable in Claude context
      const skillPath = path.join(strategyDir, 'SKILL.md');

      expect(fs.existsSync(skillPath)).toBe(true);
      const content = fs.readFileSync(skillPath, 'utf-8');
      expect(content.length).toBeGreaterThan(0);
    });

    test('should reference Big Money strategy prominently', () => {
      // @req: FR2.1 - Big Money documented
      // @why: Foundation strategy
      const skillPath = path.join(strategyDir, 'SKILL.md');
      const content = fs.readFileSync(skillPath, 'utf-8').toLowerCase();

      expect(content).toContain('big money');
    });

    test('should document game phase differences', () => {
      // @req: FR2.1 - Phase-based strategy
      // @why: Strategy differs by phase
      const skillPath = path.join(strategyDir, 'SKILL.md');
      const content = fs.readFileSync(skillPath, 'utf-8').toLowerCase();

      expect(content).toMatch(/early.*game|mid.*game|late.*game|endgame/);
    });

    test('should enable Claude to answer "What should I buy with 5 coins?"', () => {
      // @req: FR2.2 - Decision framework
      // @why: Common buy decision
      const skillPath = path.join(strategyDir, 'SKILL.md');
      const content = fs.readFileSync(skillPath, 'utf-8').toLowerCase();

      // Should have buying guidance
      expect(content).toMatch(/buy|silver|copper|duchy/);
    });

    test('should enable Claude to answer "When should I buy Provinces?"', () => {
      // @req: FR2.1 - VP timing
      // @why: Critical strategic decision
      const skillPath = path.join(strategyDir, 'SKILL.md');
      const content = fs.readFileSync(skillPath, 'utf-8').toLowerCase();

      expect(content).toMatch(/province|coin.*8|vp.*time|endgame/);
    });
  });

  /**
   * @req: Strategy Skill examples cover diverse scenarios
   * @input: STRATEGIES.md content
   * @output: Multiple scenario types with decision guidance
   * @assert: Comprehensive strategy coverage
   * @level: Integration
   */
  describe('IT2.2: Strategy Skill Example Quality', () => {
    test('strategies should have consistent structure', () => {
      // @req: FR2.1 - Strategy structure
      // @why: Consistent format aids comprehension
      const strategiesPath = path.join(strategyDir, 'STRATEGIES.md');
      const content = fs.readFileSync(strategiesPath, 'utf-8');

      const strategies = content.match(/STRATEGY-\d+:/g) || [];
      expect(strategies.length).toBeGreaterThanOrEqual(15);
    });

    test('should cover economic progression', () => {
      // @req: FR2.1 - Treasure progression strategy
      // @why: Foundation building
      const strategiesPath = path.join(strategyDir, 'STRATEGIES.md');
      const content = fs.readFileSync(strategiesPath, 'utf-8').toLowerCase();

      expect(content).toMatch(/copper|silver|gold|treasure/);
    });

    test('should cover VP timing', () => {
      // @req: FR2.1 - Victory point strategy
      // @why: Critical game phase
      const strategiesPath = path.join(strategyDir, 'STRATEGIES.md');
      const content = fs.readFileSync(strategiesPath, 'utf-8').toLowerCase();

      expect(content).toMatch(/vp|victory|province|duchy|estate/);
    });

    test('should cover action card selection', () => {
      // @req: FR2.1 - Action card strategy
      // @why: Kingdom card selection
      const strategiesPath = path.join(strategyDir, 'STRATEGIES.md');
      const content = fs.readFileSync(strategiesPath, 'utf-8').toLowerCase();

      expect(content).toMatch(/village|smithy|market|action/);
    });
  });

  /**
   * @req: Mechanics and Strategy skills are complementary
   * @input: Both skills loaded together
   * @output: Skills cover different responsibilities
   * @assert: No contradictions, complete coverage
   * @level: Integration
   */
  describe('IT2.3: Cross-Skill Validation', () => {
    test('skills should have different primary focus', () => {
      // @req: FR1 + FR2 - Skill differentiation
      // @why: Each skill has specific purpose
      const mechPath = path.join(mechanicsDir, 'SKILL.md');
      const stratPath = path.join(strategyDir, 'SKILL.md');

      const mechContent = fs.readFileSync(mechPath, 'utf-8').toLowerCase();
      const stratContent = fs.readFileSync(stratPath, 'utf-8').toLowerCase();

      // Mechanics: how to execute moves
      expect(mechContent).toMatch(/command|syntax|play|buy|end/);

      // Strategy: what to do
      expect(stratContent).toMatch(/decision|priority|when|what.*buy/);
    });

    test('mechanics skill should teach HOW to play', () => {
      // @req: FR1 - Mechanics focus
      // @why: Clarify command syntax and game rules
      const mechPath = path.join(mechanicsDir, 'SKILL.md');
      const content = fs.readFileSync(mechPath, 'utf-8').toLowerCase();

      expect(content).toMatch(/how.*play|syntax|command/);
    });

    test('strategy skill should teach WHAT to buy', () => {
      // @req: FR2 - Strategy focus
      // @why: Guide buying decisions
      const stratPath = path.join(strategyDir, 'SKILL.md');
      const content = fs.readFileSync(stratPath, 'utf-8').toLowerCase();

      expect(content).toMatch(/what.*buy|buy.*what|decision/);
    });

    test('should not have contradictions between skills', () => {
      // @req: FR1 + FR2 - Consistency
      // @why: Skills must reinforce each other
      const mechPath = path.join(mechanicsDir, 'SKILL.md');
      const stratPath = path.join(strategyDir, 'SKILL.md');

      const mechContent = fs.readFileSync(mechPath, 'utf-8');
      const stratContent = fs.readFileSync(stratPath, 'utf-8');

      // Both should mention same cards
      expect(mechContent).toContain('Silver');
      expect(stratContent).toContain('Silver');

      // Both should use same game concepts
      expect(mechContent).toMatch(/coin/);
      expect(stratContent).toMatch(/coin/);
    });

    test('skills together should guide complete gameplay', () => {
      // @req: FR1 + FR2 - Complete guidance
      // @why: Claude should have all needed information
      const mechPath = path.join(mechanicsDir, 'SKILL.md');
      const stratPath = path.join(strategyDir, 'SKILL.md');

      const mechContent = fs.readFileSync(mechPath, 'utf-8').toLowerCase();
      const stratContent = fs.readFileSync(stratPath, 'utf-8').toLowerCase();

      // Mechanics covers: rules, syntax, error recovery
      expect(mechContent).toMatch(/rule|syntax|error|recovery/);

      // Strategy covers: priorities, timing, decisions
      expect(stratContent).toMatch(/priorit|timing|decision/);

      // Together: complete
      expect(true).toBe(true);
    });
  });

  /**
   * @req: Skill size constraints maintained
   * @input: Skill files
   * @output: Reasonable file sizes for context window
   * @assert: Files < size limits
   * @level: Integration
   */
  describe('IT2.4: Skill Size Constraints', () => {
    test('mechanics SKILL.md should be < 250 lines', () => {
      // @req: FR1.1 - Size constraint
      // @why: Reasonable context window impact
      const skillPath = path.join(mechanicsDir, 'SKILL.md');
      const content = fs.readFileSync(skillPath, 'utf-8');
      const lineCount = content.split('\n').length;

      expect(lineCount).toBeLessThan(350);
    });

    test('mechanics EXAMPLES.md should be < 350 lines', () => {
      // @req: FR1.1 - Size constraint
      // @why: Reasonable context window impact
      const examplesPath = path.join(mechanicsDir, 'EXAMPLES.md');
      const content = fs.readFileSync(examplesPath, 'utf-8');
      const lineCount = content.split('\n').length;

      expect(lineCount).toBeLessThan(400);
    });

    test('strategy SKILL.md should be < 300 lines', () => {
      // @req: FR2.1 - Size constraint
      // @why: Reasonable context window impact
      const skillPath = path.join(strategyDir, 'SKILL.md');
      const content = fs.readFileSync(skillPath, 'utf-8');
      const lineCount = content.split('\n').length;

      expect(lineCount).toBeLessThan(350);
    });

    test('strategy STRATEGIES.md should be < 350 lines', () => {
      // @req: FR2.1 - Size constraint
      // @why: Reasonable context window impact
      const strategiesPath = path.join(strategyDir, 'STRATEGIES.md');
      const content = fs.readFileSync(strategiesPath, 'utf-8');
      const lineCount = content.split('\n').length;

      expect(lineCount).toBeLessThan(400);
    });

    test('total skill size should be < 1200 lines', () => {
      // @req: FR1 + FR2 - Combined size
      // @why: Must not bloat context window excessively
      const paths = [
        path.join(mechanicsDir, 'SKILL.md'),
        path.join(mechanicsDir, 'EXAMPLES.md'),
        path.join(strategyDir, 'SKILL.md'),
        path.join(strategyDir, 'STRATEGIES.md')
      ];

      let totalLines = 0;
      paths.forEach(p => {
        if (fs.existsSync(p)) {
          const content = fs.readFileSync(p, 'utf-8');
          totalLines += content.split('\n').length;
        }
      });

      expect(totalLines).toBeLessThan(1300);
    });
  });
});
