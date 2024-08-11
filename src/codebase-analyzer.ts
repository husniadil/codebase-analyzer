import { promises as fs } from "node:fs";
import * as path from "node:path";
import { Tiktoken } from "tiktoken/lite";
import model from "tiktoken/encoders/o200k_base";
import { Config, Output, FileNode, ICodebaseAnalyzer } from "./types";
import { formatSize } from "./util";

export class CodebaseAnalyzer implements ICodebaseAnalyzer {
  private readonly directory: string;
  private readonly relevantExtensions: string[];
  private readonly maxFileSize: number;
  private readonly maxTokens: number;
  private readonly ignorePatterns: string[];
  private readonly ignoreFilesWithNoExtension: boolean;
  private readonly memoryLimitMB: number;
  private processedFiles = 0;
  private totalFiles = 0;
  private totalSize = 0;

  constructor(config: Config = {}) {
    const {
      directory = ".",
      relevantExtensions = [
        ".js",
        ".ts",
        ".jsx",
        ".tsx",
        ".json",
        ".java",
        ".kt",
        ".swift",
        ".c",
        ".cpp",
        ".h",
        ".go",
        ".py",
        ".rb",
        ".php",
        ".html",
        ".css",
        ".scss",
        ".less",
      ],
      maxFileSize = 100_000,
      maxTokens = 100_000,
      ignorePatterns = [
        "node_modules",
        "vendor",
        "dist",
        "build",
        "public",
        "android",
        "fastlane",
        "ios",
        "tmp",
        "package.lock.json",
      ],
      ignoreFilesWithNoExtension = true,
      memoryLimitMB = 64,
    } = config;

    if (directory.trim() === "") {
      throw new Error("directory must not be empty.");
    }

    this.directory = path.resolve(directory);
    this.relevantExtensions = relevantExtensions;
    this.maxFileSize = maxFileSize;
    this.maxTokens = maxTokens;
    this.ignorePatterns = ignorePatterns;
    this.ignoreFilesWithNoExtension = ignoreFilesWithNoExtension;
    this.memoryLimitMB = memoryLimitMB;
  }

  private async shouldIgnore(filePath: string): Promise<boolean> {
    const relativePath = path.relative(this.directory, filePath);
    const patterns = this.ignorePatterns.map((pattern) => new RegExp(pattern));
    return (
      relativePath.startsWith(".") ||
      patterns.some((pattern) => pattern.test(relativePath) || pattern.test(path.basename(filePath)))
    );
  }

  private hasExtension(filePath: string): boolean {
    return path.extname(filePath) !== "";
  }

  private async isRelevantFile(filePath: string): Promise<boolean> {
    if (this.ignoreFilesWithNoExtension && !this.hasExtension(filePath)) {
      return false;
    }
    try {
      const stats = await fs.stat(filePath);
      if (!stats.isFile()) return false;
      return stats.size <= this.maxFileSize && this.relevantExtensions.some((ext) => filePath.endsWith(ext));
    } catch (error) {
      console.warn(`Error checking relevance of file ${filePath}:`, error);
      return false;
    }
  }

  private async gatherFiles(dir: string): Promise<FileNode[]> {
    const files: FileNode[] = [];
    try {
      const items = await fs.readdir(dir);

      const filePromises = items.map(async (item) => {
        const fullPath = path.join(dir, item);
        if (await this.shouldIgnore(fullPath)) return null;

        const stats = await fs.stat(fullPath);
        const node: FileNode = {
          name: item,
          path: fullPath,
          size: stats.size,
          isDirectory: stats.isDirectory(),
          children: [],
        };

        if (stats.isDirectory()) {
          node.children = await this.gatherFiles(fullPath);
          if (node.children.length > 0) {
            return node;
          }
        } else if (await this.isRelevantFile(fullPath)) {
          this.totalSize += stats.size;
          return node;
        }
        return null;
      });

      const resolvedFiles = await Promise.all(filePromises);
      for (const file of resolvedFiles) {
        if (file) {
          files.push(file);
        }
      }
    } catch (error) {
      console.warn(`Error gathering files in directory ${dir}:`, error);
    }
    return files;
  }

  private async countTotalFiles(nodes: FileNode[]): Promise<number> {
    const counts = await Promise.all(
      nodes.map(async (node) => {
        if (node.isDirectory) {
          return await this.countTotalFiles(node.children);
        } else {
          return 1;
        }
      }),
    );
    return counts.reduce((acc, count) => acc + count, 0);
  }

  private checkMemoryUsage(): void {
    const usedMemoryMB = process.memoryUsage().heapUsed / 1024 / 1024;
    if (usedMemoryMB > this.memoryLimitMB) {
      console.error(
        `Codebase ~ checkMemoryUsage ~ memory limit exceeded: ${usedMemoryMB.toFixed(
          2,
        )} MB used, limit is ${this.memoryLimitMB} MB.`,
      );
      throw new Error("Your codebase is too large to process. Please try again with a smaller one.");
    }
  }

  private async processFileTree(nodes: FileNode[], context: string[]): Promise<void> {
    for (const node of nodes) {
      if (node.isDirectory) {
        await this.processFileTree(node.children, context);
      } else {
        try {
          const content = await fs.readFile(node.path, "utf-8");
          context.push(`File: ${node.path} (${formatSize(node.size)})\n\n${content.trim()}\n\n${"=".repeat(20)}\n`);
          this.processedFiles++;
        } catch (error) {
          console.warn("Codebase ~ gatherContext ~ error:", node.path, error);
        }
      }
      this.checkMemoryUsage();
    }
  }

  private async gatherContext(fileTree: FileNode[]): Promise<string> {
    this.totalFiles = await this.countTotalFiles(fileTree);
    const context: string[] = [];
    await this.processFileTree(fileTree, context);
    if (context.length === 0) {
      throw new Error("No relevant files found.");
    }
    return context.join("\n");
  }

  private truncateContext(context: string): string {
    const tokens = context.split(/\s+/);
    if (tokens.length > this.maxTokens) {
      console.warn("Context truncated due to token limit.");
      return tokens.slice(0, this.maxTokens).join(" ");
    }
    return context;
  }

  private async countTokens(code: string): Promise<number> {
    const encoder = new Tiktoken(
      model.bpe_ranks,
      model.special_tokens,
      model.pat_str,
    );
    const tokens = encoder.encode(code);
    encoder.free();
    return tokens.length;
  }

  private async buildTreeView(nodes: FileNode[], indent = ""): Promise<string> {
    let treeView = "";
    for (const [index, node] of nodes.entries()) {
      const isLastItem = index === nodes.length - 1;
      const size = node.isDirectory ? "" : ` ${formatSize(node.size)}`;
      treeView += `${indent}${isLastItem ? "└──" : "├──"} ${node.isDirectory ? "📁" : "☰"} ${node.name}${size}\n`;

      if (node.isDirectory) {
        treeView += await this.buildTreeView(node.children, `${indent}${isLastItem ? "    " : "│   "}`);
      }
    }
    return treeView;
  }

  async analyze(): Promise<Output> {
    try {
      const fileNode = await this.gatherFiles(this.directory);
      const context = await this.gatherContext(fileNode);
      const truncatedContext = this.truncateContext(context);
      const tokenCount = await this.countTokens(truncatedContext);
      const treeView = await this.buildTreeView(fileNode);
      return {
        context: truncatedContext,
        tokenCount,
        treeView,
        files: {
          totalSize: this.totalSize,
          totalCount: this.totalFiles,
          processedCount: this.processedFiles,
        },
      };
    } catch (error) {
      console.error("Error generating summary:", error);
      throw error;
    }
  }
}
