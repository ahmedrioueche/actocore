import { StubIntentClassifier } from './stub-intent.classifier';

describe('StubIntentClassifier', () => {
  const classifier = new StubIntentClassifier();
  const base = {
    context: {
      projectId: 'p1',
      projectName: 'Test',
      settings: {},
      apiKeyId: 'k1',
    },
    sessionId: 's1',
  };

  it('classifies action phrasing', async () => {
    expect(
      await classifier.classify({ ...base, message: 'Run the checkout flow' }),
    ).toBe('action');
  });

  it('classifies Q&A phrasing', async () => {
    expect(
      await classifier.classify({ ...base, message: 'What is ActoCore?' }),
    ).toBe('qa');
  });

  it('defaults to direct', async () => {
    expect(
      await classifier.classify({ ...base, message: 'Hello there' }),
    ).toBe('direct');
  });
});
