export type Config = {
  directory?: string;
  relevantExtensions?: string[];
  maxFileSize?: number;
  enableTokenCounting?: boolean;
  maxTokens?: number;
  ignorePatterns?: string[];
  ignoreFilesWithNoExtension?: boolean;
  memoryLimitMB?: number;
};

export type Output = {
  context: string;
  tokenCount: number;
  treeView: string;
  files: {
    totalSize: number;
    totalCount: number;
    processedCount: number;
  };
};

export type FileNode = {
  name: string;
  path: string;
  size: number;
  isDirectory: boolean;
  children: FileNode[];
};

export interface ICodebaseAnalyzer {
  analyze(): Promise<Output>;
}
