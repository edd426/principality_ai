/**
 * Test Suite: Feature 2 - Dominion Strategy Skill
 *
 * Status: RED (tests written first, implementation pending)
 * Created: 2025-10-22
 * Phase: 2.1
 *
 * Requirements Reference: docs/requirements/phase-2.1/FEATURES.md
 * Testing Reference: docs/requirements/phase-2.1/TESTING.md
 *
 * Feature 2 validates:
 * 1. Strategy Skill SKILL.md loads with strategic principles
 * 2. STRATEGIES.md contains 15+ detailed strategy scenarios
 * 3. Big Money baseline strategy documented correctly
 * 4. Card evaluation matrix complete for all 15 cards
 * 5. Game phase guidance clear (early/mid/late game)
 *
 * @level Unit
 * @req: FR2.1-2.4 (Feature 2 functional requirements)
 */

import fs from 'fs';
import path from 'path';

describe('Feature 2: Dominion Strategy Skill - Unit Tests', () => {
  const skillBaseDir = path.join(process.cwd(), '.claude', 'skills', 'dominion-strategy');

  /**
   * @req: SKILL.md file loads and contains strategy principles
   * @input: File path to .claude/skills/dominion-strategy/SKILL.md
   * @output: Valid markdown file with > 250 lines
   * @assert: File exists, readable, has required sections
   * @level: Unit
   */
  describe('UT2.1: Strategy File Loads', () => {
    test('should load SKILL.md file without errors', () => {
      // @req: FR2.1 - Strategic principles coverage
      // @why: Prerequisite for all strategy tests
      const skillPath = path.join(skillBaseDir, 'SKILL.md');

      expect(fs.existsSync(skillPath)).toBe(true);
      const content = fs.readFileSync(skillPath, 'utf-8');
      expect(content.length).toBeGreaterThan(0);
    });

    test('should have > 250 lines for comprehensive coverage', () => {
      // @req: FR2.1 - Comprehensive strategy documentation
      // @why: Ensures skill covers all strategic aspects
      const skillPath = path.join(skillBaseDir, 'SKILL.md');
      const content = fs.readFileSync(skillPath, 'utf-8');
      const lineCount = content.split('\n').length;

      expect(lineCount).toBeGreaterThan(250);
    });

    test('should contain game phases overview section', () => {
      // @req: FR2.1 - Game phases explained
      // @why: Strategy differs dramatically by phase
      const skillPath = path.join(skillBaseDir, 'SKILL.md');
      const content = fs.readFileSync(skillPath, 'utf-8').toLowerCase();

      expect(content).toContain('phase');
      expect(content).toMatch(/early|mid|late/);
    });

    test('should contain Big Money strategy section', () => {
      // @req: FR2.1 - Big Money baseline documented
      // @why: Foundation for all decisions
      const skillPath = path.join(skillBaseDir, 'SKILL.md');
      const content = fs.readFileSync(skillPath, 'utf-8').toLowerCase();

      expect(content).toContain('big money');
    });

    test('should contain VP timing section', () => {
      // @req: FR2.1 - Victory point timing explained
      // @why: When to buy Estates/Duchies/Provinces matters
      const skillPath = path.join(skillBaseDir, 'SKILL.md');
      const content = fs.readFileSync(skillPath, 'utf-8').toLowerCase();

      expect(content).toMatch(/victory|vp|point.*time|timing/);
    });

    test('should contain action economy synergies section', () => {
      // @req: FR2.1 - Action card evaluation
      // @why: Which kingdom cards to prioritize
      const skillPath = path.join(skillBaseDir, 'SKILL.md');
      const content = fs.readFileSync(skillPath, 'utf-8').toLowerCase();

      expect(content).toMatch(/action|card|synerg/);
    });

    test('should contain decision templates/frameworks', () => {
      // @req: FR2.2 - Decision frameworks provided
      // @why: Actionable guidance, not vague
      const skillPath = path.join(skillBaseDir, 'SKILL.md');
      const content = fs.readFileSync(skillPath, 'utf-8');

      expect(content).toMatch(/template|framework|decision|when|what/);
    });

    test('should contain card evaluation matrix', () => {
      // @req: FR2.3 - Card evaluation table
      // @why: Easy reference for card priorities
      const skillPath = path.join(skillBaseDir, 'SKILL.md');
      const content = fs.readFileSync(skillPath, 'utf-8');

      expect(content).toMatch(/matrix|table|card|rating|priority/i);
    });

    test('should contain endgame recognition section', () => {
      // @req: FR2.4 - Endgame awareness
      // @why: Strategy changes when Provinces running low
      const skillPath = path.join(skillBaseDir, 'SKILL.md');
      const content = fs.readFileSync(skillPath, 'utf-8').toLowerCase();

      expect(content).toMatch(/endgame|end game|final|remaining/);
    });
  });

  /**
   * @req: STRATEGIES.md contains 15+ detailed strategy scenarios
   * @input: File path to .claude/skills/dominion-strategy/STRATEGIES.md
   * @output: Each strategy scenario has decision tree and examples
   * @assert: All strategy files complete and actionable
   * @level: Unit
   */
  describe('UT2.2: Strategy Examples Complete', () => {
    test('should load STRATEGIES.md file without errors', () => {
      // @req: FR2.1 - Strategy examples
      // @why: Concrete scenarios for learning
      const strategiesPath = path.join(skillBaseDir, 'STRATEGIES.md');

      expect(fs.existsSync(strategiesPath)).toBe(true);
      const content = fs.readFileSync(strategiesPath, 'utf-8');
      expect(content.length).toBeGreaterThan(0);
    });

    test('should contain 15+ strategy scenarios', () => {
      // @req: FR2.1 - 15+ strategies required
      // @why: Covers diverse strategic situations
      const strategiesPath = path.join(skillBaseDir, 'STRATEGIES.md');
      const content = fs.readFileSync(strategiesPath, 'utf-8');

      // Count STRATEGY-# headers
      const strategyCount = (content.match(/STRATEGY-\d+:/g) || []).length;
      expect(strategyCount).toBeGreaterThanOrEqual(15);
    });

    test('each strategy should have scenario description', () => {
      // @req: FR2.2 - Strategy structure includes situation
      // @why: Readers understand when to apply strategy
      const strategiesPath = path.join(skillBaseDir, 'STRATEGIES.md');
      const content = fs.readFileSync(strategiesPath, 'utf-8');

      expect(content).toMatch(/Scenario|Situation|When/);
    });

    test('each strategy should have decision guidance', () => {
      // @req: FR2.2 - Strategy structure includes decision
      // @why: Readers know what to do
      const strategiesPath = path.join(skillBaseDir, 'STRATEGIES.md');
      const content = fs.readFileSync(strategiesPath, 'utf-8');

      expect(content).toMatch(/Decision|Buy|Action|Play/);
    });

    test('each strategy should have reasoning explanation', () => {
      // @req: FR2.2 - Strategy structure includes WHY
      // @why: Readers understand reasoning
      const strategiesPath = path.join(skillBaseDir, 'STRATEGIES.md');
      const content = fs.readFileSync(strategiesPath, 'utf-8');

      expect(content).toMatch(/Why|Reason|Because|Explanation/);
    });

    test('should cover Big Money baseline strategy', () => {
      // @req: FR2.1 - STRATEGY-1 type scenario
      // @why: Foundation for all decisions
      const strategiesPath = path.join(skillBaseDir, 'STRATEGIES.md');
      const content = fs.readFileSync(strategiesPath, 'utf-8').toLowerCase();

      expect(content).toMatch(/big money/);
    });

    test('should cover economic progression strategies', () => {
      // @req: FR2.1 - Treasure upgrade strategies
      // @why: How to progress Copper → Silver → Gold
      const strategiesPath = path.join(skillBaseDir, 'STRATEGIES.md');
      const content = fs.readFileSync(strategiesPath, 'utf-8').toLowerCase();

      expect(content).toMatch(/copper|silver|gold|treasure/);
    });

    test('should cover VP timing strategies', () => {
      // @req: FR2.1 - When to buy Estate/Duchy/Province
      // @why: Critical timing decision
      const strategiesPath = path.join(skillBaseDir, 'STRATEGIES.md');
      const content = fs.readFileSync(strategiesPath, 'utf-8').toLowerCase();

      expect(content).toMatch(/victory|province|duchy|estate|vp/);
    });
  });

  /**
   * @req: Big Money baseline strategy documented with exact buy order
   * @input: Big Money section from SKILL.md
   * @output: Buy order documented: Gold → Silver → Duchy → Province
   * @assert: Progression matches game theory
   * @level: Unit
   */
  describe('UT2.3: Big Money Baseline Accuracy', () => {
    let skillContent: string;

    beforeAll(() => {
      const skillPath = path.join(skillBaseDir, 'SKILL.md');
      skillContent = fs.readFileSync(skillPath, 'utf-8');
    });

    test('should document Big Money foundation', () => {
      // @req: FR2.1 - Big Money explained
      // @why: Universal baseline strategy
      expect(skillContent.toLowerCase()).toContain('big money');
    });

    test('should mention buying available treasures', () => {
      // @req: FR2.1 - Treasure priority
      // @why: Foundation of Big Money
      expect(skillContent.toLowerCase()).toMatch(/buy.*treasure|treasure.*buy/);
    });

    test('should mention Gold purchase', () => {
      // @req: FR2.1 - Gold in progression
      // @why: Tier 2 treasure upgrade
      expect(skillContent).toContain('Gold');
    });

    test('should mention Silver purchase', () => {
      // @req: FR2.1 - Silver in progression
      // @why: Tier 1 treasure upgrade
      expect(skillContent).toContain('Silver');
    });

    test('should document Province purchase timing', () => {
      // @req: FR2.1 - When to buy Province
      // @why: Critical buying decision (8 coins)
      expect(skillContent).toMatch(/Province.*8|8.*coin|buy.*province/i);
    });

    test('should explain Duchy purchase in Big Money', () => {
      // @req: FR2.1 - Duchy in progression
      // @why: When economy is good (5-6 coins)
      expect(skillContent).toMatch(/Duchy/);
    });
  });

  /**
   * @req: Card evaluation matrix complete with all 15 cards
   * @input: Card evaluation table from SKILL.md
   * @output: Each card has cost, effect, phase ratings, synergies
   * @assert: All 15 cards rated and explained
   * @level: Unit
   */
  describe('UT2.4: Card Evaluation Matrix Completeness', () => {
    let skillContent: string;

    beforeAll(() => {
      const skillPath = path.join(skillBaseDir, 'SKILL.md');
      skillContent = fs.readFileSync(skillPath, 'utf-8');
    });

    const allCards = [
      'Copper', 'Silver', 'Gold', // Treasures
      'Estate', 'Duchy', 'Province', // Victory cards
      'Village', 'Smithy', 'Market', 'Remodel', 'Militia', // Action cards
      'Cellar', 'Workshop', 'Throne Room', 'Woodcutter', // More action cards
      'Chapel', // Sifting card
    ];

    test('should have card evaluation matrix section', () => {
      // @req: FR2.3 - Card matrix exists
      // @why: Quick reference for card priorities
      expect(skillContent).toMatch(/matrix|table/i);
    });

    test.each(allCards)('should evaluate $item card', (cardName) => {
      // @req: FR2.3 - All 15 cards evaluated
      // @why: Complete card reference
      expect(skillContent).toContain(cardName);
    });

    test('should rate cards by phase effectiveness', () => {
      // @req: FR2.3 - Phase-based ratings
      // @why: Card value changes by game phase
      expect(skillContent).toMatch(/early|mid|late|phase|rating|priority/i);
    });

    test('should identify card synergies', () => {
      // @req: FR2.3 - Synergy information
      // @why: Some cards work better together
      expect(skillContent).toMatch(/synerg|combin|togeth|work.*with/i);
    });

    test('should explain when to prioritize Village', () => {
      // @req: FR2.3 - Village evaluation
      // @why: Key action card
      expect(skillContent).toMatch(/Village.*action|Village.*priorit|Village.*good/i);
    });

    test('should explain when to prioritize Smithy', () => {
      // @req: FR2.3 - Smithy evaluation
      // @why: Key action card
      expect(skillContent).toMatch(/Smithy.*card|Smithy.*draw|Smithy.*priorit/i);
    });
  });

  /**
   * @req: Clear guidance for each game phase (early/mid/late)
   * @input: Sections on early/mid/late game strategies
   * @output: Distinct strategies for each phase
   * @assert: Phase differences clear and actionable
   * @level: Unit
   */
  describe('UT2.5: Game Phase Guidance', () => {
    let skillContent: string;

    beforeAll(() => {
      const skillPath = path.join(skillBaseDir, 'SKILL.md');
      skillContent = fs.readFileSync(skillPath, 'utf-8');
    });

    test('should explain early game phase', () => {
      // @req: FR2.1 - Early game phase defined
      // @why: Different strategy than mid/late
      expect(skillContent.toLowerCase()).toMatch(/early.*game|early.*phase|turn.*1.*5/);
    });

    test('should explain mid game phase', () => {
      // @req: FR2.1 - Mid game phase defined
      // @why: Different strategy than early/late
      expect(skillContent.toLowerCase()).toMatch(/mid.*game|mid.*phase|turn.*5.*15/);
    });

    test('should explain late game phase', () => {
      // @req: FR2.1 - Late game phase defined
      // @why: Different strategy than early/mid
      expect(skillContent.toLowerCase()).toMatch(/late.*game|late.*phase|turn.*15|endgame/);
    });

    test('early game should emphasize economy building', () => {
      // @req: FR2.1 - Early game guidance
      // @why: Foundation for later VP
      expect(skillContent.toLowerCase()).toMatch(/early.*economy|economy.*early|treasure.*early/);
    });

    test('early game should avoid VP cards', () => {
      // @req: FR2.1 - Common mistake
      // @why: VP early wastes deck space
      expect(skillContent.toLowerCase()).toMatch(/avoid.*estate|avoid.*vp|avoid.*victory|early.*no.*estate/);
    });

    test('mid game should emphasize acceleration', () => {
      // @req: FR2.1 - Mid game guidance
      // @why: Scale up to 8+ coins for Provinces
      expect(skillContent.toLowerCase()).toMatch(/acceler|mid.*province|add.*province/);
    });

    test('late game should emphasize finishing', () => {
      // @req: FR2.1 - Late game guidance
      // @why: Speed is critical at end
      expect(skillContent.toLowerCase()).toMatch(/final|finish|speed|end/);
    });
  });

  /**
   * @req: Strategy Skill README explains usage
   * @input: File path to .claude/skills/dominion-strategy/README.md
   * @output: Overview and usage instructions
   * @assert: README provides context
   * @level: Unit
   */
  describe('UT2.6: Skill README Documentation', () => {
    test('should have README.md file', () => {
      // @req: FR2.1 - Skill documentation
      // @why: Users need overview of what skill provides
      const readmePath = path.join(skillBaseDir, 'README.md');
      expect(fs.existsSync(readmePath)).toBe(true);
    });

    test('README should describe skill purpose', () => {
      // @req: FR2.1 - Skill purpose documented
      // @why: Users understand what skill covers
      const readmePath = path.join(skillBaseDir, 'README.md');
      const content = fs.readFileSync(readmePath, 'utf-8').toLowerCase();

      expect(content).toMatch(/strategy|decision|buy|game/);
    });

    test('README should mention decision guidance', () => {
      // @req: FR2.2 - Decision support documented
      // @why: Users understand when to apply skill
      const readmePath = path.join(skillBaseDir, 'README.md');
      const content = fs.readFileSync(readmePath, 'utf-8').toLowerCase();

      expect(content).toMatch(/decision|what.*buy|action|phase/);
    });
  });

  /**
   * @req: Decision templates for common situations
   * @input: Decision templates section from SKILL.md
   * @output: Actionable templates for various phases
   * @assert: Templates provide clear guidance
   * @level: Unit
   */
  describe('UT2.7: Decision Templates', () => {
    let skillContent: string;

    beforeAll(() => {
      const skillPath = path.join(skillBaseDir, 'SKILL.md');
      skillContent = fs.readFileSync(skillPath, 'utf-8');
    });

    test('should have action phase decision template', () => {
      // @req: FR2.2 - Action phase template
      // @why: Claude needs action phase guidance
      expect(skillContent).toMatch(/action.*phase|action.*decis|what.*action/i);
    });

    test('should have buy phase decision template', () => {
      // @req: FR2.2 - Buy phase template
      // @why: Claude needs buy phase guidance
      expect(skillContent).toMatch(/buy.*phase|buy.*decis|what.*buy/i);
    });

    test('should have economy vs VP decision template', () => {
      // @req: FR2.2 - Economy/VP decision
      // @why: Critical strategic choice
      expect(skillContent).toMatch(/economy|vp|victory|treasure|province/i);
    });

    test('decision templates should be actionable not vague', () => {
      // @req: FR2.2 - Quality of guidance
      // @why: Vague advice doesn't help
      expect(skillContent).toMatch(/when|if|then|based on|consider/i);
    });
  });

  /**
   * @req: Strategies testable against real gameplay
   * @input: All strategy documentation
   * @output: Clear criteria for evaluating moves
   * @assert: Strategies enable move quality assessment
   * @level: Unit
   */
  describe('UT2.8: Strategy Testability', () => {
    let skillContent: string;
    let strategiesContent: string;

    beforeAll(() => {
      const skillPath = path.join(skillBaseDir, 'SKILL.md');
      const strategiesPath = path.join(skillBaseDir, 'STRATEGIES.md');
      skillContent = fs.readFileSync(skillPath, 'utf-8');
      strategiesContent = fs.readFileSync(strategiesPath, 'utf-8');
    });

    test('strategy should enable optimal vs suboptimal classification', () => {
      // @req: FR2.2 - Move quality assessment
      // @why: Experts can evaluate Claude's decisions
      const combined = skillContent + strategiesContent;
      expect(combined).toMatch(/optimal|suboptimal|good|bad|better|worse/i);
    });

    test('strategy should provide specific buy order guidance', () => {
      // @req: FR2.1 - Specific buying order
      // @why: Enables move validation
      expect(strategiesContent).toMatch(/buy.*order|priorit|first|then/i);
    });

    test('strategy should mention turn numbers or game state indicators', () => {
      // @req: FR2.2 - Testable thresholds
      // @why: Clear criteria for evaluation
      expect(skillContent).toMatch(/turn|coin|\d+/);
    });
  });
});
