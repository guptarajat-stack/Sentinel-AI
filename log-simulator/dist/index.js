"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
const scheduler_1 = require("./services/scheduler");
// Load environment variables from .env in log-simulator directory, or search parent directory if not found
dotenv.config();
dotenv.config({ path: path.join(__dirname, '../../backend/.env') }); // Fallback to backend .env if available
// Simple Command Line Argument Parser
function parseArgs() {
    const args = process.argv.slice(2);
    const params = {};
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--help' || arg === '-h') {
            printHelp();
            process.exit(0);
        }
        else if (arg === '--no-db') {
            params.noDb = true;
        }
        else if (arg === '--no-stdout') {
            params.noStdout = true;
        }
        else if (arg.startsWith('--interval=')) {
            params.interval = arg.split('=')[1];
        }
        else if (arg === '--interval' && args[i + 1]) {
            params.interval = args[++i];
        }
        else if (arg.startsWith('--attack-interval=')) {
            params.attackInterval = arg.split('=')[1];
        }
        else if (arg === '--attack-interval' && args[i + 1]) {
            params.attackInterval = args[++i];
        }
        else if (arg.startsWith('--attack=')) {
            params.attack = arg.split('=')[1];
        }
        else if (arg === '--attack' && args[i + 1]) {
            params.attack = args[++i];
        }
        else if (arg.startsWith('--chaos=')) {
            params.chaos = arg.split('=')[1];
        }
        else if (arg === '--chaos' && args[i + 1]) {
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
    const shutdown = async (signal) => {
        console.error(`\n[Main] Received ${signal}. Shutting down...`);
        await scheduler_1.scheduler.stop();
        console.error('[Main] Shutdown complete.');
        process.exit(0);
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    // Start the simulation loop
    scheduler_1.scheduler.start();
    // If a specific attack was requested on startup, trigger it
    if (params.attack) {
        const attackName = String(params.attack);
        const success = scheduler_1.scheduler.triggerAttack(attackName);
        if (!success) {
            console.error(`[Main] Error: Unknown attack type '${attackName}'. Run with --help to see choices.`);
        }
    }
}
main().catch(err => {
    console.error('[Main] Fatal execution error:', err);
    process.exit(1);
});
