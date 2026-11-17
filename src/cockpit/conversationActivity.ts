export interface VxConversationMessage {
  content?: readonly unknown[] | null;
}

export interface VxConversationActivityInput {
  conversationId?: string | null;
  endpoint?: string | null;
  agentId?: string | null;
  model?: string | null;
  isSubmitting: boolean;
  messages?: readonly VxConversationMessage[] | null;
}

export interface VxToolObservation {
  name: string;
  hasStoredOutput: boolean;
}

export interface VxConversationActivity {
  conversationId: string | null;
  endpoint: string | null;
  agentId: string | null;
  model: string | null;
  isSubmitting: boolean;
  messageCount: number;
  toolCallCount: number;
  toolCalls: readonly VxToolObservation[];
}

function asObject(value: unknown): Record<string, unknown> | undefined {
  return value != null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

/** Project conversation activity without exposing message text, arguments, or tool outputs. */
export function summarizeVxConversation(input: VxConversationActivityInput): VxConversationActivity {
  const toolCalls: VxToolObservation[] = [];
  for (const message of input.messages ?? []) {
    for (const partValue of message.content ?? []) {
      const part = asObject(partValue);
      if (part?.type !== 'tool_call') continue;
      const toolCall = asObject(part.tool_call);
      const functionCall = toolCall?.type === 'function' ? asObject(toolCall.function) : undefined;
      const rawName = functionCall?.name;
      const name = typeof rawName === 'string' && /^[A-Za-z0-9_.:-]{1,100}$/.test(rawName)
        ? rawName
        : 'herramienta';
      toolCalls.push({ name, hasStoredOutput: functionCall?.output != null });
    }
  }

  return {
    conversationId: input.conversationId ?? null,
    endpoint: input.endpoint ?? null,
    agentId: input.agentId ?? null,
    model: input.model ?? null,
    isSubmitting: input.isSubmitting,
    messageCount: input.messages?.length ?? 0,
    toolCallCount: toolCalls.length,
    toolCalls: toolCalls.slice(-6),
  };
}
