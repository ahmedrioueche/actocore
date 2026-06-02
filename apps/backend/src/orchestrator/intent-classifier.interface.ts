import type { ChatIntent, RequestContextData } from '@ahmedrioueche/actocore-shared';

export interface IntentClassificationInput {
  context: RequestContextData;
  message: string;
  sessionId: string;
  /** Enabled action names for the project — used to detect natural-language action requests. */
  enabledActionNames?: string[];
}

export interface IntentClassifier {
  classify(input: IntentClassificationInput): Promise<ChatIntent>;
}

export const INTENT_CLASSIFIER = Symbol('INTENT_CLASSIFIER');
