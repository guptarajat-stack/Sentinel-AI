"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseWriter = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class DatabaseWriter {
    queue = [];
    batchSize = 50;
    flushIntervalMs = 1000;
    intervalId = null;
    isConnected = false;
    isInitializing = false;
    constructor() {
        this.initializeConnection();
    }
    async initializeConnection() {
        if (this.isInitializing || this.isConnected)
            return;
        this.isInitializing = true;
        try {
            // Test the database connection
            await prisma.$connect();
            this.isConnected = true;
            console.error('[DatabaseWriter] Successfully connected to PostgreSQL.');
            this.startFlushTimer();
        }
        catch (err) {
            console.error(`[DatabaseWriter] Database connection failed: ${err.message}. Simulator will run in stdout-only mode.`);
            this.isConnected = false;
        }
        finally {
            this.isInitializing = false;
        }
    }
    /**
     * Queue a log entry for database insertion.
     */
    async writeLog(entry) {
        if (!this.isConnected) {
            // Try to reconnect if not connected yet
            this.initializeConnection();
            return;
        }
        this.queue.push(entry);
        if (this.queue.length >= this.batchSize) {
            await this.flush();
        }
    }
    startFlushTimer() {
        if (this.intervalId)
            clearInterval(this.intervalId);
        this.intervalId = setInterval(async () => {
            if (this.queue.length > 0) {
                await this.flush();
            }
        }, this.flushIntervalMs);
    }
    /**
     * Flush the queued logs into the SecurityLog table.
     */
    async flush() {
        if (this.queue.length === 0)
            return;
        const batch = [...this.queue];
        this.queue = [];
        try {
            // Map SecurityLogEntry to the database schema schema fields
            // Details must be stringified or kept as JSON since Prisma handles JSON types
            const dataToInsert = batch.map(log => ({
                timestamp: log.timestamp,
                source: log.source,
                logLevel: log.logLevel,
                message: log.message,
                details: log.details, // details is Json? in schema
                incidentId: null
            }));
            await prisma.securityLog.createMany({
                data: dataToInsert,
            });
        }
        catch (err) {
            console.error(`[DatabaseWriter] Failed to write logs to database: ${err.message}.`);
            // If write fails, we drop the batch to prevent memory leak and continue
        }
    }
    /**
     * Gracefully close the database client.
     */
    async disconnect() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        // Flush remaining logs
        await this.flush();
        try {
            await prisma.$disconnect();
            console.error('[DatabaseWriter] Disconnected from PostgreSQL.');
        }
        catch (err) {
            console.error(`[DatabaseWriter] Error during database disconnect: ${err.message}`);
        }
    }
}
exports.databaseWriter = new DatabaseWriter();
exports.default = exports.databaseWriter;
