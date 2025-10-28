import fs from "fs";
import path from "path";

/**
 * Logger utility for cadastral API operations
 * Writes logs to both console and file
 */
class CadastralLogger {
  private logFilePath: string;
  private sessionId: string;

  constructor() {
    // Create logs directory if it doesn't exist
    const logsDir = path.join(process.cwd(), "logs", "cadastral");
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Create a new log file with timestamp
    this.sessionId = new Date().toISOString().replace(/[:.]/g, "-");
    this.logFilePath = path.join(logsDir, `cadastral-${this.sessionId}.log`);

    // Write header
    this.writeToFile(`=== Cadastral Search Session Started ===\n`);
    this.writeToFile(`Session ID: ${this.sessionId}\n`);
    this.writeToFile(`Timestamp: ${new Date().toISOString()}\n`);
    this.writeToFile(`${"=".repeat(80)}\n\n`);
  }

  private writeToFile(message: string): void {
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
    let formatted = `[${timestamp}] [${level}] ${message}`;

    if (data !== undefined) {
      if (typeof data === "string") {
        formatted += ` ${data}`;
      } else {
        formatted += `\n${JSON.stringify(data, null, 2)}`;
      }
    }

    return formatted + "\n";
  }

  log(message: string, data?: unknown): void {
    const formatted = this.formatMessage("INFO", message, data);
    console.log(message, data ?? "");
    this.writeToFile(formatted);
  }

  error(message: string, data?: unknown): void {
    const formatted = this.formatMessage("ERROR", message, data);
    console.error(message, data ?? "");
    this.writeToFile(formatted);
  }

  separator(char = "=", length = 80): void {
    const line = char.repeat(length);
    console.log(line);
    this.writeToFile(line + "\n");
  }

  getLogFilePath(): string {
    return this.logFilePath;
  }

  getSessionId(): string {
    return this.sessionId;
  }
}

/**
 * Create a new logger instance for a cadastral search session
 */
export function createCadastralLogger(): CadastralLogger {
  return new CadastralLogger();
}
