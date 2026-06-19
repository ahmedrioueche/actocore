import { lazy, Suspense } from 'react';

import ConfirmModal from '@/components/ConfirmModal';
import { useModalBodyFlag } from '@/hooks/use-modal-body-flag';
import { useWindowPathname } from '@/hooks/use-window-pathname';
import { isPublicAppPath } from '@/lib/auth-session';
import { useModalStore, type ModalId } from '@/stores/modal';

const UploadKnowledgeModal = lazy(
  () => import('@/components/knowledge/UploadKnowledgeModal'),
);
const CreateApiKeyModal = lazy(
  () => import('@/components/api-keys/CreateApiKeyModal'),
);
const EditApiKeyModal = lazy(
  () => import('@/components/api-keys/EditApiKeyModal'),
);
const IssuedApiKeyModal = lazy(
  () => import('@/components/api-keys/IssuedApiKeyModal'),
);
const CreateActionModal = lazy(
  () => import('@/components/actions/CreateActionModal'),
);
const EditActionModal = lazy(
  () => import('@/components/actions/EditActionModal'),
);
const CreateSectionModal = lazy(
  () => import('@/components/actions/CreateSectionModal'),
);
const EditSectionModal = lazy(
  () => import('@/components/actions/EditSectionModal'),
);
const ActionCreatedModal = lazy(
  () => import('@/components/actions/ActionCreatedModal'),
);
const ActionsSdkCodeModal = lazy(
  () => import('@/components/actions/ActionsSdkCodeModal'),
);
const CreateProjectModal = lazy(
  () => import('@/components/projects/CreateProjectModal'),
);
const InviteMemberModal = lazy(
  () => import('@/components/team/InviteMemberModal'),
);
const EditMemberModal = lazy(
  () => import('@/components/team/EditMemberModal'),
);
const CreatePlanModal = lazy(
  () => import('@/components/admin/plans/CreatePlanModal'),
);
const EditPlanModal = lazy(
  () => import('@/components/admin/plans/EditPlanModal'),
);
const CreatePlatformManagerModal = lazy(
  () => import('@/components/admin/team/CreatePlatformManagerModal'),
);
const EditPlatformManagerModal = lazy(
  () => import('@/components/admin/team/EditPlatformManagerModal'),
);
const DeleteAccountModal = lazy(
  () => import('@/components/settings/DeleteAccountModal'),
);
const CreateAppPageModal = lazy(
  () => import('@/components/app-layout/CreateAppPageModal'),
);
const EditAppPageModal = lazy(
  () => import('@/components/app-layout/EditAppPageModal'),
);
const CreateReportModal = lazy(
  () => import('@/components/reports/CreateReportModal'),
);
const ViewReportModal = lazy(
  () => import('@/components/reports/ViewReportModal'),
);
const EditReportModal = lazy(
  () => import('@/components/reports/EditReportModal'),
);

function ActiveLazyModal({ modalId }: { modalId: Exclude<ModalId, 'confirm' | null> }) {
  switch (modalId) {
    case 'uploadKnowledge':
      return <UploadKnowledgeModal />;
    case 'createApiKey':
      return <CreateApiKeyModal />;
    case 'editApiKey':
      return <EditApiKeyModal />;
    case 'issuedApiKey':
      return <IssuedApiKeyModal />;
    case 'createAction':
      return <CreateActionModal />;
    case 'editAction':
      return <EditActionModal />;
    case 'createSection':
      return <CreateSectionModal />;
    case 'editSection':
      return <EditSectionModal />;
    case 'actionCreated':
      return <ActionCreatedModal />;
    case 'actionsSdkCode':
      return <ActionsSdkCodeModal />;
    case 'createProject':
      return <CreateProjectModal />;
    case 'inviteMember':
      return <InviteMemberModal />;
    case 'editMember':
      return <EditMemberModal />;
    case 'createPlan':
      return <CreatePlanModal />;
    case 'editPlan':
      return <EditPlanModal />;
    case 'createPlatformManager':
      return <CreatePlatformManagerModal />;
    case 'editPlatformManager':
      return <EditPlatformManagerModal />;
    case 'deleteAccount':
      return <DeleteAccountModal />;
    case 'createAppPage':
      return <CreateAppPageModal />;
    case 'editAppPage':
      return <EditAppPageModal />;
    case 'createReport':
      return <CreateReportModal />;
    case 'viewReport':
      return <ViewReportModal />;
    case 'editReport':
      return <EditReportModal />;
    default:
      return null;
  }
}

export default function Modals() {
  useModalBodyFlag();
  const pathname = useWindowPathname();
  const currentModal = useModalStore((state) => state.currentModal);
  const showLazyModals =
    !isPublicAppPath(pathname) &&
    currentModal !== null &&
    currentModal !== 'confirm';

  return (
    <>
      <ConfirmModal />
      {showLazyModals ? (
        <Suspense fallback={null}>
          <ActiveLazyModal modalId={currentModal} />
        </Suspense>
      ) : null}
    </>
  );
}
