# MCP console · DeepSeek Harness plugin

English | [中文](README.md)

<img src="icon.svg" width="72" align="right" alt="Plugin icon">

A Settings page that shows every MCP server the current profile runs, updates
itself as connection state changes, and edits the manager's `servers`
configuration in place.

## Install

DeepSeek Harness desktop, **Settings → Plugins → Add plugin**, then enter one of:

- `github:DongHa0/dsh-mcp` — installs the latest commit of this repository;
- the absolute path of a checked-out copy of this folder;
- the absolute path of a packed `.tgz`.

Refresh the page afterwards, then open **Settings → MCP**. A GitHub install is
updated by removing and adding it again; an `npm` install gets a version list and
one-click updates (see [PUBLISH.md](PUBLISH.md)).

## Where it is

Open **Settings → MCP** (the sidebar's gear icon). The page renders inside the
settings panel next to Models, Plugins, and Agent presets.

## What it shows

- One row per managed server, sorted configured before plugin-registered.
- A state dot and label: connected, connecting, reconnecting, waiting for
  credentials, disabled, closed, failed (load / cleanup / gave-up /
  reconnect-disabled / unclosed generation).
- Supporting detail: tool count and connect time, the current retry attempt and
  next attempt time, or the last diagnostic text.
- `Probe` runs one connection test on a throwaway instance and reports the
  server identity, advertised tool names, duration, and whether the transport
  closed. The live instance keeps running during a probe, and a disabled entry
  can still be probed.
- `Restart` disposes the live instance and mounts a fresh one with a new
  reconnect budget. Use it when a server gave up reconnecting.

## Adding and editing servers

`Add server` opens the same editor a row's `Edit` button opens:

- **Name** — the `servers` key and the `mcp__<name>__*` tool namespace. Letters,
  digits, underscores or hyphens, up to 32 characters. A name cannot be changed
  after creation.
- **Transport** — `stdio` (command, arguments, environment, working directory)
  or `streamable-http` (URL, request headers).
- **Enabled** — a disabled entry keeps its configuration but starts no instance.
- **Advanced** — startup, tool-call, and close timeouts in milliseconds; blank
  fields inherit the manager and client defaults.

`Save` writes one path operation into the `mcp-manager` entry's `servers` map
through the profile's configuration document, carrying the revision the page
read. A concurrent change is refused instead of overwritten: the page reloads
the latest values, keeps the draft, and asks to save again. The host's own
validation message (missing command, cross-transport field, duplicate name,
malformed token) is shown in the editor, and the form itself catches empty or
duplicate key/value names and non-positive timeouts before saving. Values accept
`${credential:NAME}` so a secret can live in the credential store instead of the
configuration file.

`Delete` removes an entry the page itself wrote. When the entry also exists in a
lower layer, the button reads `Restore inherited` and only drops the user-layer
override, so the inherited server comes back.

### Filling the form quickly

- `Import JSON` accepts one server entry, an `mcpServers` block holding exactly
  one server, or a `{ "name": entry }` pair. It fills the whole form, lists any
  key it ignored, and `Undo` restores what the form held before the import.
- `Split command line` beside Command takes something like
  `npx -y @scope/server --flag "a b"` and fills Command plus one row per
  argument. Quotes and escapes follow shell rules, and Windows paths such as
  `"C:\nvm4w\nodejs\node.exe"` survive unchanged.
- Arguments are one row each. Pasting several lines into a row adds them all;
  `Paste list` accepts a JSON array, a whole command line, or one per line.
- Environment variables and headers: paste `KEY=VALUE` lines or a JSON object
  into any name field to expand several rows at once. `Hide`/`Show` masks
  token-looking values, and `${}` inserts a `${credential:}` reference with the
  caret placed inside the braces.

Servers registered by other plugins (they appear with the `Plugin` badge) are
read-only here; the contributing plugin owns their lifetime.

## Notes

- The page reads the same settings document as the shipped configuration forms,
  so a change made in either place shows up in both.
- A read-only profile (`writable: false`) hides every write control and says so.
- A removed entry can stay listed with `configured: false` while its cleanup is
  pending or has failed; it disappears on the next successful cleanup or on host
  restart.
- Agent-preset or static `cordis.yml` MCP rows mounted outside the manager are
  not listed; the manager only governs the global plane.
