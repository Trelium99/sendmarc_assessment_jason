/** Chrome WebMCP Imperative API (enable-webmcp-testing flag). */
interface ModelContextJsonSchema {
  type: string;
  properties?: Record<string, unknown>;
  required?: string[];
  description?: string;
}

interface ModelContextToolAnnotations {
  readOnlyHint?: boolean;
  untrustedContentHint?: boolean;
  consequentialHint?: boolean;
  debugging?: boolean;
}

interface ModelContextToolDefinition {
  name: string;
  description: string;
  inputSchema: ModelContextJsonSchema;
  annotations?: ModelContextToolAnnotations;
  execute: (
    input: Record<string, unknown>,
    context?: { signal?: AbortSignal },
  ) => Promise<unknown> | unknown;
}

interface ModelContext {
  registerTool(
    tool: ModelContextToolDefinition,
    options?: { signal?: AbortSignal },
  ): Promise<void>;
  getTools(options?: { fromOrigins?: string[] }): Promise<unknown[]>;
  executeTool(
    tool: unknown,
    input?: Record<string, unknown>,
    options?: { signal?: AbortSignal },
  ): Promise<unknown>;
}

interface Document {
  modelContext?: ModelContext;
}
