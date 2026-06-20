# App layout product map

Studio **App layout** is your product map: pages, how they connect, what actions run on each screen, and what functionalities users can accomplish there.

## Graph view (default)

- **Pages** are nodes with route, title, linked **actions**, and **functionalities**
- **Create child** on a page card adds a sub-page under it (dashed **contains** edges)
- **Navigation links** between handles model user navigation (solid edges)
- Collapse a parent to hide its subtree; tree layout auto-arranges new pages
- Drag nodes to arrange the map; positions save automatically
- Fullscreen mode for large apps; pan and zoom on desktop and mobile

## Page hierarchy

Build trees like `/projects` → `/projects/:projectId/knowledge` → detail routes:

1. Create the root page normally (**Add page**)
2. On the parent card, click **Create child** and enter the child route/title
3. Repeat for deeper levels

Deleting a parent reparents its direct children to the deleted page’s parent (or root).

## Root container

New projects get a **Root** container page that groups every screen on the map. Root is **not** a user-facing page.

1. Add login, projects, usage, subscription, and other screens as **children of Root** (Create child on Root, or Add page which defaults under Root)
2. Use **Add container** anytime to create grouping nodes (e.g. an Authentication section under Root with login/signup as children)
3. Use dashed **contains** edges for grouping — do not link login to every app page
3. Add solid **navigation** links only for real user paths (e.g. login → projects after sign-in)

## Export and import

Download the layout as JSON from **Export** in the graph toolbar (or table view). Reuse it in another project with **Import** — choose **Merge** to upsert by page slug, or **Replace** to wipe the current map first. Optional toggles include action assignments when action names match in the target project.

## Table view

Use the table toggle for bulk edits: enable/disable pages, review routes, and open the edit modal for actions and functionalities.

## Functionalities vs actions

| Concept | Purpose |
|---------|---------|
| **Functionality** | Goal-oriented guidance (“delete project”, “invite teammate”) — helps the assistant explain *how* |
| **Action** | Executable tool with JSON schema — your app runs it after the user clicks **Run** |

Optionally link a functionality to an action when chat should also offer execution.

## SDK integration

Pass `hostContext.route` (and `currentPage` slug when known) from your app. The manifest and runtime APIs expose pages, page links, functionalities, and actions for discovery.

See [sdk-actions-and-security.md](./sdk-actions-and-security.md).
