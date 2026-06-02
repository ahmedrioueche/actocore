import { OpenAiLlmProvider } from './openai-llm.provider';

describe('OpenAiLlmProvider', () => {
  const config = {
    apiKey: 'sk-test',
    model: 'gpt-4o-mini',
    baseUrl: 'https://api.openai.com/v1',
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('calls chat completions and maps the response', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          model: 'gpt-4o-mini',
          choices: [{ message: { content: 'Hello!' } }],
          usage: { prompt_tokens: 10, completion_tokens: 5 },
        }),
    } as Response);

    const provider = new OpenAiLlmProvider(config, 5000);
    const result = await provider.complete([
      { role: 'user', content: 'Hi' },
    ]);

    expect(result).toEqual({
      content: 'Hello!',
      model: 'gpt-4o-mini',
      promptTokens: 10,
      completionTokens: 5,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer sk-test',
        }),
      }),
    );
  });
});
