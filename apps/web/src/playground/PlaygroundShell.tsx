import type { KnowledgeSourceData } from '@ahmedrioueche/actocore-shared';
import type { ReactNode } from 'react';

import type { SdkConfigFormState } from '@/utils/sdk-config-form';

import { AppLayoutPanel } from './panels/AppLayoutPanel';
import { ActionsPanel } from './panels/ActionsPanel';
import { KnowledgePanel } from './panels/KnowledgePanel';
import { SdkConfigPanel } from './panels/SdkConfigPanel';
import { PlaygroundSidebar } from './PlaygroundSidebar';
import type { DemoUser } from './demo-users';
import type {
  PlaygroundActionDefinition,
  PlaygroundAppPage,
  PlaygroundSdkExtras,
  PlaygroundView,
} from './types';

type PlaygroundShellProps = {
  activeView: PlaygroundView;
  onViewChange: (view: PlaygroundView) => void;
  projectName: string;
  chat: ReactNode;
  users: DemoUser[];
  knowledge: KnowledgeSourceData[];
  knowledgeBusy?: boolean;
  sdkBusy?: boolean;
  onKnowledgeUpload: (file: File) => Promise<void>;
  onKnowledgeRemove: (sourceId: string) => Promise<void>;
  appPages: PlaygroundAppPage[];
  onAppPagesChange: (pages: PlaygroundAppPage[]) => void;
  activePageId: string;
  onActivePageChange: (pageId: string, route: string) => void;
  actions: PlaygroundActionDefinition[];
  onActionsChange: (actions: PlaygroundActionDefinition[]) => void;
  sdkForm: SdkConfigFormState;
  sdkExtras: PlaygroundSdkExtras;
  onSdkFormChange: (form: SdkConfigFormState) => void;
  onSdkExtrasChange: (extras: PlaygroundSdkExtras) => void;
};

type PlaygroundPanelProps = Omit<
  PlaygroundShellProps,
  'onViewChange' | 'projectName' | 'chat'
>;

function PlaygroundPanel({
  activeView,
  users,
  knowledge,
  knowledgeBusy,
  onKnowledgeUpload,
  onKnowledgeRemove,
  appPages,
  onAppPagesChange,
  activePageId,
  onActivePageChange,
  actions,
  onActionsChange,
  sdkForm,
  sdkExtras,
  sdkBusy,
  onSdkFormChange,
  onSdkExtrasChange,
}: PlaygroundPanelProps) {
  switch (activeView) {
    case 'app-layout':
      return (
        <AppLayoutPanel
          pages={appPages}
          activePageId={activePageId}
          onPagesChange={onAppPagesChange}
          onActivePageChange={onActivePageChange}
        />
      );
    case 'knowledge':
      return (
        <KnowledgePanel
          sources={knowledge}
          busy={knowledgeBusy}
          onUpload={onKnowledgeUpload}
          onRemove={onKnowledgeRemove}
        />
      );
    case 'actions':
      return (
        <ActionsPanel users={users} actions={actions} onActionsChange={onActionsChange} />
      );
    case 'sdk-config':
      return (
        <SdkConfigPanel
          form={sdkForm}
          extras={sdkExtras}
          actions={actions}
          busy={sdkBusy}
          onFormChange={onSdkFormChange}
          onExtrasChange={onSdkExtrasChange}
        />
      );
    default:
      return null;
  }
}

export function PlaygroundShell(props: PlaygroundShellProps) {
  const { activeView, onViewChange, projectName, chat, ...panelProps } = props;

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[12rem_minmax(0,1fr)] lg:items-start">
        <PlaygroundSidebar
          activeView={activeView}
          onViewChange={onViewChange}
          projectName={projectName}
        />

        <div className="min-w-0">
          <PlaygroundPanel activeView={activeView} {...panelProps} />
        </div>
      </div>

      {chat}
    </>
  );
}
