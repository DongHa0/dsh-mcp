/**
 * MCP console — Host half.
 *
 * The console is a pure browser surface: `mcpManager` already exposes the live
 * server list (plus probe and restart) to the Client through `ctx.remote`, so
 * this half registers nothing on the Host.
 */

/** No Host registration is needed for a Client-only console. */
export function apply() {}
