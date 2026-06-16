import { lazy, Suspense } from 'react';

import ConfirmModal from '@/components/ConfirmModal';
import { useModalBodyFlag } from '@/hooks/use-modal-body-flag';

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

export default function Modals() {
  useModalBodyFlag();

  return (
    <>
      <ConfirmModal />
      <Suspense fallback={null}>
        <UploadKnowledgeModal />
        <CreateApiKeyModal />
        <EditApiKeyModal />
        <IssuedApiKeyModal />
        <CreateActionModal />
        <EditActionModal />
        <CreateSectionModal />
        <EditSectionModal />
        <ActionCreatedModal />
        <ActionsSdkCodeModal />
        <CreateProjectModal />
        <InviteMemberModal />
        <EditMemberModal />
        <CreatePlanModal />
        <EditPlanModal />
        <CreatePlatformManagerModal />
        <EditPlatformManagerModal />
        <DeleteAccountModal />
        <CreateAppPageModal />
        <EditAppPageModal />
        <CreateReportModal />
        <ViewReportModal />
        <EditReportModal />
      </Suspense>
    </>
  );
}
