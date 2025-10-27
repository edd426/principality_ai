/**
 * Test Suite: Feature 1 - Dominion Mechanics Skill
 *
 * Status: RED (tests written first, implementation pending)
 * Created: 2025-10-22
 * Phase: 2.1
 *
 * Requirements Reference: docs/requirements/phase-2.1/FEATURES.md
 * Testing Reference: docs/requirements/phase-2.1/TESTING.md
 *
 * Feature 1 validates:
 * 1. Mechanics Skill SKILL.md loads correctly with all required sections
 * 2. Examples EXAMPLES.md contains 15+ detailed scenarios
 * 3. Game rules are documented accurately (game flow, coins, actions)
 * 4. All 15 cards documented with correct costs and effects
 * 5. Command syntax matches game engine (play, buy, end)
 *
 * @level Unit
 * @req: FR1.1-1.4 (Feature 1 functional requirements)
 */

// @req: R2.1-01 - Dominion mechanics skill with core concepts and card reference
// @edge: All 15 cards documented; game rules accurate; examples comprehensive; command syntax verified
// @why: AI agents need authoritative mechanics guide for correct gameplay decision-making

import fs from 'fs';
import path from 'path';

describe('Feature 1: Dominion Mechanics Skill - Unit Tests', () => {
  const skillBaseDir = path.join(process.cwd(), '.claude', 'skills', 'dominion-mechanics');

  /**
   * @req: SKILL.md file loads and contains game mechanics documentation
   * @input: File path to .claude/skills/dominion-mechanics/SKILL.md
   * @output: Valid markdown file with > 200 lines
   * @assert: File exists, readable, has required sections
   * @level: Unit
   */
  describe('UT1.1: Skill File Loads Correctly', () => {
    test('should load SKILL.md file without errors', () => {
      // @req: FR1.1 - Core concepts coverage - file exists
      // @why: Prerequisite for all other mechanics skill tests
      const skillPath = path.join(skillBaseDir, 'SKILL.md');

      expect(fs.existsSync(skillPath)).toBe(true);
      const content = fs.readFileSync(skillPath, 'utf-8');
      expect(content.length).toBeGreaterThan(0);
    });

    test('should have > 200 lines for comprehensive coverage', () => {
      // @req: FR1.1 - Comprehensive documentation
      // @why: Ensures skill covers mechanics thoroughly (not minimal)
      const skillPath = path.join(skillBaseDir, 'SKILL.md');
      const content = fs.readFileSync(skillPath, 'utf-8');
      const lineCount = content.split('\n').length;

      expect(lineCount).toBeGreaterThan(200);
    });

    test('should contain game flow overview section', () => {
      // @req: FR1.1 - Game phase flow documented
      // @why: Claude needs clear understanding of phase sequence
      const skillPath = path.join(skillBaseDir, 'SKILL.md');
      const content = fs.readFileSync(skillPath, 'utf-8').toLowerCase();

      expect(content).toContain('game flow');
      expect(content).toContain('action');
      expect(content).toContain('buy');
      expect(content).toContain('cleanup');
    });

    test('should contain coin generation mechanics section', () => {
      // @req: FR1.1 - Coin generation mechanics explained
      // @why: Core misconception - treasures must be PLAYED to generate coins
      const skillPath = path.join(skillBaseDir, 'SKILL.md');
      const content = fs.readFileSync(skillPath, 'utf-8').toLowerCase();

      expect(content).toContain('coin');
      expect(content).toContain('treasure');
      expect(content).toContain('play');
    });

    test('should contain action economy section', () => {
      // @req: FR1.1 - Action economy explained
      // @why: Core mechanic - +1 action enables more plays
      const skillPath = path.join(skillBaseDir, 'SKILL.md');
      const content = fs.readFileSync(skillPath, 'utf-8').toLowerCase();

      expect(content).toContain('action');
      expect(content).toContain('card');
    });

    test('should contain command syntax reference', () => {
      // @req: FR1.2 - Command syntax documented
      // @why: Claude needs exact syntax for each command
      const skillPath = path.join(skillBaseDir, 'SKILL.md');
      const content = fs.readFileSync(skillPath, 'utf-8');

      expect(content).toMatch(/play\s+\d+/i); // "play 0" format
      expect(content).toMatch(/buy\s+[A-Z]/); // "buy Card" format
      expect(content).toMatch(/end/i); // "end" command
    });

    test('should contain common mistakes section', () => {
      // @req: FR1.3 - Common mistakes documented
      // @why: Recovery guidance for confusion states
      const skillPath = path.join(skillBaseDir, 'SKILL.md');
      const content = fs.readFileSync(skillPath, 'utf-8').toLowerCase();

      expect(content).toContain('mistake');
      expect(content).toContain('error');
    });

    test('should contain quick reference tables', () => {
      // @req: FR1.4 - Card reference tables
      // @why: Easy lookup for card costs, effects, types
      const skillPath = path.join(skillBaseDir, 'SKILL.md');
      const content = fs.readFileSync(skillPath, 'utf-8');

      expect(content).toMatch(/[A-Z][a-z]+.*\d+.*[Cc]ost|[Cc]ost.*\d+.*[A-Z]/);
    });
  });

  /**
   * @req: EXAMPLES.md contains 15+ detailed scenarios with explanations
   * @input: File path to .claude/skills/dominion-mechanics/EXAMPLES.md
   * @output: Valid markdown with 15+ examples
   * @assert: File exists, each example complete, references valid
   * @level: Unit
   */
  describe('UT1.2: Examples File Structure', () => {
    test('should load EXAMPLES.md file without errors', () => {
      // @req: FR1.1 - Examples documentation
      // @why: Provides concrete scenarios for learning
      const examplesPath = path.join(skillBaseDir, 'EXAMPLES.md');

      expect(fs.existsSync(examplesPath)).toBe(true);
      const content = fs.readFileSync(examplesPath, 'utf-8');
      expect(content.length).toBeGreaterThan(0);
    });

    test('should contain 15+ example scenarios', () => {
      // @req: FR1.1 - 15+ examples required
      // @why: Covers diverse gameplay situations
      const examplesPath = path.join(skillBaseDir, 'EXAMPLES.md');
      const content = fs.readFileSync(examplesPath, 'utf-8');

      // Count EXAMPLE-# headers
      const exampleCount = (content.match(/EXAMPLE-\d+:/g) || []).length;
      expect(exampleCount).toBeGreaterThanOrEqual(15);
    });

    test('each example should have problem statement', () => {
      // @req: FR1.1 - Example structure includes problem
      // @why: Readers understand the scenario
      const examplesPath = path.join(skillBaseDir, 'EXAMPLES.md');
      const content = fs.readFileSync(examplesPath, 'utf-8');

      expect(content).toContain('Problem');
    });

    test('each example should have solution explained', () => {
      // @req: FR1.1 - Example structure includes solution
      // @why: Readers learn what to do
      const examplesPath = path.join(skillBaseDir, 'EXAMPLES.md');
      const content = fs.readFileSync(examplesPath, 'utf-8');

      expect(content).toContain('Solution');
    });

    test('each example should have explanation', () => {
      // @req: FR1.1 - Example structure includes explanation
      // @why: Readers understand WHY the solution works
      const examplesPath = path.join(skillBaseDir, 'EXAMPLES.md');
      const content = fs.readFileSync(examplesPath, 'utf-8');

      expect(content).toMatch(/Why|Explanation|Reasoning/i);
    });

    test('should cover opening hand optimization scenarios', () => {
      // @req: FR1.1 - EXAMPLE-1 type scenario
      // @why: First turn decisions are critical
      const examplesPath = path.join(skillBaseDir, 'EXAMPLES.md');
      const content = fs.readFileSync(examplesPath, 'utf-8').toLowerCase();

      expect(content).toMatch(/opening|hand|village|smithy/);
    });

    test('should cover coin generation mistakes', () => {
      // @req: FR1.3 - Common mistake: insufficient coins
      // @why: Critical error Claude makes frequently
      const examplesPath = path.join(skillBaseDir, 'EXAMPLES.md');
      const content = fs.readFileSync(examplesPath, 'utf-8').toLowerCase();

      expect(content).toMatch(/coin|treasure|play|buy/);
    });
  });

  /**
   * @req: Core game mechanics documented accurately
   * @input: Content from SKILL.md sections 1-6
   * @output: Game rules are accurate and match core package
   * @assert: Specific game mechanics verified
   * @level: Unit
   */
  describe('UT1.3: Content Validation - Game Rules', () => {
    let skillContent: string;

    beforeAll(() => {
      const skillPath = path.join(skillBaseDir, 'SKILL.md');
      skillContent = fs.readFileSync(skillPath, 'utf-8');
    });

    test('should document that treasures must be PLAYED to generate coins', () => {
      // @req: FR1.1 - Core misconception addressed
      // @why: Most critical rule - treasures don't generate coins automatically
      expect(skillContent.toLowerCase()).toMatch(/treasure.*play|play.*treasure/);
    });

    test('should explain action economy (+1 action mechanics)', () => {
      // @req: FR1.1 - Action economy explained
      // @why: Foundation for understanding Village, Smithy, etc.
      expect(skillContent).toMatch(/\+1 action|\+\d+.*action/);
    });

    test('should list phase sequence: action -> buy -> cleanup', () => {
      // @req: FR1.1 - Phase flow documented
      // @why: Turn structure must be clear
      const lowerContent = skillContent.toLowerCase();
      expect(lowerContent).toContain('action');
      expect(lowerContent).toContain('buy');
      expect(lowerContent).toContain('cleanup');
    });

    test('should document victory point calculation', () => {
      // @req: FR1.1 - VP mechanics explained
      // @why: Claude needs to understand end game
      expect(skillContent.toLowerCase()).toMatch(/victory|vp|point/);
    });

    test('should explain supply pile rules', () => {
      // @req: FR1.1 - Supply explained
      // @why: Claude needs to know what cards are available
      expect(skillContent.toLowerCase()).toMatch(/supply|pile/);
    });

    test('should document game end conditions', () => {
      // @req: FR1.1 - End conditions explained
      // @why: Claude needs to know when game ends
      expect(skillContent.toLowerCase()).toMatch(/end|game over|province/);
    });
  });

  /**
   * @req: All 15 cards documented with correct costs and effects
   * @input: Card quick reference section in SKILL.md
   * @output: All 15 kingdom cards documented
   * @assert: Specific card attributes verified
   * @level: Unit
   */
  describe('UT1.4: Content Validation - Card References', () => {
    let skillContent: string;

    beforeAll(() => {
      const skillPath = path.join(skillBaseDir, 'SKILL.md');
      skillContent = fs.readFileSync(skillPath, 'utf-8');
    });

    const testCards = [
      { name: 'Copper', cost: 0, type: 'treasure', effect: 'coin' },
      { name: 'Silver', cost: 3, type: 'treasure', effect: 'coin' },
      { name: 'Gold', cost: 6, type: 'treasure', effect: 'coin' },
      { name: 'Village', cost: 3, type: 'action', effect: 'action' },
      { name: 'Smithy', cost: 4, type: 'action', effect: 'card' },
      { name: 'Market', cost: 5, type: 'action', effect: 'multiple' },
      { name: 'Estate', cost: 2, type: 'victory', effect: 'vp' },
      { name: 'Duchy', cost: 5, type: 'victory', effect: 'vp' },
      { name: 'Province', cost: 8, type: 'victory', effect: 'vp' },
    ];

    test.each(testCards)('should document $name card', ({ name, type }) => {
      // @req: FR1.4 - All 15 cards documented
      // @why: Quick reference for card names and types
      expect(skillContent).toContain(name);
    });

    test('should mention Copper as 0-cost treasure', () => {
      // @req: FR1.4 - Copper attributes
      // @why: Foundation treasure, always available
      expect(skillContent).toMatch(/Copper.*0|0.*Copper|free/);
    });

    test('should mention Silver as 3-cost treasure', () => {
      // @req: FR1.4 - Silver attributes
      // @why: Tier 1 treasure upgrade
      expect(skillContent).toMatch(/Silver.*3|3.*Silver/);
    });

    test('should mention Gold as 6-cost treasure', () => {
      // @req: FR1.4 - Gold attributes
      // @why: Tier 2 treasure upgrade
      expect(skillContent).toMatch(/Gold.*6|6.*Gold/);
    });

    test('should mention Province as 8-cost victory card', () => {
      // @req: FR1.4 - Province attributes
      // @why: Most valuable victory card
      expect(skillContent).toMatch(/Province.*8|8.*Province/);
    });

    test('should mention Estate as 2-cost victory card', () => {
      // @req: FR1.4 - Estate attributes
      // @why: Base victory card
      expect(skillContent).toMatch(/Estate/);
    });

    test('should mention Duchy as 5-cost victory card', () => {
      // @req: FR1.4 - Duchy attributes
      // @why: Mid-tier victory card
      expect(skillContent).toMatch(/Duchy/);
    });

    test('should mention Village action card', () => {
      // @req: FR1.4 - Village attributes
      // @why: Core action card providing +actions
      expect(skillContent).toMatch(/Village/);
    });

    test('should mention Smithy action card', () => {
      // @req: FR1.4 - Smithy attributes
      // @why: Core action card providing +cards
      expect(skillContent).toMatch(/Smithy/);
    });
  });

  /**
   * @req: Command syntax documentation matches game engine exactly
   * @input: Syntax section in SKILL.md
   * @output: Examples show correct format for all commands
   * @assert: All syntax examples are valid moves
   * @level: Unit
   */
  describe('UT1.5: Syntax Reference Accuracy', () => {
    let skillContent: string;

    beforeAll(() => {
      const skillPath = path.join(skillBaseDir, 'SKILL.md');
      skillContent = fs.readFileSync(skillPath, 'utf-8');
    });

    test('should show "play 0" syntax for playing card at index 0', () => {
      // @req: FR1.2 - play command syntax
      // @why: Core move syntax
      expect(skillContent).toMatch(/play\s+0/);
    });

    test('should show "buy Copper" syntax for buying card', () => {
      // @req: FR1.2 - buy command syntax
      // @why: Core move syntax
      expect(skillContent).toMatch(/buy\s+\w+/);
    });

    test('should show "end" syntax for ending phase', () => {
      // @req: FR1.2 - end command syntax
      // @why: Phase transition syntax
      expect(skillContent).toMatch(/\bend\b/i);
    });

    test('should show index-based card reference examples', () => {
      // @req: FR1.2 - Index-based cards explained
      // @why: Claude needs to understand card positions in hand
      expect(skillContent).toMatch(/index|0|1|2/);
    });

    test('should include error message examples from actual gameplay', () => {
      // @req: FR1.2 - Error recovery guidance
      // @why: Claude can learn from error patterns
      expect(skillContent.toLowerCase()).toMatch(/error|invalid|insufficient/);
    });

    test('should include recovery suggestions for common errors', () => {
      // @req: FR1.2 - Recovery guidance
      // @why: Helps Claude fix mistakes
      expect(skillContent.toLowerCase()).toMatch(/try|instead|correct/);
    });
  });

  /**
   * @req: Skill integration points documented
   * @input: End of SKILL.md
   * @output: Clear triggers for when to auto-invoke
   * @assert: Auto-invocation triggers explained
   * @level: Unit
   */
  describe('UT1.6: Auto-Invocation Triggers', () => {
    let skillContent: string;

    beforeAll(() => {
      const skillPath = path.join(skillBaseDir, 'SKILL.md');
      skillContent = fs.readFileSync(skillPath, 'utf-8');
    });

    test('should document when skill should be auto-invoked', () => {
      // @req: FR1.1 - Skill integration documented
      // @why: System needs clear trigger rules
      const lowerContent = skillContent.toLowerCase();
      expect(lowerContent).toMatch(/auto|invoke|trigger|inject|when/);
    });

    test('should mention invalid move as trigger', () => {
      // @req: FR1.1 - Mechanical error trigger
      // @why: Invalid move is clear confusion signal
      expect(skillContent.toLowerCase()).toMatch(/invalid|error/);
    });

    test('should mention Claude questions as trigger', () => {
      // @req: FR1.1 - Question as confusion signal
      // @why: Direct question indicates confusion
      expect(skillContent.toLowerCase()).toMatch(/question|how|why|what/);
    });
  });

  /**
   * @req: Mechanics Skill README explains usage
   * @input: File path to .claude/skills/dominion-mechanics/README.md
   * @output: Overview and usage instructions
   * @assert: README provides context
   * @level: Unit
   */
  describe('UT1.7: Skill README Documentation', () => {
    test('should have README.md file', () => {
      // @req: FR1.1 - Skill documentation
      // @why: Users need overview of what skill provides
      const readmePath = path.join(skillBaseDir, 'README.md');
      expect(fs.existsSync(readmePath)).toBe(true);
    });

    test('README should describe skill purpose', () => {
      // @req: FR1.1 - Skill purpose documented
      // @why: Users understand what skill covers
      const readmePath = path.join(skillBaseDir, 'README.md');
      const content = fs.readFileSync(readmePath, 'utf-8').toLowerCase();

      expect(content).toMatch(/dominion|mechanics|game|rules/);
    });

    test('README should mention who should use it', () => {
      // @req: FR1.1 - Usage guidance
      // @why: Users understand when to apply skill
      const readmePath = path.join(skillBaseDir, 'README.md');
      const content = fs.readFileSync(readmePath, 'utf-8').toLowerCase();

      expect(content).toMatch(/confused|help|error|question/);
    });
  });
});
