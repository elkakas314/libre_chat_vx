import type { TargetScope } from '../cockpit/systemTarget';

export interface ConversationEnvelope {
  conversationId: string;
  messageId: string;
  targetScope: TargetScope;
  contextRefs: string[];
  principalRef: string;
  authority: false;
}

export interface ConversationAnswer {
  text: string;
  targetProvenance: string[];
  materialClaim: false;
}

export function makeConversationEnvelope(
  input: Omit<ConversationEnvelope,'authority'>,
): ConversationEnvelope {
  return { ...input, authority:false };
}
