import type { DemoUser } from './demo-users';

const EXAMPLE_PROMPTS = [
  'Add user jane@demo.com named Jane Doe',
  'Delete user with email bob@demo.com',
  'Update user with email alice@demo.com, make their name Alice Kiro',
  'Show all users',
];

export function DemoUsersPanel({ users }: { users: DemoUser[] }) {
  return (
    <section
      style={{
        marginBottom: '20px',
        padding: '16px',
        borderRadius: '12px',
        background: 'rgb(255 255 255 / 0.06)',
        border: '1px solid rgb(255 255 255 / 0.1)',
      }}
    >
      <h2 style={{ margin: '0 0 8px', fontSize: '1.1rem' }}>Demo users (host app)</h2>
      <p style={{ margin: '0 0 12px', fontSize: '0.875rem', opacity: 0.85 }}>
        Describe what you want in chat (e.g. &quot;Delete user bob@demo.com&quot;) — the assistant
        prepares the action and you confirm once. Real editing stays in your app table below.
        Seed Core actions with <code>npm run seed:actions</code> if actions fail.
      </p>

      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.875rem',
          marginBottom: '12px',
        }}
      >
        <thead>
          <tr style={{ textAlign: 'left', opacity: 0.7 }}>
            <th style={{ padding: '6px 8px' }}>Email</th>
            <th style={{ padding: '6px 8px' }}>Name</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan={2} style={{ padding: '8px', opacity: 0.7 }}>
                No users — try adding one via chat.
              </td>
            </tr>
          ) : (
            users.map((u) => (
              <tr key={u.id}>
                <td style={{ padding: '6px 8px' }}>{u.email}</td>
                <td style={{ padding: '6px 8px' }}>{u.name}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div style={{ fontSize: '0.8rem', opacity: 0.85 }}>
        <strong>Example prompts</strong>
        <ul style={{ margin: '8px 0 0', paddingLeft: '1.25rem' }}>
          {EXAMPLE_PROMPTS.map((p) => (
            <li key={p} style={{ marginBottom: '4px' }}>
              <code>{p}</code>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
