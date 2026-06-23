"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduler = void 0;
const logProducer_1 = require("./logProducer");
const databaseWriter_1 = require("./databaseWriter");
const random_1 = require("../utils/random");
class Scheduler {
    config;
    isRunning = false;
    timeoutId = null;
    attackIntervalId = null;
    constructor() {
        // Default configuration (can be overriden via env)
        const benignIntervalMs = parseInt(process.env.SIMULATOR_BENIGN_INTERVAL_MS || '1500', 10);
        const attackIntervalMinutes = parseFloat(process.env.SIMULATOR_ATTACK_INTERVAL_MIN || '3.0');
        const enableDatabase = process.env.SIMULATOR_ENABLE_DB !== 'false';
        const enableStdout = process.env.SIMULATOR_ENABLE_STDOUT !== 'false';
        const chaosFactor = parseFloat(process.env.SIMULATOR_CHAOS_FACTOR || '0.2');
        this.config = {
            benignIntervalMs,
            attackIntervalMinutes,
            enableDatabase,
            enableStdout,
            chaosFactor,
        };
    }
    /**
     * Starts the simulation loop.
     */
    start() {
        if (this.isRunning)
            return;
        this.isRunning = true;
        console.error(`[Scheduler] Starting Log Simulator stream.`);
        console.error(`[Scheduler] Config: ${JSON.stringify(this.config, null, 2)}`);
        console.error(`[Scheduler] Press Ctrl+C to stop.`);
        // Start benign log loop
        this.scheduleNextLog();
        // Start periodic attack scheduler
        const attackMs = this.config.attackIntervalMinutes * 60 * 1000;
        this.attackIntervalId = setInterval(() => {
            if (!logProducer_1.logProducer.isAttackActive()) {
                console.error('[Scheduler] Scheduled trigger: initiating random attack sequence.');
                // Triggering an attack queues it inside logProducer
                logProducer_1.logProducer.getNextLog(1.0); // 100% chance to trigger attack
            }
        }, attackMs);
    }
    /**
     * Schedules the next log production step.
     */
    scheduleNextLog() {
        if (!this.isRunning)
            return;
        // Determine the interval. If an attack is active, we speed up to simulate high packet flow
        const isAttackActive = logProducer_1.logProducer.isAttackActive();
        // Normal interval or fast attack burst (100ms - 300ms)
        let delay = isAttackActive
            ? (0, random_1.randomInt)(150, 400)
            : this.config.benignIntervalMs;
        // Apply chaos factor (adds variability to timing)
        if (!isAttackActive && this.config.chaosFactor > 0) {
            const variation = (Math.random() - 0.5) * 2 * this.config.chaosFactor * delay;
            delay = Math.max(100, delay + variation);
        }
        this.timeoutId = setTimeout(async () => {
            try {
                await this.processStep();
            }
            catch (err) {
                console.error(`[Scheduler] Error in step execution: ${err.message}`);
            }
            this.scheduleNextLog();
        }, delay);
    }
    /**
     * Processes a single log generation step.
     */
    async processStep() {
        // Determine attack chance per step (if not already in attack)
        // Low chance per step, e.g. 0.3% chance per step, since the scheduler also triggers them on interval
        const triggerChance = logProducer_1.logProducer.isAttackActive() ? 0.0 : 0.003;
        const { log, isAttack, attackName } = logProducer_1.logProducer.getNextLog(triggerChance);
        if (isAttack && attackName && logProducer_1.logProducer.isAttackActive() === false) {
            // Log statement when an attack finishes or starts
            // This prints to stderr so it doesn't pollute stdout (which is piped to Python agent)
            console.error(`[Scheduler] Attack sequence completed: ${attackName}`);
        }
        else if (isAttack && attackName && log.message.includes('Accepted') || log.message.includes('Accepted') || log.message.includes('BLOCKED') || log.message.includes('REJECT')) {
            // Log critical attack milestones to stderr
            console.error(`[Scheduler] Attack event: ${attackName} triggered alert vector`);
        }
        // 1. Output to stdout (if enabled)
        if (this.config.enableStdout) {
            // Print the raw message
            console.log(log.message);
        }
        // 2. Output to database (if enabled)
        if (this.config.enableDatabase) {
            await databaseWriter_1.databaseWriter.writeLog(log);
        }
    }
    /**
     * Trigger a specific attack on demand.
     */
    triggerAttack(attackName) {
        const success = logProducer_1.logProducer.triggerAttack(attackName);
        if (success) {
            console.error(`[Scheduler] On-demand trigger: started attack sequence '${attackName}'`);
        }
        return success;
    }
    /**
     * Stops the simulation loop and disconnects database writing.
     */
    async stop() {
        if (!this.isRunning)
            return;
        this.isRunning = false;
        console.error('[Scheduler] Stopping Log Simulator.');
        if (this.timeoutId)
            clearTimeout(this.timeoutId);
        if (this.attackIntervalId)
            clearInterval(this.attackIntervalId);
        if (this.config.enableDatabase) {
            await databaseWriter_1.databaseWriter.disconnect();
        }
    }
    /**
     * Update configuration settings dynamically.
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.error(`[Scheduler] Configuration updated: ${JSON.stringify(this.config, null, 2)}`);
    }
}
exports.scheduler = new Scheduler();
exports.default = exports.scheduler;
