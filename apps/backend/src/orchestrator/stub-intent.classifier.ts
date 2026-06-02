import { Injectable } from '@nestjs/common';
import type { ChatIntent } from '@ahmedrioueche/actocore-shared';
import type {
  IntentClassificationInput,
  IntentClassifier,
} from './intent-classifier.interface';

const ACTION_PATTERN =
  /^\s*(run|execute|call|trigger|perform|do)\b/i;
const QA_PATTERN =
  /^\s*(what|how|why|when|where|who|which|explain|tell me|describe|is there|are there|can you explain)\b/i;

/**
 * Heuristic classifier for development until a model-based classifier is added.
 */
@Injectable()
export class StubIntentClassifier implements IntentClassifier {
  async classify(input: IntentClassificationInput): Promise<ChatIntent> {
    const message = input.message.trim();

    if (ACTION_PATTERN.test(message)) {
      return 'action';
    }

    if (QA_PATTERN.test(message)) {
      return 'qa';
    }

    return 'direct';
  }
}
