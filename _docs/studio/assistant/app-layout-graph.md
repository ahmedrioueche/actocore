# App layout product map

Studio **App layout** is your product map: pages, how they connect, what actions run on each screen, and what functionalities users can accomplish there.

## Graph view (default)

- **Pages** are nodes with route, title, linked **actions**, and **functionalities**
- **Links** between nodes model navigation (draw from one page handle to another)
- Drag nodes to arrange the map; positions save automatically
- Fullscreen mode for large apps; pan and zoom on desktop and mobile

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
