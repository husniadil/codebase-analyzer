import { describe, it, expect } from "@jest/globals";
import { CodebaseAnalyzer } from "../src/codebase-analyzer";
import path from "path";

describe("CodebaseAnalyzer", () => {
  describe("constructor", () => {
    it("should create an instance with default config", () => {
      const analyzer = new CodebaseAnalyzer();
      expect(analyzer).toBeInstanceOf(CodebaseAnalyzer);
      expect(analyzer["directory"]).toBe(path.resolve("."));
      expect(analyzer["relevantExtensions"]).toEqual([
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
      ]);
      expect(analyzer["maxFileSize"]).toBe(100_000);
      expect(analyzer["maxTokens"]).toBe(100_000);
      expect(analyzer["ignorePatterns"]).toEqual([
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
      ]);
      expect(analyzer["ignoreFilesWithNoExtension"]).toBe(true);
      expect(analyzer["memoryLimitMB"]).toBe(64);
    });

    it("should create an instance with custom config", () => {
      const config = {
        directory: "./dist",
        relevantExtensions: [".js", ".ts"],
        maxFileSize: 50_000,
        maxTokens: 50_000,
        ignorePatterns: ["node_modules"],
        ignoreFilesWithNoExtension: false,
        memoryLimitMB: 128,
      };
      const analyzer = new CodebaseAnalyzer(config);
      expect(analyzer).toBeInstanceOf(CodebaseAnalyzer);
      expect(analyzer["directory"]).toBe(path.resolve("./dist"));
      expect(analyzer["relevantExtensions"]).toEqual([".js", ".ts"]);
      expect(analyzer["maxFileSize"]).toBe(50_000);
      expect(analyzer["maxTokens"]).toBe(50_000);
      expect(analyzer["ignorePatterns"]).toEqual(["node_modules"]);
      expect(analyzer["ignoreFilesWithNoExtension"]).toBe(false);
      expect(analyzer["memoryLimitMB"]).toBe(128);
    });

    it("should throw an error if directory is empty", () => {
      expect(() => new CodebaseAnalyzer({ directory: "" })).toThrowError("directory must not be empty.");
    });
  });

  describe("shouldIgnore", () => {
    it("should return true if filePath matches any ignore pattern", async () => {
      const analyzer = new CodebaseAnalyzer();
      const filePath = "./node_modules/package/index.js";
      const result = await analyzer["shouldIgnore"](filePath);
      expect(result).toBe(true);
    });

    it("should return false if filePath does not match any ignore pattern", async () => {
      const analyzer = new CodebaseAnalyzer();
      const filePath = "./src/index.ts";
      const result = await analyzer["shouldIgnore"](filePath);
      expect(result).toBe(false);
    });
  });

  describe("hasExtension", () => {
    it("should return true if filePath has a valid extension", () => {
      const analyzer = new CodebaseAnalyzer();
      const filePath = "./src/index.ts";
      const result = analyzer["hasExtension"](filePath);
      expect(result).toBe(true);
    });

    it("should return false if filePath does not have a valid extension", () => {
      const analyzer = new CodebaseAnalyzer();
      const filePath = "./src/index";
      const result = analyzer["hasExtension"](filePath);
      expect(result).toBe(false);
    });
  });

  describe("isRelevantFile", () => {
    it("should return true if filePath is a relevant file", async () => {
      const analyzer = new CodebaseAnalyzer();
      const filePath = "./src/index.ts";
      const result = await analyzer["isRelevantFile"](filePath);
      expect(result).toBe(true);
    });

    it("should return false if filePath is not a relevant file", async () => {
      const analyzer = new CodebaseAnalyzer();
      const filePath = "./README.md";
      const result = await analyzer["isRelevantFile"](filePath);
      expect(result).toBe(false);
    });
  });

  describe("gatherFiles", () => {
    it("should return an array of FileNode objects", async () => {
      const analyzer = new CodebaseAnalyzer();
      const dir = "./src";
      const result = await analyzer["gatherFiles"](dir);
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("name");
      expect(result[0]).toHaveProperty("path");
      expect(result[0]).toHaveProperty("isDirectory");
    });
  });
});
