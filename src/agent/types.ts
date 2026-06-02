/**
 * A small provider-agnostic message protocol, shaped to map cleanly onto the
 * Anthropic Messages API. The real AnthropicProvider and a MockProvider both
 * implement LlmProvider, so the agent loop is testable without the network.
 */

export interface ToolDef {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

export interface TextBlock {
  type: 'text';
  text: string;
}

export interface ToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export type AssistantBlock = TextBlock | ToolUseBlock;

export interface ToolResultBlock {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export interface ImageBlock {
  type: 'image';
  mediaType: string;
  dataBase64: string;
}

export type UserBlock = TextBlock | ToolResultBlock | ImageBlock;

export type Message =
  | { role: 'user'; content: UserBlock[] }
  | { role: 'assistant'; content: AssistantBlock[] };

export interface ProviderRequest {
  system: string;
  messages: Message[];
  tools: ToolDef[];
}

export interface ProviderTurn {
  content: AssistantBlock[];
  stopReason: string;
}

export type StreamDelta = (text: string) => void;

export interface LlmProvider {
  run(req: ProviderRequest): Promise<ProviderTurn>;
  /** Optional streaming variant — emits text deltas as they arrive. */
  runStream?(req: ProviderRequest, onDelta: StreamDelta): Promise<ProviderTurn>;
}

export function isToolUse(b: AssistantBlock): b is ToolUseBlock {
  return b.type === 'tool_use';
}

export function textOf(blocks: AssistantBlock[]): string {
  return blocks
    .filter((b): b is TextBlock => b.type === 'text')
    .map(b => b.text)
    .join('');
}
