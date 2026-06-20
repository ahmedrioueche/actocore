import { Injectable } from '@nestjs/common';
import type { SdkManifestData } from '@ahmedrioueche/actocore-shared';
import { SdkConfigService } from '../projects/sdk-config/sdk-config.service';
import { ActionsService } from './actions.service';
import { AppPageLinksService } from './app-page-links.service';
import { AppPagesService } from './app-pages.service';

@Injectable()
export class SdkManifestService {
  constructor(
    private readonly actions: ActionsService,
    private readonly appPages: AppPagesService,
    private readonly appPageLinks: AppPageLinksService,
    private readonly sdkConfig: SdkConfigService,
  ) {}

  async buildManifest(projectId: string): Promise<SdkManifestData> {
    const [pages, pageLinks, enabledActions, sdk] = await Promise.all([
      this.appPages.listManifest(projectId),
      this.appPageLinks.listManifest(projectId),
      this.actions.listEnabled(projectId),
      this.sdkConfig.getConfig(projectId),
    ]);

    const filteredActions = await this.sdkConfig.filterEnabledActions(
      projectId,
      enabledActions,
      sdk,
    );

    return {
      manifestVersion: '1.0',
      projectId,
      capabilities: {
        qa: true,
        actions: filteredActions.length > 0,
      },
      pages: pages.length > 0 ? pages : undefined,
      pageLinks: pageLinks.length > 0 ? pageLinks : undefined,
      actions:
        filteredActions.length > 0
          ? filteredActions.map((action) => ({
              name: action.name,
              description: action.description,
              pageIds: action.pageIds,
            }))
          : undefined,
    };
  }
}
