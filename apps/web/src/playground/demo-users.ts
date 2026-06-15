export type DemoUser = {
  id: string;
  email: string;
  name: string;
};

export const INITIAL_DEMO_USERS: DemoUser[] = [
  { id: "u1", email: "alice@demo.com", name: "Alice Demo" },
  { id: "u2", email: "bob@demo.com", name: "Bob Demo" },
];

function nextId(users: DemoUser[]): string {
  const max = users.reduce((n, u) => {
    const num = Number.parseInt(u.id.replace(/\D/g, ""), 10);
    return Number.isFinite(num) ? Math.max(n, num) : n;
  }, 0);
  return `u${max + 1}`;
}

export function normalizeEmail(email: unknown): string {
  return String(email ?? "")
    .trim()
    .toLowerCase();
}

export function addDemoUser(
  users: DemoUser[],
  input: Record<string, unknown>,
): DemoUser[] {
  const email = normalizeEmail(input.email);
  const name = String(input.name ?? email.split("@")[0] ?? "User").trim();
  if (!email) {
    throw new Error("email is required");
  }
  if (users.some((u) => u.email === email)) {
    throw new Error(`User ${email} already exists`);
  }
  return [...users, { id: nextId(users), email, name }];
}

export function deleteDemoUser(
  users: DemoUser[],
  input: Record<string, unknown>,
): DemoUser[] {
  const email = normalizeEmail(input.email);
  if (!email) {
    throw new Error("email is required");
  }
  const next = users.filter((u) => u.email !== email);
  if (next.length === users.length) {
    throw new Error(`User ${email} not found`);
  }
  return next;
}

export function updateDemoUser(
  users: DemoUser[],
  input: Record<string, unknown>,
): DemoUser[] {
  const email = normalizeEmail(input.email);
  const name = String(input.name ?? "").trim();
  if (!email || !name) {
    throw new Error("email and name are required");
  }
  if (!users.some((u) => u.email === email)) {
    throw new Error(`User ${email} not found`);
  }
  return users.map((u) => (u.email === email ? { ...u, name } : u));
}
