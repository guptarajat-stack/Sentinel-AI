"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDatabaseLog = generateDatabaseLog;
const random_1 = require("../utils/random");
const constants_1 = require("../utils/constants");
/**
 * Generates a benign database audit log entry.
 */
function generateDatabaseLog() {
    const timestamp = new Date();
    const pid = (0, random_1.randomInt)(100, 32000);
    const dbUser = (0, random_1.randomElement)(['postgres', 'app_user', 'soc_dev']);
    const dbName = 'ai_security_soc';
    const query = (0, random_1.randomElement)(constants_1.BENIGN_DB_QUERIES);
    const execTime = (Math.random() * 5).toFixed(3);
    // PostgreSQL timestamp format: "YYYY-MM-DD HH:mm:ss UTC"
    const formattedDate = timestamp.toISOString().replace('T', ' ').replace('Z', ' UTC').substring(0, 23);
    const events = [
        // Standard query logging
        () => {
            const msg = `${formattedDate} [${pid}] ${dbUser}@${dbName} LOG:  statement: ${query}`;
            return {
                timestamp,
                source: 'database',
                logLevel: 'INFO',
                message: msg,
                details: { process: 'postgres', pid, event: 'query_execution', db_user: dbUser, db_name: dbName, query, execution_time_ms: parseFloat(execTime) }
            };
        },
        // Database connection authorized
        () => {
            const clientPort = (0, random_1.randomInt)(32000, 61000);
            const clientIp = '127.0.0.1';
            const msg = `${formattedDate} [${pid}] [unknown]@[unknown] LOG:  connection authorized: user=${dbUser} database=${dbName} SSL enabled`;
            return {
                timestamp,
                source: 'database',
                logLevel: 'INFO',
                message: msg,
                details: { process: 'postgres', pid, event: 'connection_authorized', db_user: dbUser, db_name: dbName, client_ip: clientIp, port: clientPort }
            };
        },
        // Database vacuum/checkpoint log
        () => {
            const msg = `${formattedDate} [${pid}] postgres@${dbName} LOG:  checkpoint starting: time`;
            const msgDone = `${formattedDate} [${pid}] postgres@${dbName} LOG:  checkpoint complete: wrote 45 buffers (0.1%); 1 transaction log file(s) added`;
            const finalMsg = Math.random() > 0.5 ? msg : msgDone;
            return {
                timestamp,
                source: 'database',
                logLevel: 'INFO',
                message: finalMsg,
                details: { process: 'postgres', pid, event: 'checkpoint', db_user: 'postgres', db_name: dbName }
            };
        }
    ];
    return (0, random_1.randomElement)(events)();
}
