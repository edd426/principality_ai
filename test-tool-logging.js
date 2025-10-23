#!/usr/bin/env node

/**
 * Test script to verify tool logging integration
 * Simulates game lifecycle and checks that logs are written
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
const testLogFile = path.join(process.cwd(), 'test-tool-logging.log');
if (fs.existsSync(testLogFile)) {
  fs.unlinkSync(testLogFile);
}

console.log('🧪 Tool Logging Integration Test\n');
console.log(`Log file: ${testLogFile}\n`);

async function runTest() {
  try {
    // Create logger
    const logger = new Logger('info', 'text', testLogFile);
    console.log('✓ Logger created\n');

    // Create game engine
    const gameEngine = new GameEngine('test-seed');
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

    // Observe initial state
    console.log('Observing initial game state...');
    const observeResult = await observeTool.execute({ detail_level: 'standard' });
    if (!observeResult.success) {
      throw new Error('Failed to observe: ' + observeResult.error);
    }
    console.log(`✓ Game state observed (Turn ${observeResult.turnNumber}, Phase: ${observeResult.phase})\n`);

    // Execute a move
    console.log('Executing first move (play 0)...');
    const moveResult = await executeTool.execute({ move: 'play 0', return_detail: 'minimal' });
    if (!moveResult.success) {
      console.log('Move result:', moveResult);
      throw new Error('Failed to execute move: ' + moveResult.error?.message);
    }
    console.log(`✓ Move executed: ${moveResult.message}\n`);

    // End game
    console.log('Ending game...');
    const endResult = await sessionTool.execute({ command: 'end' });
    if (!endResult.success) {
      throw new Error('Failed to end game: ' + endResult.error);
    }
    console.log(`✓ Game ended (Winner: Player ${endResult.winner})\n`);

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
      'Game ended'
    ];

    console.log('Checking log content:');
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

    console.log('\n✅ All tool logging tests passed!\n');
    console.log('Sample log entries:');
    console.log('─'.repeat(60));
    logLines.slice(0, 10).forEach(line => console.log(line));
    if (logLines.length > 10) {
      console.log(`... (${logLines.length - 10} more lines)`);
    }
    console.log('─'.repeat(60));

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
