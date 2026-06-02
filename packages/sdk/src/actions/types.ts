import type { ChatMessageData } from '@ahmedrioueche/actocore-shared';

export type ActionHandler = (
  payload: Record<string, unknown>,
  context: ActionHandlerContext,
) => Promise<unknown> | unknown;

export interface ActionHandlerContext {
  message: ChatMessageData;
  sessionId: string;
}

export type ActionRegistry = Record<string, ActionHandler>;
