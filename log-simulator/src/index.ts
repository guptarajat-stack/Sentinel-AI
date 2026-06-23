import * as dotenv from 'dotenv';
import * as path from 'path';
import { scheduler } from './services/scheduler';

// Load environment variables from .env in log-simulator directory, or search parent directory if not found
dotenv.config();
dotenv.config({ path: path.join(__dirname, '../../backend/.env') }); // Fallback to backend .env if available

// Simple Command Line Argument Parser
function parseArgs() {
  const args = process.argv.slice(2);
  const params: Record<string, string | boolean> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else if (arg === '--no-db') {
      params.noDb = true;
    } else if (arg === '--no-stdout') {
      params.noStdout = true;
    } else if (arg.startsWith('--interval=')) {
      params.interval = arg.split('=')[1];
    } else if (arg === '--interval' && args[i + 1]) {
      params.interval = args[++i];
    } else if (arg.startsWith('--attack-interval=')) {
      params.attackInterval = arg.split('=')[1];
    } else if (arg === '--attack-interval' && args[i + 1]) {
      params.attackInterval = args[++i];
    } else if (arg.startsWith('--attack=')) {
      params.attack = arg.split('=')[1];
    } else if (arg === '--attack' && args[i + 1]) {
      params.attack = args[++i];
    } else if (arg.startsWith('--chaos=')) {
      params.chaos = arg.split('=')[1];
    } else if (arg === '--chaos' && args[i + 1]) {
      params.chaos = args[++i];
    }
  }

  return params;
}

function printHelp() {
  console.log(`
AI Security SOC - Security Log Simulator (TypeScript)
=====================================================
Usage:
  npm run dev [options]
  node dist/index.js [options]

Options:
  -h, --help                  Show this help menu
  --interval <ms>             Interval in milliseconds between benign logs (default: 1500)
  --attack-interval <min>     Interval in minutes between automated attacks (default: 3.0)
  --attack <name>             Trigger a specific attack sequence immediately on startup.
                              Available: bruteForce, sqlInjection, xssAttack, portScan, privilegeEscalation, suspiciousLogin
  --chaos <value>             Timing variability factor from 0.0 to 1.0 (default: 0.2)
  --no-db                     Disable writing logs to the PostgreSQL database
  --no-stdout                 Disable printing logs to stdout (stdout is enabled by default)

Environment Variables (read from .env or system):
  DATABASE_URL                PostgreSQL connection string
  SIMULATOR_BENIGN_INTERVAL_MS   Override benign interval
  SIMULATOR_ATTACK_INTERVAL_MIN  Override attack interval
  SIMULATOR_ENABLE_DB         Set to 'false' to disable database writing
  SIMULATOR_ENABLE_STDOUT     Set to 'false' to disable stdout printing
  SIMULATOR_CHAOS_FACTOR      Override chaos factor
`);
}

async function main() {
  const params = parseArgs();

  // Apply CLI arguments over environment variables
  if (params.noDb) {
    process.env.SIMULATOR_ENABLE_DB = 'false';
  }
  if (params.noStdout) {
    process.env.SIMULATOR_ENABLE_STDOUT = 'false';
  }
  if (params.interval) {
    process.env.SIMULATOR_BENIGN_INTERVAL_MS = String(params.interval);
  }
  if (params.attackInterval) {
    process.env.SIMULATOR_ATTACK_INTERVAL_MIN = String(params.attackInterval);
  }
  if (params.chaos) {
    process.env.SIMULATOR_CHAOS_FACTOR = String(params.chaos);
  }

  // Setup termination handlers for graceful database disconnect
  const shutdown = async (signal: string) => {
    console.error(`\n[Main] Received ${signal}. Shutting down...`);
    await scheduler.stop();
    console.error('[Main] Shutdown complete.');
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // Start the simulation loop
  scheduler.start();

  // If a specific attack was requested on startup, trigger it
  if (params.attack) {
    const attackName = String(params.attack);
    const success = scheduler.triggerAttack(attackName);
    if (!success) {
      console.error(`[Main] Error: Unknown attack type '${attackName}'. Run with --help to see choices.`);
    }
  }
}

main().catch(err => {
  console.error('[Main] Fatal execution error:', err);
  process.exit(1);
});
