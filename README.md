# Codebase Analyzer

The Codebase Analyzer is a utility for analyzing codebases. It helps in gathering file information, counting tokens, and ensuring memory usage stays within specified limits.

## Installation

To use the Codebase Analyzer in your project, install it via npm:

```sh
npm install @husniadil/codebase-analyzer
```

## Usage

Here is an example of how to use the Codebase Analyzer in your application:

### Importing and Configuring

First, import the CodebaseAnalyzer class and configure it according to your needs:

```typescript
import { CodebaseAnalyzer } from "codebase-analyzer";
import { Config } from "codebase-analyzer/types";

const config: Config = {
  directory: "./src",
  relevantExtensions: [".ts", ".js"],
  maxFileSize: 200_000,
  maxTokens: 50_000,
  ignorePatterns: ["node_modules", "dist"],
  ignoreFilesWithNoExtension: true,
  memoryLimitMB: 128,
};

const analyzer = new CodebaseAnalyzer(config);
```

### Analyzing the Codebase

To analyze the codebase, call the analyze method:

```typescript
analyzer.analyze().then((output) => {
  console.log("Analysis Output:", output);
}).catch((error) => {
  console.error("Error during analysis:", error);
});
```

### Example Configuration

Here is a more detailed example configuration:

```typescript
const config: Config = {
  directory: "./my-project",
  relevantExtensions: [".ts", ".js", ".jsx", ".tsx"],
  maxFileSize: 100_000,
  maxTokens: 100_000,
  ignorePatterns: ["node_modules", "build", "dist"],
  ignoreFilesWithNoExtension: true,
  memoryLimitMB: 64,
};

const analyzer = new CodebaseAnalyzer(config);

analyzer.analyze().then((output) => {
  console.log("Analysis Output:", output);
}).catch((error) => {
  console.error("Error during analysis:", error);
});
```

## API

`CodebaseAnalyzer`

### Constructor
  
```typescript
new CodebaseAnalyzer(config: Config)
```

* `config`: Configuration object for the analyzer.

### Methods

* `analyze(): Promise<Output>`: Analyzes the codebase and returns the analysis output.

## Configuration Options

* `directory (string)`: The root directory to analyze.
* `relevantExtensions (string[])`: List of file extensions to include in the analysis.
* `maxFileSize (number)`: Maximum file size (in bytes) to process.
* `maxTokens (number)`: Maximum number of tokens to process.
* `ignorePatterns (string[])`: List of directory patterns to ignore.
* `ignoreFilesWithNoExtension (boolean)`: Whether to ignore files with no extension.
* `memoryLimitMB (number)`: Memory limit in megabytes.

## Output

The analyze method returns a Promise that resolves to an Output object containing the analysis results.

## Error Handling

If the memory usage exceeds the specified limit, an error will be thrown. Ensure to handle this in your application:

```typescript
analyzer.analyze().catch((error) => {
  console.error("Error during analysis:", error);
});
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

For more details, refer to the source code and documentation in the src directory.
