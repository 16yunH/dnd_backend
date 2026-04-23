export type ChatRole = "system" | "user" | "assistant" | "tool";

export interface ChatMessage {
  role: ChatRole;
  content: string;
  name?: string;
  /** For role=tool: the tool_call_id this message responds to. */
  toolCallId?: string;
}

export interface ToolSchema {
  /** Function name used by the model. */
  name: string;
  description: string;
  /** JSON Schema object for the function arguments. */
  parameters: Record<string, unknown>;
}

export interface ToolCall {
  id: string;
  name: string;
  /** Raw arguments as returned by the model (JSON string). */
  argumentsRaw: string;
  /** Parsed arguments, best-effort. Undefined when JSON.parse failed. */
  arguments?: Record<string, unknown>;
}

export interface LLMResponse {
  content: string;
  toolCalls: ToolCall[];
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  /** `stop`, `tool_calls`, `length`, ... */
  finishReason?: string;
  /** Parsed JSON body when `jsonMode: true` was requested. */
  json?: unknown;
  model: string;
  provider: string;
  latencyMs: number;
}

export interface LLMCompleteRequest {
  system?: string;
  messages: ChatMessage[];
  tools?: ToolSchema[];
  /** Force the model to call `toolChoice` if supported. */
  toolChoice?: string | "auto" | "none";
  temperature?: number;
  maxTokens?: number;
  /** Ask the model to return a JSON object (provider-specific). */
  jsonMode?: boolean;
  /** Per-request timeout override (ms). */
  timeoutMs?: number;
  /** Arbitrary metadata for logging / tracing. */
  meta?: Record<string, unknown>;
}

export interface LLMClient {
  readonly provider: string;
  readonly model: string;
  complete(req: LLMCompleteRequest): Promise<LLMResponse>;
}
