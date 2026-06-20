import { StudioRole } from '@ahmedrioueche/actocore-shared';
import { AlertTriangle, Mail, ShieldAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import BaseModal from '@/components/ui/BaseModal';
import InputField from '@/components/ui/InputField';
import { useAuth } from '@/context/AuthContext';
import {
  useConfirmDeleteAccount,
  useRequestDeleteAccountOtp,
} from '@/hooks/use-delete-account';
import { useFeatureModal } from '@/hooks/use-feature-modal';
import { useModalStore } from '@/stores/modal';
import { toast } from '@/stores/toast';
import { getUnknownApiErrorMessage } from '@/utils/statusMessage';

type Step = 'warning' | 'otp';

function isWorkspaceOwner(role: StudioRole): boolean {
  return role === StudioRole.USER_ADMIN || role === StudioRole.SUPER_ADMIN;
}

export default function DeleteAccountModal() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const { isOpen, closeModal } = useFeatureModal('deleteAccount');
  const requestOtp = useRequestDeleteAccountOtp();
  const confirmDelete = useConfirmDeleteAccount();
  const [step, setStep] = useState<Step>('warning');
  const [otp, setOtp] = useState('');

  const role = session?.role;
  const email = session?.user.email;

  useEffect(() => {
    if (!isOpen) {
      setStep('warning');
      setOtp('');
    }
  }, [isOpen]);

  if (!isOpen || !role) {
    return null;
  }

  const handleRequestOtp = async () => {
    try {
      await requestOtp.mutateAsync();
      setStep('otp');
    } catch (err) {
      toast.error(getUnknownApiErrorMessage(t, err));
    }
  };

  const handleConfirmDelete = async () => {
    const trimmed = otp.trim();
    if (trimmed.length < 6) {
      toast.error(t('settings.deleteAccount.otpRequired'));
      return;
    }

    try {
      await confirmDelete.mutateAsync(trimmed);
    } catch (err) {
      toast.error(getUnknownApiErrorMessage(t, err));
    }
  };

  const owner = isWorkspaceOwner(role);
  const otpReady = /^\d{6}$/.test(otp.trim());

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={closeModal}
      title={
        step === 'warning'
          ? t('settings.deleteAccount.title')
          : t('settings.deleteAccount.otpTitle')
      }
      subtitle={
        step === 'warning'
          ? t('settings.deleteAccount.subtitle')
          : t('settings.deleteAccount.otpSubtitle', { email: email ?? '' })
      }
      icon={step === 'warning' ? ShieldAlert : Mail}
      maxWidth="max-w-lg"
      primaryButton={
        step === 'warning'
          ? {
              label: t('settings.deleteAccount.sendCode'),
              variant: 'danger',
              loading: requestOtp.isPending,
              onClick: () => void handleRequestOtp(),
            }
          : {
              label: t('settings.deleteAccount.confirmDelete'),
              variant: 'danger',
              loading: confirmDelete.isPending,
              disabled: !otpReady,
              onClick: () => void handleConfirmDelete(),
            }
      }
      secondaryButton={{
        label:
          step === 'otp'
            ? t('settings.deleteAccount.back')
            : t('common.cancel'),
        onClick:
          step === 'otp'
            ? () => {
                setStep('warning');
                setOtp('');
              }
            : closeModal,
      }}
    >
      <div className="space-y-4">
        {step === 'warning' ? (
          <>
            <div className="flex gap-3 rounded-xl border border-danger/20 bg-danger-surface/70 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
              <div className="space-y-2 text-sm text-text-secondary">
                <p className="font-medium text-text-primary">
                  {owner
                    ? t('settings.deleteAccount.ownerWarningTitle')
                    : t('settings.deleteAccount.memberWarningTitle')}
                </p>
                <p>
                  {owner
                    ? t('settings.deleteAccount.ownerWarningBody')
                    : t('settings.deleteAccount.memberWarningBody')}
                </p>
              </div>
            </div>

            <ul className="list-disc space-y-1.5 pl-5 text-sm text-text-secondary">
              {(owner
                ? [
                    t('settings.deleteAccount.ownerBulletProjects'),
                    t('settings.deleteAccount.ownerBulletTeam'),
                    t('settings.deleteAccount.ownerBulletBilling'),
                  ]
                : [
                    t('settings.deleteAccount.memberBulletAccess'),
                    t('settings.deleteAccount.memberBulletProfile'),
                  ]
              ).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            {email ? (
              <p className="text-sm text-text-secondary">
                {t('settings.deleteAccount.emailHint', { email })}
              </p>
            ) : null}
          </>
        ) : (
          <>
            <p className="text-sm text-text-secondary">
              {t('settings.deleteAccount.otpInstructions')}
            </p>

            <InputField
              label={t('settings.deleteAccount.otpLabel')}
              value={otp}
              onChange={(e) => {
                const next = e.target.value.replace(/\D/g, '').slice(0, 6);
                setOtp(next);
              }}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              className="text-center text-2xl font-semibold tracking-[0.35em]"
              autoFocus
            />

            <button
              type="button"
              onClick={() => void handleRequestOtp()}
              disabled={requestOtp.isPending}
              className="text-sm font-medium text-primary hover:text-primary-hover disabled:opacity-50"
            >
              {t('settings.deleteAccount.resendCode')}
            </button>
          </>
        )}

      </div>
    </BaseModal>
  );
}
