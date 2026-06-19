import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  ErrorCode,
  type SdkLabelTextField,
  type TranslateSdkCopyDto,
  type TranslateSdkCopyResultData,
} from '@ahmedrioueche/actocore-shared';
import { LLM_PROVIDER, type LlmProvider } from '../../external/llm/llm-provider.interface';
import { mapLlmProviderError } from '../../external/llm/llm-provider-error.util';
import {
  buildSdkCopyTranslateMessages,
  extractJsonObject,
  pickTranslatableSourceLabels,
  sanitizeTranslatedLabels,
  validateTranslateRequest,
} from './sdk-label-translate.util';

@Injectable()
export class SdkConfigTranslateService {
  private readonly logger = new Logger(SdkConfigTranslateService.name);

  constructor(@Inject(LLM_PROVIDER) private readonly llm: LlmProvider) {}

  async translateCopy(
    body: TranslateSdkCopyDto,
  ): Promise<TranslateSdkCopyResultData> {
    const sourceLabels = pickTranslatableSourceLabels(body.sourceLabels);
    const targetLocales = [...new Set(body.targetLocales)];

    try {
      validateTranslateRequest(body.sourceLocale, targetLocales, sourceLabels);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid translate request',
      );
    }

    const fields = Object.keys(sourceLabels) as SdkLabelTextField[];

    try {
      const completion = await this.llm.complete(
        buildSdkCopyTranslateMessages(
          body.sourceLocale.trim().toLowerCase().split('-')[0],
          targetLocales.map(
            (locale) => locale.trim().toLowerCase().split('-')[0],
          ),
          sourceLabels,
        ),
      );

      const parsed = extractJsonObject(completion.content);
      const translations = sanitizeTranslatedLabels(
        parsed,
        targetLocales.map((locale) => locale.trim().toLowerCase().split('-')[0]),
        fields,
      );

      return { translations };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      if (error instanceof HttpException) {
        throw error;
      }

      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`SDK copy translation failed: ${message}`);

      if (
        message.includes('JSON') ||
        message.includes('No translations were returned')
      ) {
        throw new HttpException(
          {
            success: false,
            errorCode: ErrorCode.BAD_GATEWAY,
            message: 'Translation could not be completed. Try again or edit labels manually.',
          },
          HttpStatus.BAD_GATEWAY,
        );
      }

      throw mapLlmProviderError('SDK copy translate', error, this.logger);
    }
  }
}
