import {
  SDK_LATEST_VERSION,
  SDK_RELEASES,
  type SdkReleaseEntry,
} from '@ahmedrioueche/actocore-shared';
import { useTranslation } from 'react-i18next';

import { DocCodeBlock } from '@/components/projects/DocCodeBlock';
import Tip from '@/components/ui/Tip';
import {
  PROJECT_DOCS_UPDATE_COMMAND,
  PROJECT_DOCS_VERIFY_COMMAND,
  projectDocsPinnedInstallCommand,
} from '@/constants/project-docs';

const CHANGELOG_LIMIT = 5;

function SdkReleaseChangelogItem({
  entry,
  locale,
}: {
  entry: SdkReleaseEntry;
  locale: string;
}) {
  const { t } = useTranslation();

  const dateLabel = new Date(entry.releasedAt).toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <article className="rounded-xl border border-border bg-surface px-4 py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-text-primary">
          v{entry.version}
        </h3>
        <time
          className="text-xs text-text-secondary"
          dateTime={entry.releasedAt}
        >
          {dateLabel}
        </time>
      </div>
      <p className="mt-1 text-sm text-text-secondary">{entry.summary}</p>
      <p className="mt-2 text-xs text-text-secondary">
        {t('projectDocs.updates.changelog.sharedVersion', {
          version: entry.sharedVersion,
        })}
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-text-secondary">
        {entry.changes.map((change) => (
          <li key={change}>{change}</li>
        ))}
      </ul>
      {entry.breaking && entry.breaking.length > 0 ? (
        <div className="mt-3">
          <Tip variant="warning" title={t('projectDocs.updates.changelog.breakingTitle')}>
            <ul className="list-disc space-y-1 pl-5">
              {entry.breaking.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </Tip>
        </div>
      ) : null}
    </article>
  );
}

export function SdkUpdatesSection() {
  const { t, i18n } = useTranslation();
  const changelogEntries = SDK_RELEASES.slice(0, CHANGELOG_LIMIT);

  return (
    <section id="sdk-updates" className="space-y-4 scroll-mt-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">
            {t('projectDocs.updates.title')}
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            {t('projectDocs.updates.subtitle')}
          </p>
        </div>
        <span className="inline-flex items-center rounded-full border border-border bg-surface-secondary px-3 py-1 text-xs font-medium text-text-primary">
          {t('projectDocs.updates.latestVersion')}: v{SDK_LATEST_VERSION}
        </span>
      </div>

      <DocCodeBlock
        label={t('projectDocs.updates.updateLabel')}
        code={PROJECT_DOCS_UPDATE_COMMAND}
      />
      <DocCodeBlock
        label={t('projectDocs.updates.verifyLabel')}
        code={PROJECT_DOCS_VERIFY_COMMAND}
      />
      <DocCodeBlock
        label={t('projectDocs.updates.pinnedLabel')}
        code={projectDocsPinnedInstallCommand(SDK_LATEST_VERSION)}
      />

      <Tip title={t('projectDocs.updates.remoteConfigTip.title')}>
        <p>{t('projectDocs.updates.remoteConfigTip.npmBody')}</p>
        <p>{t('projectDocs.updates.remoteConfigTip.remoteBody')}</p>
      </Tip>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-text-primary">
          {t('projectDocs.updates.changelog.title')}
        </h3>
        <div className="space-y-3">
          {changelogEntries.map((entry) => (
            <SdkReleaseChangelogItem
              key={entry.version}
              entry={entry}
              locale={i18n.language}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
