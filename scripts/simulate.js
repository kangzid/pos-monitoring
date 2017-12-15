/**
 * ESP32 Simulator - Simulates button presses without real hardware
 * Run this instead of using real ESP32
 */

const http = require('http');

const SERVER_URL = 'http://192.168.100.50:3000';

// Simulated button pins (not used, just for reference)
const POS_PINS = [
  { posId: 1, startPin: 13, stopPin: 12 },
  { posId: 2, startPin: 14, stopPin: 27 },
  { posId: 3, startPin: 26, stopPin: 25 },
  { posId: 4, startPin: 33, stopPin: 32 },
  { posId: 5, startPin: 23, stopPin: 22 }
];

// Send log to server
function sendLog(posId, action) {
  const postData = JSON.stringify({
    pos_id: posId,
    action: action
  });

  const url = new URL(SERVER_URL + '/api/log');
  const options = {
    hostname: url.hostname,
    port: url.port || 3000,
    path: '/api/log',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`✓ POS${posId} ${action} sent, Server response: ${data}`);
        resolve(JSON.parse(data));
      });
    });

    req.on('error', (e) => {
      console.error(`✗ Connection error: ${e.message}`);
      console.log('  Make sure server is running: cd server && npm start');
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

// Format time for display
function getTime() {
  return new Date().toLocaleTimeString('id-ID');
}

// Interactive CLI
async function showMenu() {
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║     ESP32 Simulator - POS Time Monitor    ║');
  console.log('╠═══════════════════════════════════════════╣');
  console.log('║  1. POS 1 START   2. POS 1 STOP            ║');
  console.log('║  3. POS 2 START   4. POS 2 STOP            ║');
  console.log('║  5. POS 3 START   6. POS 3 STOP            ║');
  console.log('║  7. POS 4 START   8. POS 4 STOP            ║');
  console.log('║  9. POS 5 START   0. POS 5 STOP            ║');
  console.log('╠═══════════════════════════════════════════╣');
  console.log('║  S. Auto-Start All   A. Auto-All Stop      ║');
  console.log('║  R. Random Action    Q. Quit               ║');
  console.log('╚═══════════════════════════════════════════╝');
  console.log('');
  process.stdout.write('Select option: ');
}

// Parse choice
function parseChoice(choice) {
  const num = parseInt(choice);
  if (num >= 1 && num <= 9) {
    const posId = Math.ceil(num / 2);
    const action = num % 2 === 1 ? 'START' : 'STOP';
    return { posId, action };
  }
  if (choice.toLowerCase() === 's') {
    return { mode: 'auto-start' };
  }
  if (choice.toLowerCase() === 'a') {
    return { mode: 'auto-stop' };
  }
  if (choice.toLowerCase() === 'r') {
    return { mode: 'random' };
  }
  return null;
}

// Auto mode - start all
async function autoStartAll() {
  console.log('\n[Auto] Starting all POS...');
  for (let i = 1; i <= 5; i++) {
    await sendLog(i, 'START');
    await delay(100);
  }
  console.log('[Auto] All POS started!\n');
}

// Auto mode - stop all
async function autoStopAll() {
  console.log('\n[Auto] Stopping all POS...');
  for (let i = 1; i <= 5; i++) {
    await sendLog(i, 'STOP');
    await delay(100);
  }
  console.log('[Auto] All POS stopped!\n');
}

// Random action
async function randomAction() {
  const posId = Math.floor(Math.random() * 5) + 1;
  const action = Math.random() > 0.5 ? 'START' : 'STOP';
  console.log(`\n[Random] POS${posId} ${action}`);
  await sendLog(posId, action);
  console.log('');
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main
async function main() {
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║         ESP32 Simulator Started            ║');
  console.log('║    (Without real hardware)                ║');
  console.log('╚═══════════════════════════════════════════╝');
  console.log(`Server: ${SERVER_URL}`);
  console.log(`Time: ${getTime()}\n`);

  // Test connection first
  try {
    console.log('Testing connection to server...');
    await sendLog(1, 'START');
    await sendLog(1, 'STOP');
    console.log('Connection successful!\n');
  } catch (e) {
    console.log('\n⚠️  Cannot connect to server.');
    console.log('   Start server first: cd server && npm start\n');
  }

  showMenu();

  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.on('line', async (input) => {
    const choice = input.trim().toLowerCase();

    if (choice === 'q') {
      console.log('\nExiting simulator...');
      rl.close();
      process.exit(0);
    }

    const parsed = parseChoice(choice);

    if (parsed) {
      if (parsed.mode === 'auto-start') {
        await autoStartAll();
      } else if (parsed.mode === 'auto-stop') {
        await autoStopAll();
      } else if (parsed.mode === 'random') {
        await randomAction();
      } else {
        console.log(`\n[${getTime()}] POS${parsed.posId} ${parsed.action}`);
        await sendLog(parsed.posId, parsed.action);
      }
    } else {
      console.log('Invalid option!');
    }

    showMenu();
  });
}

main();