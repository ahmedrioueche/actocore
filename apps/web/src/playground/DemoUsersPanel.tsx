import { useT } from "@/i18n/useT";

import type { DemoUser } from "./demo-users";

type DemoUsersPanelProps = {
  users: DemoUser[];
};

export function DemoUsersPanel({ users }: DemoUsersPanelProps) {
  const { t } = useT("playground.demoUsers");

  return (
    <section className="glass-panel rounded-2xl border border-border p-5">
      <h2 className="mb-2 text-lg font-semibold text-text-primary">{t("title")}</h2>
      <p className="mb-4 text-sm text-text-secondary">{t("description")}</p>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[16rem] text-left text-sm">
          <thead className="border-b border-border bg-surface-secondary text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-2.5 font-semibold">{t("email")}</th>
              <th className="px-4 py-2.5 font-semibold">{t("name")}</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-4 py-3 text-muted">
                  {t("empty")}
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2.5 text-text-primary">{user.email}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{user.name}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
