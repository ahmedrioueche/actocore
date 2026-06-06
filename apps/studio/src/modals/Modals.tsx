import { lazy, Suspense } from 'react';

import ConfirmModal from '@/components/ConfirmModal';

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

export default function Modals() {
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
      </Suspense>
    </>
  );
}
