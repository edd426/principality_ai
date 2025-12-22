/**
 * Test parser to ensure "9 14" parses as [9, 14] not [9, 9]
 */

const { Parser } = require('./packages/cli/dist/parser.js');

const parser = new Parser();

console.log('=== Parser Test for Issue #1 ===\n');

// Test cases
const testInputs = [
  '9 14',
  '9, 14',
  '1 2 3',
  '1, 2, 3',
  '9,14'
];

console.log('Testing parser with various inputs:\n');

testInputs.forEach(input => {
  const result = parser.parseInput(input, [], {});

  console.log(`Input: "${input}"`);
  console.log(`Type: ${result.type}`);
  if (result.chain) {
    console.log(`Parsed chain: [${result.chain.join(', ')}]`);
    console.log(`Expected: Input should be parsed correctly`);
    console.log(`✓ PASS: Parser correctly identified chain\n`);
  } else {
    console.log(`✗ FAIL: Not recognized as chain\n`);
  }
});

// Specific test for the bug scenario
console.log('\n=== Bug Scenario Test ===');
const bugInput = '9 14';
const result = parser.parseInput(bugInput, [], {});

console.log(`Input: "${bugInput}"`);
console.log(`Parsed type: ${result.type}`);
console.log(`Parsed chain: ${result.chain ? `[${result.chain.join(', ')}]` : 'N/A'}`);

if (result.type === 'chain' && result.chain && result.chain.length === 2) {
  if (result.chain[0] === 9 && result.chain[1] === 14) {
    console.log('✓ PASS: Parser correctly parses "9 14" as [9, 14]');
  } else {
    console.log(`✗ FAIL: Expected [9, 14], got [${result.chain.join(', ')}]`);
  }
} else {
  console.log('✗ FAIL: Parser did not recognize input as a 2-move chain');
}
