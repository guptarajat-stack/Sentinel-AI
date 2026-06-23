import { SecurityLogEntry } from '../types/log';
import { generateAuthLog } from '../generators/authLogs';
import { generateNetworkLog } from '../generators/networkLogs';
import { generateWebLog } from '../generators/webLogs';
import { generateSystemLog } from '../generators/systemLogs';
import { generateDatabaseLog } from '../generators/databaseLogs';

import { simulateBruteForce } from '../attacks/bruteForce';
import { simulateSqlInjection } from '../attacks/sqlInjection';
import { simulateXss } from '../attacks/xssAttack';
import { simulatePortScan } from '../attacks/portScan';
import { simulatePrivilegeEscalation } from '../attacks/privilegeEscalation';
import { simulateSuspiciousLogin } from '../attacks/suspiciousLogin';

import { weightedRandom, randomElement, randomChance } from '../utils/random';

class LogProducer {
  private attackQueue: SecurityLogEntry[] = [];
  private activeAttackName: string | null = null;

  /**
   * Generates a single log entry.
   * If an attack simulation is currently active, it returns the next attack log.
   * Otherwise, it generates a benign background log or potentially triggers a new attack.
   */
  public getNextLog(triggerAttackChance = 0.01): { log: SecurityLogEntry; isAttack: boolean; attackName: string | null } {
    // 1. If we are currently executing an attack sequence, pull from the queue
    if (this.attackQueue.length > 0) {
      const log = this.attackQueue.shift()!;
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
    if (randomChance(triggerAttackChance)) {
      this.triggerRandomAttack();
      if (this.attackQueue.length > 0) {
        const log = this.attackQueue.shift()!;
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
      generateNetworkLog,
      generateWebLog,
      generateDatabaseLog,
      generateSystemLog,
      generateAuthLog
    ];
    const weights = [0.35, 0.30, 0.15, 0.10, 0.10]; // Sums to 1.0

    const generator = weightedRandom(benignGenerators, weights);
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
  public triggerAttack(attackName: string): boolean {
    let logs: SecurityLogEntry[] = [];
    
    switch (attackName) {
      case 'bruteForce':
        logs = simulateBruteForce();
        break;
      case 'sqlInjection':
        logs = simulateSqlInjection();
        break;
      case 'xssAttack':
        logs = simulateXss();
        break;
      case 'portScan':
        logs = simulatePortScan();
        break;
      case 'privilegeEscalation':
        logs = simulatePrivilegeEscalation();
        break;
      case 'suspiciousLogin':
        logs = simulateSuspiciousLogin();
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
  private triggerRandomAttack(): void {
    const attacks = ['bruteForce', 'sqlInjection', 'xssAttack', 'portScan', 'privilegeEscalation', 'suspiciousLogin'];
    const chosenAttack = randomElement(attacks);
    this.triggerAttack(chosenAttack);
  }

  /**
   * Returns whether an attack is currently in progress.
   */
  public isAttackActive(): boolean {
    return this.attackQueue.length > 0;
  }
}

export const logProducer = new LogProducer();
export default logProducer;
