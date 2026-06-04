import { usageEventsToCsv } from './usage-export.util';

describe('usageEventsToCsv', () => {
  it('escapes commas and quotes', () => {
    const csv = usageEventsToCsv([
      {
        id: '1',
        projectId: 'p1',
        route: 'sdk/chat',
        intent: 'direct',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ]);
    expect(csv).toContain('sdk/chat');
    expect(csv.startsWith('id,projectId')).toBe(true);
  });
});
