import { Injectable } from '@nestjs/common';
import type { ChatIntent } from '@ahmedrioueche/actocore-shared';
import { isLikelyActionMessage } from '../actions/natural-language-action.util';
import type {
  IntentClassificationInput,
  IntentClassifier,
} from './intent-classifier.interface';

const QA_PATTERN =
  /^\s*(what|how|why|when|where|who|which|explain|tell me|describe|is there|are there|can you explain)\b/i;

/**
 * Heuristic classifier — supports explicit "Run …" commands and natural-language
 * action phrasing (e.g. "update user with email …").
 */
@Injectable()
export class StubIntentClassifier implements IntentClassifier {
  async classify(input: IntentClassificationInput): Promise<ChatIntent> {
    const message = input.message.trim();
    const actionNames = input.enabledActionNames ?? [];

    if (
      actionNames.length > 0 &&
      isLikelyActionMessage(message, actionNames)
    ) {
      return 'action';
    }

    if (QA_PATTERN.test(message)) {
      return 'qa';
    }

    return 'direct';
  }
}
