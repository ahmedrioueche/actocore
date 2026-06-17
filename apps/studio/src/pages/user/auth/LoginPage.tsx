import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { AuthDivider } from "@/components/auth/AuthDivider";
import { AuthFormHeader } from "@/components/auth/AuthFormHeader";
import { AuthGlassCard } from "@/components/auth/AuthGlassCard";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { LoginCredentialsForm } from "@/components/auth/LoginCredentialsForm";
import { TestAccountPicker } from "@/components/auth/TestAccountPicker";
import {
  isStudioTestAccountsEnabled,
} from "@/constants/studio-test-accounts";
import { useAvailableTestAccount, useLogin } from "@/hooks/use-auth";
import { toast } from "@/stores/toast";
import { getUnknownApiErrorMessage } from "@/utils/statusMessage";
import type { StudioAvailableTestAccountData } from "@ahmedrioueche/actocore-shared";

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const login = useLogin();

  const [teamMode, setTeamMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");
  const [username, setUsername] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [demoSigningIn, setDemoSigningIn] = useState(false);

  const availableTestAccount = useAvailableTestAccount(!teamMode);

  const handleLogin = async (credentials: {
    email: string;
    password: string;
  }) => {
    try {
      await login.mutateAsync(credentials);
      void navigate({ to: '/' });
    } catch (err) {
      toast.error(getUnknownApiErrorMessage(t, err));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (teamMode) {
      try {
        await login.mutateAsync({
          workspaceId: workspaceId.trim(),
          username: username.trim(),
          password,
        });
        void navigate({ to: '/' });
      } catch (err) {
        toast.error(getUnknownApiErrorMessage(t, err));
      }
      return;
    }

    await handleLogin({ email: email.trim(), password });
  };

  const handleTestAccountSelect = async (
    account: StudioAvailableTestAccountData,
  ) => {
    setTeamMode(false);
    setDemoSigningIn(true);

    try {
      await login.mutateAsync({
        email: account.email,
        password: account.password,
      });
      void navigate({ to: '/' });
    } catch (err) {
      toast.error(getUnknownApiErrorMessage(t, err));
      void availableTestAccount.refetch();
    } finally {
      setDemoSigningIn(false);
    }
  };

  return (
    <AuthLayout>
      <AuthFormHeader
        title={t("auth.login.title")}
        subtitle={t("auth.login.subtitle")}
      />

      <AuthGlassCard>
        {isStudioTestAccountsEnabled() && !teamMode ? (
          <>
            <TestAccountPicker
              account={availableTestAccount.data?.account}
              loading={login.isPending}
              loadingAvailability={availableTestAccount.isLoading}
              retryAfterSeconds={availableTestAccount.data?.retryAfterSeconds}
              signingIn={demoSigningIn}
              onSelect={(account) => void handleTestAccountSelect(account)}
            />
            <AuthDivider labelKey="auth.testAccounts.dividerContinue" />
          </>
        ) : null}

        <GoogleAuthButton />
        <AuthDivider labelKey="auth.login.dividerEmail" />
        <LoginCredentialsForm
          teamMode={teamMode}
          email={email}
          password={password}
          workspaceId={workspaceId}
          username={username}
          rememberMe={rememberMe}
          loading={login.isPending}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onWorkspaceIdChange={setWorkspaceId}
          onUsernameChange={setUsername}
          onRememberMeChange={setRememberMe}
          onTeamModeToggle={() => setTeamMode((v) => !v)}
          onSubmit={handleSubmit}
        />
      </AuthGlassCard>

      <footer className="mt-5 text-center">
        <p className="text-sm text-text-secondary">
          {t("auth.login.noAccount")}{" "}
          <Link
            to="/signup"
            search={{ plan: undefined, cycle: undefined }}
            className="font-semibold text-primary transition-colors hover:underline"
          >
            {t("auth.login.signupLink")}
          </Link>
        </p>
      </footer>
    </AuthLayout>
  );
}
