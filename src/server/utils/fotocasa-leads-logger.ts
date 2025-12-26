import fs from "fs";
import path from "path";

// In production (Vercel), the filesystem is read-only, so we only log to console
const isProduction = process.env.NODE_ENV === "production";

/**
 * Logger utility for Fotocasa Leads API operations
 * Writes logs to both console and file (file logging only in development)
 */
class FotocasaLeadsLogger {
  private logFilePath: string | null = null;
  private sessionId: string;

  constructor(accountId?: bigint) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    this.sessionId = timestamp;

    // Only create log files in development
    if (!isProduction) {
      try {
        const logsDir = path.join(process.cwd(), "logs", "fotocasa-leads");
        if (!fs.existsSync(logsDir)) {
          fs.mkdirSync(logsDir, { recursive: true });
        }

        const accountSuffix = accountId ? `-account-${accountId.toString()}` : "";
        this.logFilePath = path.join(
          logsDir,
          `fotocasa-leads-${timestamp}${accountSuffix}.log`,
        );

        // Write header
        this.writeToFile(`=== Fotocasa Leads Sync Session Started ===\n`);
        this.writeToFile(`Session ID: ${this.sessionId}\n`);
        if (accountId) {
          this.writeToFile(`Account ID: ${accountId.toString()}\n`);
        }
        this.writeToFile(`Timestamp: ${new Date().toISOString()}\n`);
        this.writeToFile(`${"=".repeat(80)}\n\n`);
      } catch (error) {
        // If file logging fails, just continue with console logging
        console.warn("[Fotocasa Leads] File logging disabled:", error);
        this.logFilePath = null;
      }
    }
  }

  private writeToFile(message: string): void {
    if (!this.logFilePath) return;

    try {
      fs.appendFileSync(this.logFilePath, message);
    } catch (error) {
      console.error("Failed to write to log file:", error);
    }
  }

  private formatMessage(
    level: string,
    message: string,
    data?: unknown,
  ): string {
    const timestamp = new Date().toISOString();
    let logMessage = `[${timestamp}] [${level}] ${message}\n`;

    if (data !== undefined) {
      const dataStr =
        typeof data === "string" ? data : JSON.stringify(data, null, 2);
      logMessage += `${dataStr}\n`;
    }

    return logMessage;
  }

  info(message: string, data?: unknown): void {
    const formatted = this.formatMessage("INFO", message, data);
    console.log(`[Fotocasa Leads] ${message}`, data ?? "");
    this.writeToFile(formatted);
  }

  error(message: string, data?: unknown): void {
    const formatted = this.formatMessage("ERROR", message, data);
    console.error(`[Fotocasa Leads] ${message}`, data ?? "");
    this.writeToFile(formatted);
  }

  warn(message: string, data?: unknown): void {
    const formatted = this.formatMessage("WARN", message, data);
    console.warn(`[Fotocasa Leads] ${message}`, data ?? "");
    this.writeToFile(formatted);
  }

  debug(message: string, data?: unknown): void {
    const formatted = this.formatMessage("DEBUG", message, data);
    console.log(`[Fotocasa Leads] ${message}`, data ?? "");
    this.writeToFile(formatted);
  }

  section(title: string): void {
    const separator = "=".repeat(80);
    const section = `\n${separator}\n${title}\n${separator}\n`;
    this.writeToFile(section);
    console.log(`[Fotocasa Leads] ${title}`);
  }

  getLogFilePath(): string {
    return this.logFilePath ?? "console-only (production)";
  }
}

// Singleton instance for the current session
let currentLogger: FotocasaLeadsLogger | null = null;

/**
 * Get or create the logger instance for the current session
 */
export function getFotocasaLeadsLogger(
  accountId?: bigint,
): FotocasaLeadsLogger {
  currentLogger ??= new FotocasaLeadsLogger(accountId);
  return currentLogger;
}

/**
 * Reset the logger (for new sessions)
 */
export function resetFotocasaLeadsLogger(accountId?: bigint): void {
  currentLogger = new FotocasaLeadsLogger(accountId);
}




