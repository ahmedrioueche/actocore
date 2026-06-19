import { BadRequestException, HttpException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ErrorCode } from '@ahmedrioueche/actocore-shared';
import { LLM_PROVIDER } from '../../external/llm/llm-provider.interface';
import { SdkConfigTranslateService } from './sdk-config-translate.service';

describe('SdkConfigTranslateService', () => {
  const llm = { complete: jest.fn() };

  let service: SdkConfigTranslateService;

  beforeEach(async () => {
    jest.clearAllMocks();
    llm.complete.mockResolvedValue({
      content: JSON.stringify({
        fr: {
          headerTitle: 'Assistant FR',
          placeholder: 'Écrivez un message…',
        },
      }),
      model: 'stub',
    });

    const moduleRef = await Test.createTestingModule({
      providers: [
        SdkConfigTranslateService,
        { provide: LLM_PROVIDER, useValue: llm },
      ],
    }).compile();

    service = moduleRef.get(SdkConfigTranslateService);
  });

  it('translates labels for target locales', async () => {
    const result = await service.translateCopy({
      sourceLocale: 'en',
      targetLocales: ['fr'],
      sourceLabels: {
        headerTitle: 'Assistant',
        placeholder: 'Type a message…',
      },
    });

    expect(result.translations.fr).toEqual({
      headerTitle: 'Assistant FR',
      placeholder: 'Écrivez un message…',
    });
    expect(llm.complete).toHaveBeenCalledTimes(1);
  });

  it('rejects invalid requests before calling the LLM', async () => {
    await expect(
      service.translateCopy({
        sourceLocale: 'en',
        targetLocales: ['en'],
        sourceLabels: { headerTitle: 'Hi' },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(llm.complete).not.toHaveBeenCalled();
  });

  it('maps invalid LLM JSON to BAD_GATEWAY', async () => {
    llm.complete.mockResolvedValue({
      content: 'not json at all',
      model: 'stub',
    });

    await expect(
      service.translateCopy({
        sourceLocale: 'en',
        targetLocales: ['fr'],
        sourceLabels: { headerTitle: 'Assistant' },
      }),
    ).rejects.toMatchObject({
      response: {
        errorCode: ErrorCode.BAD_GATEWAY,
      },
    });
  });

  it('re-throws HttpException from LLM mapper', async () => {
    llm.complete.mockRejectedValue(
      new HttpException(
        { success: false, errorCode: ErrorCode.SERVICE_UNAVAILABLE, message: 'down' },
        503,
      ),
    );

    await expect(
      service.translateCopy({
        sourceLocale: 'en',
        targetLocales: ['fr'],
        sourceLabels: { headerTitle: 'Assistant' },
      }),
    ).rejects.toBeInstanceOf(HttpException);
  });
});
