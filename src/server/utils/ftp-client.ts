/**
 * FTP Client Utility for Idealista Portal Integration
 *
 * Handles FTP file upload for Idealista property exports.
 * Idealista checks the FTP server every 15 minutes for new files.
 */

import { Client, type AccessOptions } from "basic-ftp";

export interface FtpConfig {
  host: string;
  user: string;
  password: string;
  secure?: boolean;
  port?: number;
}

export interface FtpUploadResult {
  success: boolean;
  filename: string;
  error?: string;
  uploadedAt?: string;
}

/**
 * Upload JSON content to Idealista FTP server
 *
 * @param jsonContent - The JSON string to upload
 * @param customerCode - The Idealista customer code (used in filename)
 * @param ftpConfig - FTP connection configuration
 * @returns Upload result with success status and filename
 */
export async function uploadToIdealistaFtp(
  jsonContent: string,
  customerCode: string,
  ftpConfig: FtpConfig,
): Promise<FtpUploadResult> {
  const client = new Client();
  // Disable verbose logging in production
  client.ftp.verbose = process.env.NODE_ENV === "development";

  try {
    // Build access options
    const accessOptions: AccessOptions = {
      host: ftpConfig.host,
      user: ftpConfig.user,
      password: ftpConfig.password,
      secure: ftpConfig.secure ?? true,
      port: ftpConfig.port ?? 21,
    };

    // Connect to FTP server
    await client.access(accessOptions);

    // Generate filename with customer code and timestamp
    // Format: ilc..._{YYYYMMDD}_{HHMMSS}.json
    const now = new Date();
    const timestamp = now
      .toISOString()
      .replace(/[-:]/g, "")
      .replace("T", "_")
      .slice(0, 15);
    const filename = `${customerCode}_${timestamp}.json`;

    // Convert content to buffer for binary upload
    const contentBuffer = Buffer.from(jsonContent, "utf-8");

    // Create a readable stream from the buffer
    const { Readable } = await import("stream");
    const readableStream = Readable.from(contentBuffer);

    // Upload using binary transfer mode (as required by Idealista)
    await client.uploadFrom(readableStream, filename);

    return {
      success: true,
      filename,
      uploadedAt: now.toISOString(),
    };
  } catch (error) {
    console.error("FTP upload error:", error);
    return {
      success: false,
      filename: "",
      error: error instanceof Error ? error.message : "Unknown FTP error",
    };
  } finally {
    // Always close the connection
    client.close();
  }
}

/**
 * Test FTP connection without uploading
 *
 * @param ftpConfig - FTP connection configuration
 * @returns Connection test result
 */
export async function testFtpConnection(
  ftpConfig: FtpConfig,
): Promise<{ success: boolean; error?: string }> {
  const client = new Client();
  client.ftp.verbose = false;

  try {
    await client.access({
      host: ftpConfig.host,
      user: ftpConfig.user,
      password: ftpConfig.password,
      secure: ftpConfig.secure ?? true,
      port: ftpConfig.port ?? 21,
    });

    // Try to list the root directory to verify access
    await client.list();

    return { success: true };
  } catch (error) {
    console.error("FTP connection test failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown FTP error",
    };
  } finally {
    client.close();
  }
}

/**
 * List files in the FTP directory
 *
 * @param ftpConfig - FTP connection configuration
 * @param directory - Optional directory to list (defaults to root)
 * @returns List of files with metadata
 */
export async function listFtpFiles(
  ftpConfig: FtpConfig,
  directory?: string,
): Promise<{
  success: boolean;
  files?: Array<{
    name: string;
    size: number;
    modifiedAt: Date;
    type: "file" | "directory";
  }>;
  error?: string;
}> {
  const client = new Client();
  client.ftp.verbose = false;

  try {
    await client.access({
      host: ftpConfig.host,
      user: ftpConfig.user,
      password: ftpConfig.password,
      secure: ftpConfig.secure ?? true,
      port: ftpConfig.port ?? 21,
    });

    // Navigate to directory if specified
    if (directory) {
      await client.cd(directory);
    }

    const fileList = await client.list();

    const files = fileList.map((file) => ({
      name: file.name,
      size: file.size,
      modifiedAt: file.modifiedAt ?? new Date(),
      type: file.isDirectory ? ("directory" as const) : ("file" as const),
    }));

    return {
      success: true,
      files,
    };
  } catch (error) {
    console.error("FTP list files failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown FTP error",
    };
  } finally {
    client.close();
  }
}

/**
 * Delete a file from the FTP server
 *
 * @param ftpConfig - FTP connection configuration
 * @param filename - Name of the file to delete
 * @returns Deletion result
 */
export async function deleteFtpFile(
  ftpConfig: FtpConfig,
  filename: string,
): Promise<{ success: boolean; error?: string }> {
  const client = new Client();
  client.ftp.verbose = false;

  try {
    await client.access({
      host: ftpConfig.host,
      user: ftpConfig.user,
      password: ftpConfig.password,
      secure: ftpConfig.secure ?? true,
      port: ftpConfig.port ?? 21,
    });

    await client.remove(filename);

    return { success: true };
  } catch (error) {
    console.error("FTP delete file failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown FTP error",
    };
  } finally {
    client.close();
  }
}

/**
 * Download a file from the FTP server and return its content
 *
 * @param ftpConfig - FTP connection configuration
 * @param filename - Name of the file to download
 * @param directory - Optional directory where the file is located
 * @returns File content as string
 */
export async function downloadFtpFile(
  ftpConfig: FtpConfig,
  filename: string,
  directory?: string,
): Promise<{ success: boolean; content?: string; error?: string }> {
  const client = new Client();
  client.ftp.verbose = false;

  try {
    await client.access({
      host: ftpConfig.host,
      user: ftpConfig.user,
      password: ftpConfig.password,
      secure: ftpConfig.secure ?? true,
      port: ftpConfig.port ?? 21,
    });

    // Navigate to directory if specified
    if (directory) {
      await client.cd(directory);
    }

    // Create a writable stream to collect the file content
    const { Writable } = await import("stream");
    const chunks: Buffer[] = [];
    const writableStream = new Writable({
      write(chunk, _encoding, callback) {
        chunks.push(Buffer.from(chunk));
        callback();
      },
    });

    await client.downloadTo(writableStream, filename);
    const content = Buffer.concat(chunks).toString("utf-8");

    return { success: true, content };
  } catch (error) {
    console.error("FTP download file failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown FTP error",
    };
  } finally {
    client.close();
  }
}

/**
 * Delete multiple files from the FTP server in a single connection
 *
 * @param ftpConfig - FTP connection configuration
 * @param filenames - Array of filenames to delete
 * @param directory - Optional directory where files are located
 * @returns Deletion result with count of deleted files
 */
export async function deleteMultipleFtpFiles(
  ftpConfig: FtpConfig,
  filenames: string[],
  directory?: string,
): Promise<{ success: boolean; deletedCount: number; errors: string[] }> {
  const client = new Client();
  client.ftp.verbose = false;
  const errors: string[] = [];
  let deletedCount = 0;

  try {
    await client.access({
      host: ftpConfig.host,
      user: ftpConfig.user,
      password: ftpConfig.password,
      secure: ftpConfig.secure ?? true,
      port: ftpConfig.port ?? 21,
    });

    // Navigate to directory if specified
    if (directory) {
      await client.cd(directory);
    }

    for (const filename of filenames) {
      try {
        await client.remove(filename);
        deletedCount++;
      } catch (err) {
        errors.push(
          `Failed to delete ${filename}: ${err instanceof Error ? err.message : "Unknown error"}`,
        );
      }
    }

    return { success: errors.length === 0, deletedCount, errors };
  } catch (error) {
    console.error("FTP delete multiple files failed:", error);
    return {
      success: false,
      deletedCount,
      errors: [error instanceof Error ? error.message : "Unknown FTP error"],
    };
  } finally {
    client.close();
  }
}
