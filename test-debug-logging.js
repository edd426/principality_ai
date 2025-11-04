#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Import from built packages
const { GameEngine } = require('./packages/core/dist/index.js');
const { Logger } = require('./packages/mcp-server/dist/logger.js');
const { GameSessionTool } = require('./packages/mcp-server/dist/tools/game-session.js');
const { GameObserveTool } = require('./packages/mcp-server/dist/tools/game-observe.js');
const { GameExecuteTool } = require('./packages/mcp-server/dist/tools/game-execute.js');

const testLogFile = path.join(process.cwd(), 'test-debug.log');
if (fs.existsSync(testLogFile)) {
  fs.unlinkSync(testLogFile);
}

console.log('🧪 Debug Logging Test\n');
console.log(`Log file: ${testLogFile}\n`);

async function runTest() {
  try {
    // Create logger with DEBUG level
    const logger = new Logger('debug', 'json', testLogFile);
    console.log('✓ Logger created with DEBUG level\n');

    let currentState = null;
    const setState = (state) => { currentState = state; };
    const getState = () => currentState;

    const gameEngine = new GameEngine('debug-test');
    const sessionTool = new GameSessionTool(gameEngine, 'haiku', setState, getState, logger);
    const observeTool = new GameObserveTool(gameEngine, getState, logger);
    const executeTool = new GameExecuteTool(gameEngine, getState, setState, logger);

    console.log('Starting game...');
    const startResult = await sessionTool.execute({ command: 'new' });
    console.log(`✓ Game started\n`);

    console.log('Observing state...');
    await observeTool.execute({ detail_level: 'standard' });
    console.log(`✓ State observed\n`);

    console.log('Executing move...');
    await executeTool.execute({ 
      move: 'end',
      reasoning: 'Advancing to buy phase'
    });
    console.log(`✓ Move executed\n`);

    console.log('Ending game...');
    await sessionTool.execute({ command: 'end' });
    console.log(`✓ Game ended\n`);

    // Analyze logs
    const logContent = fs.readFileSync(testLogFile, 'utf-8');
    const logLines = logContent.split('\n').filter(l => l.trim() && l.startsWith('{'));

    console.log(`✅ Debug logging enabled! Captured ${logLines.length} JSON log entries\n`);
    console.log('Sample entries (showing log levels):\n');

    logLines.forEach((line, i) => {
      try {
        const entry = JSON.parse(line);
        console.log(`[${i + 1}] Level: ${entry.level.toUpperCase()}, Message: ${entry.message}`);
        if (entry.data?.reasoning) {
          console.log(`     └─ Reasoning: "${entry.data.reasoning}"`);
        }
      } catch (e) {
        // Skip non-JSON lines
      }
    });

    fs.unlinkSync(testLogFile);
    console.log('\n✓ Test log cleaned up');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

runTest();
