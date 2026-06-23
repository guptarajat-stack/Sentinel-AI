import { PrismaClient } from '@prisma/client';
import { SecurityLogEntry } from '../types/log';

const prisma = new PrismaClient();

class DatabaseWriter {
  private queue: SecurityLogEntry[] = [];
  private batchSize = 50;
  private flushIntervalMs = 1000;
  private intervalId: NodeJS.Timeout | null = null;
  private isConnected = false;
  private isInitializing = false;

  constructor() {
    this.initializeConnection();
  }

  private async initializeConnection() {
    if (this.isInitializing || this.isConnected) return;
    this.isInitializing = true;
    
    try {
      // Test the database connection
      await prisma.$connect();
      this.isConnected = true;
      console.error('[DatabaseWriter] Successfully connected to PostgreSQL.');
      this.startFlushTimer();
    } catch (err: any) {
      console.error(`[DatabaseWriter] Database connection failed: ${err.message}. Simulator will run in stdout-only mode.`);
      this.isConnected = false;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Queue a log entry for database insertion.
   */
  public async writeLog(entry: SecurityLogEntry): Promise<void> {
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

  private startFlushTimer() {
    if (this.intervalId) clearInterval(this.intervalId);
    
    this.intervalId = setInterval(async () => {
      if (this.queue.length > 0) {
        await this.flush();
      }
    }, this.flushIntervalMs);
  }

  /**
   * Flush the queued logs into the SecurityLog table.
   */
  private async flush(): Promise<void> {
    if (this.queue.length === 0) return;

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
        details: log.details as any, // details is Json? in schema
        incidentId: null
      }));

      await prisma.securityLog.createMany({
        data: dataToInsert,
      });
    } catch (err: any) {
      console.error(`[DatabaseWriter] Failed to write logs to database: ${err.message}.`);
      // If write fails, we drop the batch to prevent memory leak and continue
    }
  }

  /**
   * Gracefully close the database client.
   */
  public async disconnect(): Promise<void> {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    // Flush remaining logs
    await this.flush();
    
    try {
      await prisma.$disconnect();
      console.error('[DatabaseWriter] Disconnected from PostgreSQL.');
    } catch (err: any) {
      console.error(`[DatabaseWriter] Error during database disconnect: ${err.message}`);
    }
  }
}

export const databaseWriter = new DatabaseWriter();
export default databaseWriter;
