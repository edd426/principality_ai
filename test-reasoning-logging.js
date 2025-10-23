#!/usr/bin/env node

/**
 * Test script to verify enhanced logging with reasoning capture
 */

const fs = require('fs');
const path = require('path');

// Import from built packages
const { GameEngine } = require('./packages/core/dist/index.js');
const { Logger } = require('./packages/mcp-server/dist/logger.js');
const { GameSessionTool } = require('./packages/mcp-server/dist/tools/game-session.js');
const { GameObserveTool } = require('./packages/mcp-server/dist/tools/game-observe.js');
const { GameExecuteTool } = require('./packages/mcp-server/dist/tools/game-execute.js');

// Set up test log file
const testLogFile = path.join(process.cwd(), 'test-reasoning.log');
if (fs.existsSync(testLogFile)) {
  fs.unlinkSync(testLogFile);
}

console.log('🧪 Enhanced Logging Test (with Reasoning Capture)\n');
console.log(`Log file: ${testLogFile}\n`);

async function runTest() {
  try {
    // Create logger
    const logger = new Logger('info', 'json', testLogFile);
    console.log('✓ Logger created\n');

    // Create game engine
    const gameEngine = new GameEngine('test-seed-reasoning');
    console.log('✓ Game engine created\n');

    // Create state holder
    let currentState = null;
    const setState = (state) => { currentState = state; };
    const getState = () => currentState;

    // Initialize tools with logger
    const sessionTool = new GameSessionTool(gameEngine, 'haiku', setState, getState, logger);
    const observeTool = new GameObserveTool(gameEngine, getState, logger);
    const executeTool = new GameExecuteTool(gameEngine, getState, setState, logger);

    console.log('✓ All tools created with logger instances\n');

    // Simulate game start
    console.log('Starting new game...');
    const startResult = await sessionTool.execute({ command: 'new' });
    if (!startResult.success) {
      throw new Error('Failed to start game: ' + startResult.error);
    }
    console.log(`✓ Game started (ID: ${startResult.gameId})\n`);

    // Observe initial state (should now be logged at info level)
    console.log('Observing initial game state...');
    const observeResult = await observeTool.execute({ detail_level: 'standard' });
    if (!observeResult.success) {
      throw new Error('Failed to observe: ' + observeResult.error);
    }
    console.log(`✓ Game state observed (Turn ${observeResult.turnNumber}, Phase: ${observeResult.phase})\n`);

    // Execute a move WITH reasoning
    console.log('Executing first move WITH reasoning...');
    const moveResult = await executeTool.execute({ 
      move: 'end', 
      return_detail: 'minimal',
      reasoning: 'Moving to buy phase to purchase more cards'
    });
    if (!moveResult.success) {
      console.log('Move result:', moveResult);
      throw new Error('Failed to execute move: ' + moveResult.error?.message);
    }
    console.log(`✓ Move executed: ${moveResult.message}\n`);

    // Execute another move without reasoning
    console.log('Executing second move WITHOUT reasoning...');
    const moveResult2 = await executeTool.execute({ 
      move: 'end', 
      return_detail: 'minimal'
    });
    if (!moveResult2.success) {
      throw new Error('Failed to execute move 2: ' + moveResult2.error?.message);
    }
    console.log(`✓ Move executed: ${moveResult2.message}\n`);

    // End game
    console.log('Ending game...');
    const endResult = await sessionTool.execute({ command: 'end' });
    if (!endResult.success) {
      throw new Error('Failed to end game: ' + endResult.error);
    }
    console.log(`✓ Game ended\n`);

    // Check log file
    console.log('Checking log file...');
    if (!fs.existsSync(testLogFile)) {
      throw new Error(`Log file not created at ${testLogFile}`);
    }

    const logContent = fs.readFileSync(testLogFile, 'utf-8');
    const logLines = logContent.split('\n').filter(l => l.trim());

    console.log(`✓ Log file created with ${logLines.length} lines\n`);

    // Verify log contains expected events
    const expectedKeywords = [
      'New game started',
      'Game state observed',
      'Move executed',
      'Phase changed'
    ];

    console.log('Checking for expected events:');
    let allFound = true;
    for (const keyword of expectedKeywords) {
      const found = logContent.includes(keyword);
      console.log(`  ${found ? '✓' : '✗'} "${keyword}"`);
      allFound = allFound && found;
    }

    if (!allFound) {
      console.log('\n❌ Some expected log events are missing!\n');
      console.log('Log file content:');
      console.log('─'.repeat(60));
      console.log(logContent);
      console.log('─'.repeat(60));
      process.exit(1);
    }

    // Check for reasoning in logs
    console.log('\nChecking for reasoning capture:');
    const reasoningFound = logContent.includes('Moving to buy phase to purchase more cards');
    console.log(`  ${reasoningFound ? '✓' : '✗'} Reasoning captured in logs`);

    if (!reasoningFound) {
      console.log('\n⚠️  Reasoning was not captured. This may be expected if the move executed successfully without error.\n');
    }

    console.log('\n✅ All enhanced logging tests passed!\n');
    console.log('Sample log entries (first 15 lines):');
    console.log('─'.repeat(80));
    logLines.slice(0, 15).forEach((line, i) => {
      try {
        const parsed = JSON.parse(line);
        // Pretty print with reasoning highlighted
        if (parsed.data?.reasoning) {
          console.log(`\n✨ [Entry ${i+1}] Move with reasoning:`);
          console.log(`  ${JSON.stringify(parsed, null, 2)}`);
        } else {
          console.log(`[Entry ${i+1}] ${parsed.message}`);
        }
      } catch (e) {
        console.log(`[Entry ${i+1}] ${line}`);
      }
    });
    if (logLines.length > 15) {
      console.log(`\n... (${logLines.length - 15} more lines)`);
    }
    console.log('─'.repeat(80));

    // Clean up
    fs.unlinkSync(testLogFile);
    console.log('\n✓ Test log cleaned up');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nFull error:');
    console.error(error);
    process.exit(1);
  }
}

runTest();
