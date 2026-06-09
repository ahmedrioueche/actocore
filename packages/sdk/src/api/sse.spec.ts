import { describe, expect, it } from 'vitest';
import {
  consumeSseBuffer,
  parseChatStreamEvent,
  parseSseDataLines,
} from '@ahmedrioueche/actocore-shared';

describe('parseSseDataLines', () => {
  it('extracts complete SSE data blocks', () => {
    const input =
      'data: {"type":"meta","sessionId":"s1","intent":"qa"}\n\n' +
      'data: {"type":"delta","text":"Hi"}\n\npartial';

    const { events, remainder } = parseSseDataLines(input);
    expect(events).toHaveLength(2);
    expect(remainder).toBe('partial');
  });

  it('parses single-line SSE events without waiting for a blank line', () => {
    const events: string[] = [];
    const remainder = consumeSseBuffer(
      'data: {"type":"delta","text":"Hel"}\ndata: {"type":"delta","text":"lo"}\npartial',
      (data) => events.push(data),
    );

    expect(events).toHaveLength(2);
    expect(remainder).toBe('partial');
  });
});

describe('parseChatStreamEvent', () => {
  it('parses delta events', () => {
    const event = parseChatStreamEvent('{"type":"delta","text":"hello"}');
    expect(event).toEqual({ type: 'delta', text: 'hello' });
  });
});
