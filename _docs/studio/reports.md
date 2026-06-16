# Studio reports

Workspace users can submit **issues** and **feedback** from **Reports** (`/reports`) in Studio. Platform admins review submissions from **Admin → Reports** (`/admin/reports`).

## User flow

- Open **Reports** in the workspace sidebar.
- Click **New report** → `CreateReportModal` (BaseModal + modal store).
- View past submissions in the table; row click opens `ViewReportModal`.

## Admin flow

- Requires `platform.reports.read` (master has all permissions).
- Filter/search the inbox; row click opens `EditReportModal` to view details and update status (`open` / `resolved`) when `platform.reports.write` is granted.

## API

| Method | Path | Auth |
|--------|------|------|
| POST | `/v1/web/reports` | Studio session |
| GET | `/v1/web/reports` | Studio session (account-scoped) |
| GET | `/v1/web/reports/:id` | Studio session (account-scoped) |
| GET | `/v1/web/platform/reports` | Platform + `REPORTS_READ` |
| GET | `/v1/web/platform/reports/:id` | Platform + `REPORTS_READ` |
| PATCH | `/v1/web/platform/reports/:id` | Platform + `REPORTS_WRITE` |

## Email

On create, a notification is sent to `REPORTS_INBOX_EMAIL` (default `adsrahmed@gmail.com`) via Resend/SMTP with **Reply-To** set to the reporter's email.

```env
REPORTS_INBOX_EMAIL=adsrahmed@gmail.com
```

## Data

MongoDB collection `studio_reports` — see `apps/backend/src/studio/schemas/studio-report.schema.ts`.
