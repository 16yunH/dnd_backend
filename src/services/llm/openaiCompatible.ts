import { HttpError } from "../../lib/httpError.js";
import { logger } from "../../lib/logger.js";
import type {
  ChatMessage,
  LLMClient,
  LLMCompleteRequest,
  LLMResponse,
  ToolCall
} from "./types.js";

interface OpenAICompatibleOptions {
  provider: string;
  model: string;
  apiKey: string;
  baseUrl: string;
  /** Some providers (e.g. DeepSeek) accept `response_format: { type: "json_object" }`. */
  supportsJsonMode?: boolean;
  /** Some providers (e.g. DeepSeek, Zhipu) accept `tools` in OpenAI shape. */
  supportsTools?: boolean;
  defaultTimeoutMs?: number;
}

interface OpenAIToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

interface OpenAIChoiceMessage {
  role: string;
  content: string | null;
  tool_calls?: OpenAIToolCall[];
}

interface OpenAIResponseBody {
  choices: Array<{
    message: OpenAIChoiceMessage;
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  model: string;
}

const toOpenAIMessage = (m: ChatMessage) => {
  const base: Record<string, unknown> = { role: m.role, content: m.content };
  if (m.name) base.name = m.name;
  if (m.toolCallId) base.tool_call_id = m.toolCallId;
  return base;
};

/**
 * Thin adapter for the OpenAI chat/completions shape. DeepSeek, Zhipu
 * (GLM) and a handful of local runtimes (e.g. vLLM) speak this dialect,
 * so a single implementation serves all of them with tiny config flags.
 */
export class OpenAICompatibleClient implements LLMClient {
  public readonly provider: string;
  public readonly model: string;
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly supportsJsonMode: boolean;
  private readonly supportsTools: boolean;
  private readonly defaultTimeoutMs: number;

  constructor(opts: OpenAICompatibleOptions) {
    if (!opts.apiKey) {
      throw new Error(`${opts.provider}: LLM_API_KEY is required`);
    }
    if (!opts.baseUrl) {
      throw new Error(`${opts.provider}: LLM_BASE_URL is required`);
    }
    this.provider = opts.provider;
    this.model = opts.model;
    this.apiKey = opts.apiKey;
    this.baseUrl = opts.baseUrl.replace(/\/+$/, "");
    this.supportsJsonMode = opts.supportsJsonMode ?? true;
    this.supportsTools = opts.supportsTools ?? true;
    this.defaultTimeoutMs = opts.defaultTimeoutMs ?? 60_000;
  }

  public async complete(req: LLMCompleteRequest): Promise<LLMResponse> {
    const url = `${this.baseUrl}/chat/completions`;
    const messages: ReturnType<typeof toOpenAIMessage>[] = [];
    if (req.system) messages.push({ role: "system", content: req.system });
    for (const m of req.messages) messages.push(toOpenAIMessage(m));

    const body: Record<string, unknown> = {
      model: this.model,
      messages,
      temperature: req.temperature ?? 0.7
    };
    if (req.maxTokens) body.max_tokens = req.maxTokens;
    if (req.jsonMode && this.supportsJsonMode) {
      body.response_format = { type: "json_object" };
    }
    if (req.tools?.length && this.supportsTools) {
      body.tools = req.tools.map((t) => ({
        type: "function",
        function: { name: t.name, description: t.description, parameters: t.parameters }
      }));
      if (req.toolChoice) {
        body.tool_choice =
          req.toolChoice === "auto" || req.toolChoice === "none"
            ? req.toolChoice
            : { type: "function", function: { name: req.toolChoice } };
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      req.timeoutMs ?? this.defaultTimeoutMs
    );

    const startedAt = Date.now();
    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });
    } catch (err) {
      clearTimeout(timeout);
      logger.error({ err, provider: this.provider }, "llm fetch failed");
      throw new HttpError(502, "LLM 请求失败", undefined, "llm_network_error");
    }
    clearTimeout(timeout);
    const latencyMs = Date.now() - startedAt;

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      logger.error(
        { status: response.status, body: text.slice(0, 500), provider: this.provider },
        "llm non-2xx"
      );
      throw new HttpError(
        502,
        `LLM 返回 ${response.status}`,
        { status: response.status, body: text.slice(0, 500) },
        "llm_upstream_error"
      );
    }

    const data = (await response.json()) as OpenAIResponseBody;
    const choice = data.choices?.[0];
    const msg = choice?.message;
    const content = msg?.content ?? "";
    const toolCalls: ToolCall[] = (msg?.tool_calls ?? []).map((call) => {
      let parsed: Record<string, unknown> | undefined;
      try {
        parsed = JSON.parse(call.function.arguments) as Record<string, unknown>;
      } catch {
        parsed = undefined;
      }
      return {
        id: call.id,
        name: call.function.name,
        argumentsRaw: call.function.arguments,
        arguments: parsed
      };
    });

    let json: unknown;
    if (req.jsonMode && content) {
      try {
        json = JSON.parse(content);
      } catch {
        json = undefined;
      }
    }

    return {
      content,
      toolCalls,
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens
          }
        : undefined,
      finishReason: choice?.finish_reason,
      json,
      model: data.model || this.model,
      provider: this.provider,
      latencyMs
    };
  }
}
