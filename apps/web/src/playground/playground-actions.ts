import {
  addDemoUser,
  deleteDemoUser,
  updateDemoUser,
  type DemoUser,
} from "./demo-users";

type PlaygroundActionHandler = (
  payload: Record<string, unknown>,
) => Promise<void> | void;

export function createPlaygroundActions(
  getUsers: () => DemoUser[],
  setUsers: (users: DemoUser[]) => void,
): Record<string, PlaygroundActionHandler> {
  return {
    add_user: async (payload) => {
      setUsers(addDemoUser(getUsers(), payload));
    },
    delete_user: async (payload) => {
      setUsers(deleteDemoUser(getUsers(), payload));
    },
    update_user: async (payload) => {
      setUsers(updateDemoUser(getUsers(), payload));
    },
    list_users: async () => {
      const users = getUsers();
      console.log(
        "[playground] users:",
        users.map((u) => ({ email: u.email, name: u.name })),
      );
    },
  };
}

export const PLAYGROUND_ACTION_NAMES = [
  "add_user",
  "delete_user",
  "update_user",
  "list_users",
] as const;
