import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { AuthDivider } from "@/components/auth/AuthDivider";
import { AuthFormHeader } from "@/components/auth/AuthFormHeader";
import { AuthGlassCard } from "@/components/auth/AuthGlassCard";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { LoginCredentialsForm } from "@/components/auth/LoginCredentialsForm";
import { useLogin } from "@/hooks/use-auth";
import { getApiErrorMessage } from "@/utils/statusMessage";

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
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      await login.mutateAsync(
        teamMode
          ? {
              workspaceId: workspaceId.trim(),
              username: username.trim(),
              password,
            }
          : { email: email.trim(), password },
      );
      void navigate({ to: '/' });
    } catch (err) {
      const code = (err as Error & { errorCode?: string }).errorCode;
      setFormError(
        getApiErrorMessage(t, {
          errorCode: code,
          message: err instanceof Error ? err.message : undefined,
        }),
      );
    }
  };

  return (
    <AuthLayout>
      <AuthFormHeader
        title={t("auth.login.title")}
        subtitle={t("auth.login.subtitle")}
      />

      <AuthGlassCard>
        <GoogleAuthButton />
        <AuthDivider labelKey="auth.login.dividerEmail" />
        <LoginCredentialsForm
          teamMode={teamMode}
          email={email}
          password={password}
          workspaceId={workspaceId}
          username={username}
          rememberMe={rememberMe}
          formError={formError}
          loading={login.isPending}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onWorkspaceIdChange={setWorkspaceId}
          onUsernameChange={setUsername}
          onRememberMeChange={setRememberMe}
          onTeamModeToggle={() => {
            setTeamMode((v) => !v);
            setFormError(null);
          }}
          onSubmit={handleSubmit}
        />
      </AuthGlassCard>

      <footer className="mt-5 text-center">
        <p className="text-sm text-text-secondary">
          {t("auth.login.noAccount")}{" "}
          <Link
            to="/signup"
            className="font-semibold text-primary transition-colors hover:underline"
          >
            {t("auth.login.signupLink")}
          </Link>
        </p>
      </footer>
    </AuthLayout>
  );
}
