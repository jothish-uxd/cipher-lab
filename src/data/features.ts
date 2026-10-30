import type { Customer, Solution } from './customers';
import type { AnalysisState, NGram } from './analysis';
import { stageIndex } from './stages';
import { useStored } from './store';

/*
  Feature engineering settings. Which features exist comes from what analysis sent over;
  this store holds how each one is configured, what was removed, and whether the set is locked.
*/

export type FeatureId = 'vocabulary' | 'channels' | 'length' | 'sentiment' | 'embedding';

export interface FeatureSettings {
  vocabulary: { ngrams: NGram[]; minDf: number; maxDf: number; maxTerms: number; weighting: 'counts' | 'tfidf' };
  length: { unit: 'words' | 'sentences' | 'paragraphs' };
  sentiment: { form: 'score' | 'category' };
  embedding: { added: boolean };
  removed: FeatureId[];
  lockedAt?: string;
}

export const FEATURE_NAME: Record<FeatureId, string> = {
  vocabulary: 'Vocabulary',
  channels: 'Channel',
  length: 'Message length',
  sentiment: 'Sentiment',
  embedding: 'Message meaning (embedding)',
};

export const FEATURE_HELP: Record<FeatureId, string> = {
  vocabulary: 'Which terms appear in a message. The workhorse of text classifiers.',
  channels: 'Where the message was sent. One input per channel.',
  length: 'How long the message is.',
  sentiment: 'The tone of the message, scored inside the vault.',
  embedding: 'A language model turns each whole message into numbers that capture its meaning, so paraphrases and code words land near each other. Computed inside the vault.',
};

const key = (c: Customer, s: Solution) => `features:${c.id}/${s.id}`;

export function useFeatures(c: Customer, s: Solution, a: AnalysisState) {
  return useStored<FeatureSettings>(key(c, s), () => {
    const ngrams = [...new Set(Object.values(a.include.vocabulary).flat())] as NGram[];
    return {
      vocabulary: { ngrams: ngrams.length ? ngrams : ['words'], minDf: 1, maxDf: 90, maxTerms: 2000, weighting: 'tfidf' },
      length: { unit: 'words' },
      sentiment: { form: 'score' },
      embedding: { added: false },
      removed: [],
      lockedAt: stageIndex(s.stage) > stageIndex('features') ? '2026-08-08T15:00:00Z' : undefined,
    };
  });
}

/** Features offered by analysis, in a fixed order. */
export function offeredFeatures(a: AnalysisState): FeatureId[] {
  const out: FeatureId[] = [];
  if (Object.values(a.include.vocabulary).some((g) => g.length)) out.push('vocabulary');
  if (a.include.channels) out.push('channels');
  if (a.include.length) out.push('length');
  if (a.include.sentiment) out.push('sentiment');
  return out;
}

export function activeFeatures(a: AnalysisState, f: FeatureSettings): FeatureId[] {
  const list = offeredFeatures(a).filter((id) => !f.removed.includes(id));
  if (f.embedding.added && !f.removed.includes('embedding')) list.push('embedding');
  return list;
}

/** How many numbers each feature contributes to the model's input. */
export function inputCount(id: FeatureId, f: FeatureSettings, channelCount: number) {
  switch (id) {
    case 'vocabulary': return f.vocabulary.maxTerms * f.vocabulary.ngrams.length;
    case 'channels': return channelCount;
    case 'length': return 1;
    case 'sentiment': return f.sentiment.form === 'score' ? 1 : 3;
    case 'embedding': return 384;
  }
}
