import type { LLMClient, LLMCompleteRequest, LLMResponse } from "./types.js";

/**
 * A zero-cost client that echoes back a stub response. It lets the rest
 * of the stack run when no API keys are configured (CI, dev without
 * internet, or first-boot demos). The narrative service uses this as
 * the default provider when LLM_API_KEY is empty.
 */
export class EchoLLMClient implements LLMClient {
  public readonly provider = "echo";
  public readonly model = "echo-1";

  public async complete(req: LLMCompleteRequest): Promise<LLMResponse> {
    const last = req.messages[req.messages.length - 1];
    const echo = last?.content ?? "";
    const content = req.jsonMode
      ? JSON.stringify({ narration: `（echo）收到输入：${echo.slice(0, 60)}`, requiredChecks: [] })
      : `（echo LLM）我听到你说：「${echo.slice(0, 80)}」。请配置 LLM_API_KEY 接入真实模型。`;
    return {
      content,
      toolCalls: [],
      model: this.model,
      provider: this.provider,
      latencyMs: 0,
      json: req.jsonMode ? JSON.parse(content) : undefined,
      finishReason: "stop"
    };
  }
}
