"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logProducer = void 0;
const authLogs_1 = require("../generators/authLogs");
const networkLogs_1 = require("../generators/networkLogs");
const webLogs_1 = require("../generators/webLogs");
const systemLogs_1 = require("../generators/systemLogs");
const databaseLogs_1 = require("../generators/databaseLogs");
const bruteForce_1 = require("../attacks/bruteForce");
const sqlInjection_1 = require("../attacks/sqlInjection");
const xssAttack_1 = require("../attacks/xssAttack");
const portScan_1 = require("../attacks/portScan");
const privilegeEscalation_1 = require("../attacks/privilegeEscalation");
const suspiciousLogin_1 = require("../attacks/suspiciousLogin");
const random_1 = require("../utils/random");
class LogProducer {
    attackQueue = [];
    activeAttackName = null;
    /**
     * Generates a single log entry.
     * If an attack simulation is currently active, it returns the next attack log.
     * Otherwise, it generates a benign background log or potentially triggers a new attack.
     */
    getNextLog(triggerAttackChance = 0.01) {
        // 1. If we are currently executing an attack sequence, pull from the queue
        if (this.attackQueue.length > 0) {
            const log = this.attackQueue.shift();
            // Update timestamp to current time to make it feel "real-time"
            log.timestamp = new Date();
            return {
                log,
                isAttack: true,
                attackName: this.activeAttackName
            };
        }
        this.activeAttackName = null;
        // 2. Randomly decide whether to trigger an attack sequence (e.g. 1% chance per step)
        if ((0, random_1.randomChance)(triggerAttackChance)) {
            this.triggerRandomAttack();
            if (this.attackQueue.length > 0) {
                const log = this.attackQueue.shift();
                log.timestamp = new Date();
                return {
                    log,
                    isAttack: true,
                    attackName: this.activeAttackName
                };
            }
        }
        // 3. Otherwise, generate a standard benign background log
        const benignGenerators = [
            networkLogs_1.generateNetworkLog,
            webLogs_1.generateWebLog,
            databaseLogs_1.generateDatabaseLog,
            systemLogs_1.generateSystemLog,
            authLogs_1.generateAuthLog
        ];
        const weights = [0.35, 0.30, 0.15, 0.10, 0.10]; // Sums to 1.0
        const generator = (0, random_1.weightedRandom)(benignGenerators, weights);
        const log = generator();
        log.timestamp = new Date(); // Ensure current time
        return {
            log,
            isAttack: false,
            attackName: null
        };
    }
    /**
     * Triggers a specific attack by name.
     */
    triggerAttack(attackName) {
        let logs = [];
        switch (attackName) {
            case 'bruteForce':
                logs = (0, bruteForce_1.simulateBruteForce)();
                break;
            case 'sqlInjection':
                logs = (0, sqlInjection_1.simulateSqlInjection)();
                break;
            case 'xssAttack':
                logs = (0, xssAttack_1.simulateXss)();
                break;
            case 'portScan':
                logs = (0, portScan_1.simulatePortScan)();
                break;
            case 'privilegeEscalation':
                logs = (0, privilegeEscalation_1.simulatePrivilegeEscalation)();
                break;
            case 'suspiciousLogin':
                logs = (0, suspiciousLogin_1.simulateSuspiciousLogin)();
                break;
            default:
                return false;
        }
        if (logs.length > 0) {
            this.attackQueue = logs;
            this.activeAttackName = attackName;
            return true;
        }
        return false;
    }
    /**
     * Triggers a random attack from the available list.
     */
    triggerRandomAttack() {
        const attacks = ['bruteForce', 'sqlInjection', 'xssAttack', 'portScan', 'privilegeEscalation', 'suspiciousLogin'];
        const chosenAttack = (0, random_1.randomElement)(attacks);
        this.triggerAttack(chosenAttack);
    }
    /**
     * Returns whether an attack is currently in progress.
     */
    isAttackActive() {
        return this.attackQueue.length > 0;
    }
}
exports.logProducer = new LogProducer();
exports.default = exports.logProducer;
