// Re-export basic-ftp types since the package.json types field is missing the .d.ts extension
declare module "basic-ftp" {
  import type { Socket } from "net";
  import type { TLSSocket, ConnectionOptions } from "tls";
  import type { Readable, Writable } from "stream";

  export interface AccessOptions {
    host: string;
    port?: number;
    user?: string;
    password?: string;
    secure?: boolean | "implicit";
    secureOptions?: ConnectionOptions;
  }

  export interface UploadOptions {
    localEndInclusive?: boolean;
  }

  export interface ProgressInfo {
    name: string;
    type: "upload" | "download" | "list";
    bytes: number;
    bytesOverall: number;
  }

  export interface FileInfo {
    name: string;
    type: number;
    size: number;
    rawModifiedAt: string;
    modifiedAt?: Date;
    permissions?: {
      user: number;
      group: number;
      world: number;
    };
    hardLinkCount?: number;
    link?: string;
    group?: string;
    user?: string;
    uniqueID?: string;
    isFile: boolean;
    isDirectory: boolean;
    isSymbolicLink: boolean;
  }

  export interface FTPContext {
    readonly socket: Socket | TLSSocket;
    readonly dataSocket?: Socket | TLSSocket;
    encoding: BufferEncoding;
    verbose: boolean;
    ipFamily: number | undefined;
    tlsOptions: ConnectionOptions;
    log(message: string): void;
  }

  export interface FTPResponse {
    code: number;
    message: string;
  }

  export class FTPError extends Error {
    code: number;
    constructor(response: FTPResponse);
  }

  export class Client {
    ftp: FTPContext;
    closed: boolean;
    availableListCommands: readonly string[];

    constructor(timeout?: number);

    close(): void;
    access(options?: AccessOptions): Promise<FTPResponse>;
    cd(path: string): Promise<FTPResponse>;
    pwd(): Promise<string>;
    list(path?: string): Promise<FileInfo[]>;
    lastMod(path: string): Promise<Date>;
    size(path: string): Promise<number>;
    rename(srcPath: string, destPath: string): Promise<FTPResponse>;
    remove(path: string, ignoreErrorCodes?: boolean): Promise<FTPResponse>;
    uploadFrom(
      source: Readable | string,
      toRemotePath: string,
      options?: UploadOptions,
    ): Promise<FTPResponse>;
    appendFrom(
      source: Readable | string,
      toRemotePath: string,
      options?: UploadOptions,
    ): Promise<FTPResponse>;
    downloadTo(
      destination: Writable | string,
      fromRemotePath: string,
      startAt?: number,
    ): Promise<FTPResponse>;
    ensureDir(remoteDirPath: string): Promise<void>;
    clearWorkingDir(): Promise<void>;
    removeDir(remoteDirPath: string): Promise<void>;
    uploadFromDir(localDirPath: string, remoteDirPath?: string): Promise<void>;
    downloadToDir(localDirPath: string, remoteDirPath?: string): Promise<void>;
    trackProgress(handler?: (info: ProgressInfo) => void): void;
    send(
      command: string,
      ignoreErrorCodes?: boolean,
    ): Promise<FTPResponse>;
    sendIgnoringError(command: string): Promise<FTPResponse>;
    features(): Promise<Map<string, string>>;
  }

  export const FileType: {
    readonly Unknown: 0;
    readonly File: 1;
    readonly Directory: 2;
    readonly SymbolicLink: 3;
  };
}
