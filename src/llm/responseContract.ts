export interface ImmutableEvidenceBlock {
  facts: readonly string[];
  evidenceRefs: readonly string[];
  receiptRefs: readonly string[];
  uncertainty: readonly string[];
}

export interface VoiceRenderRequest {
  userIntent: string;
  answerContent: string;
  evidence: ImmutableEvidenceBlock;
  language: 'es';
  preserveSemantics: true;
}

export interface VoiceRenderResult {
  renderedText: string;
  evidence: ImmutableEvidenceBlock;
  semanticsChanged: false;
}

export function voiceMayChangeEvidence(): false {
  return false;
}

export function buildVoiceRenderRequest(
  userIntent: string,
  answerContent: string,
  evidence: ImmutableEvidenceBlock,
): VoiceRenderRequest {
  return {
    userIntent,
    answerContent,
    evidence,
    language:'es',
    preserveSemantics:true,
  };
}
