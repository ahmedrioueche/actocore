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

  it('classifies explicit run commands as action', async () => {
    expect(
      await classifier.classify({
        ...base,
        message: 'Run the checkout flow',
        enabledActionNames: ['checkout'],
      }),
    ).toBe('action');
  });

  it('classifies natural-language user management as action', async () => {
    expect(
      await classifier.classify({
        ...base,
        message:
          'update user with email alice@demo.com, make their name Alice Kiro',
        enabledActionNames: ['update_user'],
      }),
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

  it('detects typo delete user phrasing', async () => {
    expect(
      await classifier.classify({
        ...base,
        message: 'delte user',
        enabledActionNames: ['delete_user'],
      }),
    ).toBe('action');
  });
});
