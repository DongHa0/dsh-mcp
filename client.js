/**
 * MCP console — browser half.
 *
 * Adds one Settings page that reads the live managed-server list from
 * `ctx.remote.mcpManager` and edits the manager's `servers` configuration
 * through the settings document (`ctx.remote.settings.mutate`), the same
 * revision-fenced write path the shipped configuration forms use.
 *
 * Contracts checked against the installed Harness:
 * - `settings.section` (list, root scope) renders one Settings page.
 * - `ctx.remote.mcpManager.watch(signal)` is a Remote stream of
 *   `McpManagedServerView[]`; `restart` and `probe` answer `RemoteResult`s.
 * - A settings namespace is the profile entry id (`mcp-manager`), its view
 *   carries `value` / `base` / `user` / `revision` / `secrets` / `writable`,
 *   and writes are `{ op: 'set' | 'unset', path, value }` path operations.
 * - `ctx.configForms.describe()` is the shared, invalidation-driven settings
 *   mirror the page reads from.
 */

window.__ModuleLoader__.load({
  id: '@local/mcp-console',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    /** Locale namespace owned by this plugin. */
    const NS = 'mcpConsole'

    /** Entry ids this page may own across profiles, most specific first. */
    const NAMESPACE_CANDIDATES = ['mcp-manager', 'mcp']

    /** English copy. */
    const en = {
      nav: 'MCP',
      title: 'MCP servers',
      intro: 'Live state of every managed MCP server in this profile, and the place to add or change them. Status updates by itself. Probe tests a server once without touching its live instance; Restart rebuilds it with a fresh reconnect budget.',
      summary: 'Servers: {total} · Connected: {connected}',
      loading: 'Reading MCP servers…',
      loadError: 'Could not read MCP servers: {message}',
      retry: 'Retry',
      emptyTitle: 'No MCP servers yet',
      emptyBody: 'Add one here, or edit the `mcp-manager` entry\'s `servers` config in Settings → Plugins or your profile\'s cordis.patch.yml.',
      sourceConfigured: 'Configured',
      sourceRegistered: 'Plugin',
      sourceCleanup: 'Cleanup pending',
      stConnected: 'Connected',
      stConnecting: 'Connecting',
      stReconnecting: 'Reconnecting',
      stWaitingCredentials: 'Waiting for credentials',
      stClosed: 'Closed',
      stDisabled: 'Disabled',
      stLoadFailed: 'Failed to load',
      stCleanupFailed: 'Cleanup failed',
      stGaveUp: 'Gave up reconnecting',
      stReconnectDisabled: 'Disconnected',
      stUnclosed: 'Disconnected (unclosed)',
      stFailed: 'Failed',
      detailConnected: '{count} tools · connected at {time}',
      detailAttempt: 'Attempt {attempt}',
      detailReconnecting: 'Attempt {attempt}/{max} · next {time}',
      detailDisabled: 'Entry kept, instance unloaded',
      detailCloseUnconfirmed: 'Transport closure not confirmed',
      probe: 'Probe',
      probing: 'Probing…',
      restart: 'Restart',
      restarting: 'Restarting…',
      restarted: 'Restarted',
      probeOkServer: '{name} {version}',
      probeOk: '{count} tools · {ms} ms',
      probeTruncated: 'Tool list truncated',
      probeUnclosed: 'Transport closure not confirmed',
      probeCleanupError: 'Cleanup failed: {message}',
      probeFailedConnect: 'Connect failed: {message}',
      probeFailedList: 'Tool listing failed: {message}',
      toolsLabel: 'Tools',
      streamEnded: 'Live updates stopped',
      addServer: 'Add server',
      newServer: 'New MCP server',
      editServer: 'Edit {name}',
      edit: 'Edit',
      delete: 'Delete',
      restoreInherited: 'Restore inherited',
      confirmDelete: 'Confirm delete',
      confirmDeleteHint: 'This takes effect immediately and cannot be undone.',
      cancel: 'Cancel',
      cancelDelete: 'Back',
      name: 'Name',
      nameHint: 'Letters, digits, underscore or hyphen, up to 32 characters. The name is also the tool namespace, so it cannot change later.',
      transport: 'Transport',
      transportStdio: 'stdio (local process)',
      transportHttp: 'streamable-http (remote URL)',
      command: 'Command',
      args: 'Arguments',
      env: 'Environment variables',
      cwd: 'Working directory',
      url: 'Server URL',
      headers: 'Request headers',
      enabled: 'Enabled',
      enabledHint: 'A disabled entry keeps its configuration but starts no instance.',
      advanced: 'Advanced',
      startupTimeout: 'Startup timeout (ms)',
      toolCallTimeout: 'Tool call timeout (ms)',
      closeTimeout: 'Close timeout (ms)',
      optional: 'optional',
      keyLabel: 'Name',
      valueLabel: 'Value',
      addRow: 'Add row',
      removeRow: 'Remove row',
      save: 'Save',
      saving: 'Saving…',
      saveFailed: 'Save failed: {message}',
      deleteFailed: 'Delete failed: {message}',
      readOnly: 'This profile does not accept configuration writes, so servers are read-only here.',
      settingsUnavailable: 'The MCP manager exposes no editable configuration in this profile; only status is shown.',
      registeredHint: 'Registered by a plugin; edit it in that plugin.',
      secretHint: 'Values accept ${credential:NAME} to reference a stored credential instead of pasting a secret.',
      errName: 'Use 1–32 letters, digits, underscores or hyphens.',
      errDuplicate: 'A server with this name already exists.',
      errCommand: 'A stdio server needs a command.',
      errUrl: 'A streamable-http server needs a URL.',
      errTimeout: 'A timeout must be a positive whole number of milliseconds; leave it blank to inherit the default.',
      errPairKey: 'A name in the list is empty.',
      errPairDuplicate: 'Duplicate name: {name}',
      conflict: 'This configuration changed elsewhere; the latest values are loaded. Review the form and save again.',
      advancedHint: 'Blank inherits the manager and client defaults; a value must be a positive whole number of milliseconds.',
      showValue: 'Show',
      hideValue: 'Hide',
      insertCredential: 'Insert credential reference',
      envPasteHint: 'Paste KEY=VALUE lines or a JSON object into a name field to add several rows at once.',
      argsCount: '{count} arguments',
      argLabel: 'Argument {index}',
      addArg: 'Add argument',
      pasteArgs: 'Paste list',
      argsPasteHint: 'Paste a JSON array, a whole command line, or one argument per line.',
      pasteApply: 'Apply',
      importConfig: 'Import JSON',
      importHint: 'Paste one server entry, an `mcpServers` block with exactly one server, or a `{ "name": entry }` pair.',
      imported: 'Imported: {fields}',
      importApply: 'Fill form',
      importIgnored: 'Ignored keys: {names}',
      importFailed: 'Could not read that: {message}',
      noticeArgs: 'Applied {count} arguments',
      noticeCommand: 'Command "{command}" with {count} arguments',
      splitCommand: 'Split command line',
      splitHint: 'Paste a full command line; quotes and escapes are split the way a shell would.',
      splitApply: 'Split',
      splitFailed: 'Could not split that: {message}',
      undo: 'Undo',
    }

    /** Simplified Chinese copy. */
    const zh = {
      nav: 'MCP',
      title: 'MCP 服务器',
      intro: '本机所有受管 MCP 服务器的实时状态，也是新增和修改它们的地方。状态自行更新。「探测」在不影响现有连接的情况下做一次性连通测试；「重启」会重建该服务器并重置重连预算。',
      summary: '共 {total} 台 · 已连接 {connected} 台',
      loading: '正在读取 MCP 服务器…',
      loadError: '读取失败：{message}',
      retry: '重试',
      emptyTitle: '还没有 MCP 服务器',
      emptyBody: '可以在这里新增；也可以在「设置 → 插件」里编辑 `mcp-manager` 条目的 `servers` 配置，或改 profile 的 `cordis.patch.yml`。',
      sourceConfigured: '配置',
      sourceRegistered: '插件注册',
      sourceCleanup: '清理中',
      stConnected: '已连接',
      stConnecting: '连接中',
      stReconnecting: '重连中',
      stWaitingCredentials: '等待凭据',
      stClosed: '已关闭',
      stDisabled: '已停用',
      stLoadFailed: '加载失败',
      stCleanupFailed: '清理失败',
      stGaveUp: '重连次数耗尽',
      stReconnectDisabled: '已断开',
      stUnclosed: '已断开（未确认关闭）',
      stFailed: '失败',
      detailConnected: '{count} 个工具 · 连接于 {time}',
      detailAttempt: '第 {attempt} 次尝试',
      detailReconnecting: '第 {attempt}/{max} 次 · 下次 {time}',
      detailDisabled: '条目保留，实例已卸载',
      detailCloseUnconfirmed: '传输关闭未确认',
      probe: '探测',
      probing: '探测中…',
      restart: '重启',
      restarting: '重启中…',
      restarted: '已重启',
      probeOkServer: '{name} {version}',
      probeOk: '{count} 个工具 · {ms} ms',
      probeTruncated: '工具清单已截断',
      probeUnclosed: '传输关闭未确认',
      probeCleanupError: '清理失败：{message}',
      probeFailedConnect: '连接失败：{message}',
      probeFailedList: '读取工具失败：{message}',
      toolsLabel: '工具',
      streamEnded: '实时更新已停止',
      addServer: '添加服务器',
      newServer: '新增 MCP 服务器',
      editServer: '编辑 {name}',
      edit: '编辑',
      delete: '删除',
      restoreInherited: '恢复继承',
      confirmDelete: '确认删除',
      confirmDeleteHint: '删除后立即生效，无法撤销。',
      cancel: '取消',
      cancelDelete: '返回',
      name: '名称',
      nameHint: '字母、数字、下划线或短横，最长 32 个字符。名称同时是工具命名空间，创建后不可修改。',
      transport: '传输方式',
      transportStdio: 'stdio（本地进程）',
      transportHttp: 'streamable-http（远程地址）',
      command: '启动命令',
      args: '参数',
      env: '环境变量',
      cwd: '工作目录',
      url: '服务地址',
      headers: '请求头',
      enabled: '启用',
      enabledHint: '停用后保留配置，但不启动实例。',
      advanced: '高级',
      startupTimeout: '启动超时（毫秒）',
      toolCallTimeout: '工具调用超时（毫秒）',
      closeTimeout: '关闭超时（毫秒）',
      optional: '可选',
      keyLabel: '键',
      valueLabel: '值',
      addRow: '添加一行',
      removeRow: '删除这一行',
      save: '保存',
      saving: '保存中…',
      saveFailed: '保存失败：{message}',
      deleteFailed: '删除失败：{message}',
      readOnly: '当前 profile 不接受配置写入，这里只能查看。',
      settingsUnavailable: '当前 profile 里 MCP 管理器没有暴露可编辑的配置，只显示状态。',
      registeredHint: '由插件注册，请到该插件的配置里修改。',
      secretHint: '值支持 ${credential:名称} 引用已保存的凭据，不必把密钥明文写进配置。',
      errName: '请使用 1–32 位字母、数字、下划线或短横。',
      errDuplicate: '已存在同名服务器。',
      errCommand: 'stdio 服务器需要启动命令。',
      errUrl: 'streamable-http 服务器需要服务地址。',
      errTimeout: '超时必须是正整数（毫秒）；留空表示继承默认值。',
      errPairKey: '列表里有一行的「键」为空。',
      errPairDuplicate: '键重复：{name}',
      conflict: '配置已在别处修改，已同步最新值。请核对表单后再次保存。',
      advancedHint: '留空继承管理器与客户端的默认值；填写需为正整数（毫秒）。',
      showValue: '显示',
      hideValue: '隐藏',
      insertCredential: '插入凭据引用',
      envPasteHint: '在「键」输入框粘贴多行 KEY=VALUE 或一个 JSON 对象，可一次生成多行。',
      argsCount: '共 {count} 个参数',
      argLabel: '参数 {index}',
      addArg: '添加参数',
      pasteArgs: '批量粘贴',
      argsPasteHint: '粘贴 JSON 数组、整条命令行，或每行一个参数。',
      pasteApply: '应用',
      importConfig: '粘贴配置',
      importHint: '粘贴一个服务器条目、只含一台服务器的 `mcpServers` 片段，或 `{ "名称": 条目 }`。',
      imported: '已导入：{fields}',
      importApply: '解析并填充',
      importIgnored: '已忽略未知键：{names}',
      importFailed: '无法解析：{message}',
      noticeArgs: '已应用 {count} 个参数',
      noticeCommand: '命令「{command}」，{count} 个参数',
      splitCommand: '从命令行填充',
      splitHint: '粘贴完整命令行，按 shell 的引号与转义规则拆分。',
      splitApply: '拆分',
      splitFailed: '无法拆分：{message}',
      undo: '撤销',
    }

    /**
     * Component-scoped stylesheet. Rendered inside the section so unmounting it
     * removes the rules; only `--dsw-alias-*` theme tokens are referenced, and
     * every class is prefixed to stay clear of host styles.
     */
    const CSS = `
.mc-section { display: flex; flex-direction: column; gap: 12px; max-width: 760px; color: var(--dsw-alias-label-primary); }
.mc-header { display: flex; flex-direction: column; gap: 6px; }
.mc-title { margin: 0; font-size: 18px; line-height: 26px; font-weight: 600; }
.mc-intro { margin: 0; font-size: 13px; line-height: 20px; color: var(--dsw-alias-label-tertiary); overflow-wrap: anywhere; }
.mc-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 26px; }
.mc-summary { font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-secondary); }
.mc-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; border: 0.5px solid var(--dsw-alias-border-l2); border-radius: 10px; background: var(--dsw-alias-bg-layer-1); overflow: hidden; }
.mc-row { display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; }
.mc-row + .mc-row { border-top: 0.5px solid var(--dsw-alias-border-l1); }
.mc-dot { flex: none; width: 8px; height: 8px; margin-top: 7px; border-radius: 50%; background: var(--dsw-alias-state-idle-primary); }
.mc-dot[data-tone='ok'] { background: var(--dsw-alias-state-success-primary); }
.mc-dot[data-tone='warn'] { background: var(--dsw-alias-state-warn-primary); }
.mc-dot[data-tone='error'] { background: var(--dsw-alias-state-error-primary); }
.mc-body { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.mc-rowheading { display: flex; align-items: baseline; flex-wrap: wrap; gap: 8px; min-width: 0; }
.mc-name { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 13px; line-height: 18px; font-weight: 600; overflow-wrap: anywhere; }
.mc-badge { flex: none; padding: 0 6px; border: 0.5px solid var(--dsw-alias-border-l2); border-radius: 999px; font-size: 11px; line-height: 16px; color: var(--dsw-alias-label-secondary); }
.mc-status { font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-secondary); }
.mc-status[data-tone='error'] { color: var(--dsw-alias-state-error-primary); }
.mc-detail { margin: 0; font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-secondary); overflow-wrap: anywhere; white-space: pre-wrap; }
.mc-probe { display: flex; flex-direction: column; gap: 2px; margin-top: 2px; padding: 6px 8px; border-radius: 6px; background: var(--dsw-alias-bg-layer-2); }
.mc-probe-line { margin: 0; font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-primary); overflow-wrap: anywhere; }
.mc-probe[data-tone='error'] .mc-probe-line { color: var(--dsw-alias-state-error-primary); }
.mc-tools { margin: 0; font-size: 11px; line-height: 17px; color: var(--dsw-alias-label-secondary); overflow-wrap: anywhere; }
.mc-tools-label { color: var(--dsw-alias-label-primary); }
.mc-error { margin: 0; font-size: 12px; line-height: 18px; color: var(--dsw-alias-state-error-primary); overflow-wrap: anywhere; white-space: pre-wrap; }
.mc-actions { flex: none; display: flex; align-items: center; gap: 6px; padding-top: 1px; }
.mc-button { border: 0.5px solid var(--dsw-alias-border-l2); border-radius: 6px; padding: 3px 10px; background: transparent; color: var(--dsw-alias-label-primary); font: inherit; font-size: 12px; line-height: 18px; white-space: nowrap; cursor: pointer; }
@media (hover: hover) { .mc-button:hover:not(:disabled) { background: var(--dsw-alias-bg-layer-2); } }
.mc-button:disabled { opacity: 0.55; cursor: default; }
.mc-button:focus-visible { outline: 2px solid var(--dsw-focus-ring-color, var(--dsw-alias-brand-primary)); outline-offset: 2px; }
.mc-button[data-emphasis='strong'] { border-color: var(--dsw-alias-label-secondary); font-weight: 600; }
.mc-editor { display: flex; flex-direction: column; gap: 10px; margin-top: 6px; padding: 12px 14px; border: 0.5px solid var(--dsw-alias-border-l2); border-radius: 10px; background: var(--dsw-alias-bg-layer-1); }
.mc-editor-title { margin: 0; font-size: 13px; line-height: 20px; font-weight: 600; }
.mc-field { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.mc-fieldrow { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.mc-label { font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-secondary); }
.mc-input, .mc-select, .mc-textarea { min-width: 0; padding: 4px 8px; border: 0.5px solid var(--dsw-alias-border-l2); border-radius: 6px; background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary); font: inherit; font-size: 12px; line-height: 18px; }
.mc-textarea { min-height: 64px; resize: vertical; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
.mc-input:focus-visible, .mc-select:focus-visible, .mc-textarea:focus-visible { outline: 2px solid var(--dsw-focus-ring-color, var(--dsw-alias-brand-primary)); outline-offset: 1px; }
.mc-input[readonly] { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-secondary); }
.mc-button[data-tone='danger'] { border-color: var(--dsw-alias-state-error-primary); color: var(--dsw-alias-state-error-primary); }
.mc-confirm { padding-top: 8px; border-top: 0.5px solid var(--dsw-alias-border-l1); }
.mc-pairs { display: flex; flex-direction: column; gap: 6px; }
.mc-pair { display: flex; align-items: center; gap: 6px; }
.mc-pair .mc-input { flex: 1 1 0; }
.mc-check { display: flex; align-items: center; gap: 6px; font-size: 12px; line-height: 18px; }
.mc-hint { margin: 0; font-size: 11px; line-height: 17px; color: var(--dsw-alias-label-secondary); overflow-wrap: anywhere; }
.mc-editor-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.mc-editor-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
.mc-field-head { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
.mc-field-actions { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.mc-paste { display: flex; flex-direction: column; gap: 8px; padding: 10px 12px; border: 0.5px solid var(--dsw-alias-border-l2); border-radius: 8px; background: var(--dsw-alias-bg-layer-2); }
.mc-pair .mc-button { flex: none; }
.mc-spacer { flex: 1 1 auto; }
.mc-empty { display: flex; flex-direction: column; gap: 6px; margin: 0; padding: 16px; border: 0.5px dashed var(--dsw-alias-border-l2); border-radius: 10px; }
.mc-empty-title { margin: 0; font-size: 13px; line-height: 20px; font-weight: 600; }
.mc-empty-body { margin: 0; font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-secondary); overflow-wrap: anywhere; }
@media (max-width: 520px) {
  .mc-row { flex-wrap: wrap; }
  .mc-actions { width: 100%; padding-left: 18px; }
  .mc-fieldrow { grid-template-columns: 1fr; }
}
`

    /** Format an epoch millisecond value as local wall-clock time. */
    function formatTime(value) {
      if (typeof value !== 'number' || !Number.isFinite(value)) return '—'
      try {
        return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(value))
      } catch {
        return new Date(value).toLocaleTimeString()
      }
    }

    /** Best-effort message for anything thrown or rejected. */
    function messageOf(error) {
      if (error && typeof error === 'object' && typeof error.message === 'string') return error.message
      return String(error)
    }

    /** Unwrap a RemoteResult, turning a failure into a thrown error that keeps its code. */
    function unwrap(result) {
      // A RemoteResult carries `value` or `error`; a probe payload carries
      // `ok` too, so the wrapper is recognised by its own fields alone.
      if (result && typeof result === 'object' && 'ok' in result && ('value' in result || 'error' in result)) {
        if (result.ok) return result.value
        const failure = result.error || {}
        const error = new Error(failure.message ? String(failure.message) : String(failure.code || 'remote call failed'))
        if (typeof failure.code === 'string') error.code = failure.code
        throw error
      }
      return result
    }

    /** Whether a value is a plain object (not null, not an array). */
    function isPlainObject(value) {
      return typeof value === 'object' && value !== null && !Array.isArray(value)
    }

    /** Own-property check that survives keys like `constructor`. */
    function hasOwn(target, key) {
      return isPlainObject(target) && Object.prototype.hasOwnProperty.call(target, key)
    }

    /** Visual tone for one managed-server status. */
    function toneOf(status) {
      if (!status || typeof status.state !== 'string') return 'idle'
      switch (status.state) {
        case 'connected': return 'ok'
        case 'connecting':
        case 'reconnecting':
        case 'waiting-credentials': return 'warn'
        case 'failed': return 'error'
        default: return 'idle'
      }
    }

    /** Localized status label for one managed-server status. */
    function statusLabel(t, status) {
      if (!status || typeof status.state !== 'string') return '—'
      switch (status.state) {
        case 'connected': return t('stConnected')
        case 'connecting': return t('stConnecting')
        case 'reconnecting': return t('stReconnecting')
        case 'waiting-credentials': return t('stWaitingCredentials')
        case 'closed': return t('stClosed')
        case 'disabled': return t('stDisabled')
        case 'failed':
          switch (status.reason) {
            case 'load': return t('stLoadFailed')
            case 'cleanup': return t('stCleanupFailed')
            case 'gave-up': return t('stGaveUp')
            case 'reconnect-disabled': return t('stReconnectDisabled')
            case 'unclosed-generation': return t('stUnclosed')
            default: return t('stFailed')
          }
        default: return status.state
      }
    }

    /** Supporting line for one managed-server status; empty when it adds nothing. */
    function detailOf(t, status) {
      if (!status || typeof status.state !== 'string') return ''
      switch (status.state) {
        case 'connected':
          return t('detailConnected', { count: Number(status.toolCount) || 0, time: formatTime(status.connectedAt) })
        case 'connecting':
          return Number(status.attempt) > 0 ? t('detailAttempt', { attempt: status.attempt }) : ''
        case 'reconnecting':
          return t('detailReconnecting', { attempt: status.attempt, max: status.maxAttempts, time: formatTime(status.nextRetryAtMs) })
        case 'waiting-credentials':
          return status.lastError ? String(status.lastError) : ''
        case 'closed':
          if (status.result && status.result.closeConfirmed) return status.result.cleanupError ? String(status.result.cleanupError) : ''
          return status.result && status.result.cleanupError ? String(status.result.cleanupError) : t('detailCloseUnconfirmed')
        case 'disabled':
          return t('detailDisabled')
        case 'failed':
          if (status.lastError) return String(status.lastError)
          if (status.result && status.result.cleanupError) return String(status.result.cleanupError)
          if (status.result && !status.result.closeConfirmed) return t('detailCloseUnconfirmed')
          return ''
        default:
          return ''
      }
    }

    /**
     * Find the settings namespace that owns the managed `servers` map.
     * @param view - the describe view, when one has been read.
     * @returns the namespace view, or undefined when this profile serves none.
     */
    function pickNamespace(view) {
      const namespaces = view && Array.isArray(view.namespaces) ? view.namespaces : []
      for (const candidate of NAMESPACE_CANDIDATES) {
        const hit = namespaces.find(entry => entry && entry.ns === candidate)
        if (hit !== undefined) return hit
      }
      return namespaces.find(entry => isPlainObject(entry) && isPlainObject(entry.value) && isPlainObject(entry.value.servers))
    }

    /** Map a `{ key: value }` record to editor rows. */
    function toPairs(record) {
      if (!isPlainObject(record)) return []
      return Object.keys(record).map(key => ({ key, value: String(record[key] === undefined ? '' : record[key]) }))
    }

    /** Fold editor rows back into a record, dropping blank names and later duplicates. */
    function pairsToObject(pairs) {
      const record = {}
      for (const pair of Array.isArray(pairs) ? pairs : []) {
        const key = typeof pair.key === 'string' ? pair.key.trim() : ''
        if (key === '') continue
        record[key] = typeof pair.value === 'string' ? pair.value : ''
      }
      return record
    }

    /** Split a textarea into trimmed, non-empty lines. */
    function splitLines(text) {
      return String(text === undefined || text === null ? '' : text)
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line !== '')
    }

    /**
     * Tokenize one command line the way a POSIX shell would: whitespace
     * separates arguments, single quotes keep everything literally, double
     * quotes keep everything but `\"` and `\\`, and a bare backslash escapes
     * the next character.
     * @param text - the command line to split.
     * @returns one token per argument.
     * @throws when a quote is left open, so the caller can report it.
     */
    function tokenizeCommandLine(text) {
      const tokens = []
      let current = ''
      let quote = ''
      let started = false
      for (let index = 0; index < text.length; index += 1) {
        const char = text[index]
        if (quote !== '') {
          if (char === quote) { quote = ''; continue }
          // Inside double quotes only these characters are escapable; any other
          // backslash stays literal, which keeps Windows paths such as
          // "C:\nvm4w\nodejs\node.exe" intact.
          if (char === '\\' && quote === '"' && index + 1 < text.length) {
            const next = text[index + 1]
            if (next === '"' || next === '\\' || next === '$' || next === '`') {
              index += 1
              current += next
              continue
            }
            current += char
            continue
          }
          current += char
          continue
        }
        if (char === '"' || char === "'") { quote = char; started = true; continue }
        if (char === '\\' && index + 1 < text.length) {
          // Unquoted escapes cover separators and quotes only, so a bare
          // Windows path is not silently stripped.
          const next = text[index + 1]
          if (next === ' ' || next === '\t' || next === '"' || next === "'" || next === '\\') {
            index += 1
            current += next
            started = true
            continue
          }
          current += char
          started = true
          continue
        }
        if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
          if (started) { tokens.push(current); current = ''; started = false }
          continue
        }
        current += char
        started = true
      }
      if (quote !== '') throw new Error('unterminated quote')
      if (started) tokens.push(current)
      return tokens
    }

    /**
     * Parse a pasted argument list: a JSON array, a whole command line, or one
     * argument per line.
     * @param text - pasted text.
     * @returns the arguments, in order.
     * @throws when the text looks like JSON but is not a string array.
     */
    function parseArgsPaste(text) {
      const trimmed = String(text === undefined ? '' : text).trim()
      if (trimmed === '') return []
      if (trimmed.startsWith('[')) {
        const parsed = JSON.parse(trimmed)
        if (!Array.isArray(parsed)) throw new Error('expected a JSON array')
        return parsed.map(value => String(value))
      }
      if (trimmed.includes('\n')) return splitLines(trimmed)
      return tokenizeCommandLine(trimmed)
    }

    /**
     * Parse pasted environment or header rows: a JSON object, or `KEY=VALUE`
     * lines (comments and an `export ` prefix are tolerated).
     * @param text - pasted text.
     * @returns editor rows.
     * @throws when the text looks like JSON but is not an object, or a row has no `=`.
     */
    function parsePairsPaste(text) {
      const source = String(text === undefined ? '' : text)
      const trimmed = source.trim()
      if (trimmed === '') return []
      if (trimmed.startsWith('{')) {
        const parsed = JSON.parse(trimmed)
        if (!isPlainObject(parsed)) throw new Error('expected a JSON object')
        return Object.keys(parsed).map(key => ({ key, value: String(parsed[key] === undefined ? '' : parsed[key]) }))
      }
      const pairs = []
      for (const rawLine of source.split(/\r?\n/)) {
        let line = rawLine.trim()
        if (line === '' || line.startsWith('#')) continue
        if (line.startsWith('export ')) line = line.slice(7).trim()
        const at = line.indexOf('=')
        if (at <= 0) throw new Error(`missing "=" in "${line}"`)
        const key = line.slice(0, at).trim()
        let value = line.slice(at + 1).trim()
        const quoted = value.length >= 2
          && ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))
        if (quoted) value = value.slice(1, -1)
        pairs.push({ key, value })
      }
      return pairs
    }

    /** Fields this editor understands when one entry arrives as JSON. */
    const ENTRY_FIELDS = [
      'transport', 'command', 'args', 'env', 'cwd', 'url', 'headers', 'enabled',
      'startupTimeoutMs', 'toolCallTimeoutMs', 'closeTimeoutMs',
    ]

    /**
     * Parse one pasted server entry: a bare entry object, an `mcpServers`
     * wrapper holding exactly one server, or a `{ name: entry }` pair.
     * @param text - pasted JSON.
     * @returns the entry, its suggested name, and the keys this page ignores.
     * @throws when the text is not JSON, holds several servers, or has no recognised field.
     */
    function parseEntryPaste(text) {
      const parsed = JSON.parse(String(text === undefined ? '' : text).trim())
      if (!isPlainObject(parsed)) throw new Error('expected a JSON object')
      let name
      let entry = parsed
      if (isPlainObject(parsed.mcpServers)) {
        const names = Object.keys(parsed.mcpServers)
        if (names.length !== 1) throw new Error('paste exactly one server')
        name = names[0]
        entry = parsed.mcpServers[name]
        if (!isPlainObject(entry)) throw new Error('that server is not an object')
      } else if (!ENTRY_FIELDS.some(field => hasOwn(parsed, field))) {
        const names = Object.keys(parsed)
        const only = names.length === 1 ? parsed[names[0]] : undefined
        if (isPlainObject(only) && ENTRY_FIELDS.some(field => hasOwn(only, field))) {
          name = names[0]
          entry = only
        }
      }
      if (!ENTRY_FIELDS.some(field => hasOwn(entry, field))) throw new Error('no recognised fields')
      return {
        name,
        entry,
        ignored: Object.keys(entry).filter(field => !ENTRY_FIELDS.includes(field)),
      }
    }

    /** Whether a value looks like a secret, so its row can be masked on demand. */
    function looksSecret(key) {
      return /(token|secret|password|passwd|key|auth|cookie|credential)/i.test(String(key === undefined ? '' : key))
    }

    /** Format an optional millisecond field for an input. */
    function numberText(value) {
      return typeof value === 'number' && Number.isFinite(value) ? String(value) : ''
    }

    /** Parse an optional positive millisecond field. */
    function positiveNumber(text) {
      if (typeof text !== 'string' || text.trim() === '') return undefined
      const value = Number(text)
      return Number.isFinite(value) && value > 0 ? value : undefined
    }

    /** Build editor state from one configured entry. */
    function draftFromEntry(entry) {
      const source = isPlainObject(entry) ? entry : {}
      // An imported entry often ships only `url`; infer the transport instead of
      // defaulting it to stdio and then failing the required-command check.
      const transport = source.transport === 'streamable-http' || source.transport === 'stdio'
        ? source.transport
        : (typeof source.url === 'string' && source.url.trim() !== '' && !source.command ? 'streamable-http' : 'stdio')
      return {
        transport,
        command: typeof source.command === 'string' ? source.command : '',
        args: Array.isArray(source.args) ? source.args.map(value => String(value)) : [],
        env: toPairs(source.env),
        cwd: typeof source.cwd === 'string' ? source.cwd : '',
        url: typeof source.url === 'string' ? source.url : '',
        headers: toPairs(source.headers),
        enabled: source.enabled !== false,
        startupTimeoutMs: numberText(source.startupTimeoutMs),
        toolCallTimeoutMs: numberText(source.toolCallTimeoutMs),
        closeTimeoutMs: numberText(source.closeTimeoutMs),
      }
    }

    /**
     * Build one complete server entry from editor state, keeping fields this
     * page does not model (for example a tuned `reconnect` policy).
     * @param draft - editor state.
     * @param current - the entry as currently configured, when editing.
     * @returns the entry to write into the `servers` map.
     */
    function entryFromDraft(draft, current) {
      const base = isPlainObject(current) ? { ...current } : {}
      for (const field of [
        'transport', 'command', 'args', 'env', 'cwd', 'url', 'headers', 'enabled',
        'startupTimeoutMs', 'toolCallTimeoutMs', 'closeTimeoutMs',
      ]) delete base[field]
      const entry = { ...base, transport: draft.transport, enabled: draft.enabled !== false }
      if (draft.transport === 'stdio') {
        entry.command = draft.command.trim()
        const args = (Array.isArray(draft.args) ? draft.args : [])
          .map(value => String(value))
          .filter(value => value.trim() !== '')
        if (args.length > 0) entry.args = args
        const env = pairsToObject(draft.env)
        if (Object.keys(env).length > 0) entry.env = env
        if (draft.cwd.trim() !== '') entry.cwd = draft.cwd.trim()
      } else {
        entry.url = draft.url.trim()
        const headers = pairsToObject(draft.headers)
        if (Object.keys(headers).length > 0) entry.headers = headers
      }
      const startup = positiveNumber(draft.startupTimeoutMs)
      if (startup !== undefined) entry.startupTimeoutMs = startup
      const toolCall = positiveNumber(draft.toolCallTimeoutMs)
      if (toolCall !== undefined) entry.toolCallTimeoutMs = toolCall
      const close = positiveNumber(draft.closeTimeoutMs)
      if (close !== undefined) entry.closeTimeoutMs = close
      return entry
    }

    /** Localized validation message for one draft, or undefined when it can be saved. */
    function validateDraft(t, draft, name, servers, creating) {
      if (!/^[A-Za-z0-9_-]{1,32}$/.test(name)) return t('errName')
      if (creating && hasOwn(servers, name)) return t('errDuplicate')
      if (draft.transport === 'stdio' && draft.command.trim() === '') return t('errCommand')
      if (draft.transport === 'streamable-http' && draft.url.trim() === '') return t('errUrl')
      // A non-empty timeout that is not a positive number would silently turn
      // into "inherit the default" on save, so it is a field error instead.
      for (const text of [draft.startupTimeoutMs, draft.toolCallTimeoutMs, draft.closeTimeoutMs]) {
        if (typeof text === 'string' && text.trim() !== '' && positiveNumber(text) === undefined) return t('errTimeout')
      }
      // Blank-name and duplicate rows would be dropped by pairsToObject without
      // telling the user which value never made it into the configuration.
      const pairs = draft.transport === 'stdio' ? draft.env : draft.headers
      const seen = new Set()
      for (const pair of Array.isArray(pairs) ? pairs : []) {
        const key = typeof pair.key === 'string' ? pair.key.trim() : ''
        const value = typeof pair.value === 'string' ? pair.value : ''
        if (key === '') {
          if (value.trim() !== '') return t('errPairKey')
          continue
        }
        if (seen.has(key)) return t('errPairDuplicate', { name: key })
        seen.add(key)
      }
      return undefined
    }

    /**
     * One labelled key/value list editor. Pasting `KEY=VALUE` lines or a JSON
     * object into any name field expands the rows, secret-looking values can be
     * masked, and a credential reference can be inserted into a value.
     * @param {{ t: Function, label: string, pairs: Array, onChange: Function, onRemember?: Function }} input
     */
    function PairEditor(input) {
      const { t, label, pairs, onChange, onRemember } = input
      const list = Array.isArray(pairs) ? pairs : []
      const [revealed, setRevealed] = React.useState({})
      const valueRefs = React.useRef({})

      const replace = (index, patch) => {
        onChange(list.map((pair, position) => (position === index ? { ...pair, ...patch } : pair)))
      }

      const insertCredential = (index) => {
        if (onRemember) onRemember()
        const template = '${credential:}'
        replace(index, { value: template })
        requestAnimationFrame(() => {
          const element = valueRefs.current[index]
          if (!element) return
          element.focus()
          const caret = template.length - 1
          element.setSelectionRange(caret, caret)
        })
      }

      const pasteRows = (index, text) => {
        let parsed
        try {
          parsed = parsePairsPaste(text)
        } catch (_error) {
          return false
        }
        if (parsed.length === 0) return false
        if (onRemember) onRemember()
        const next = list.slice()
        next.splice(index, 1, ...parsed)
        onChange(next)
        return true
      }

      return h('div', { className: 'mc-field' },
        h('div', { className: 'mc-field-head' },
          h('span', { className: 'mc-label' }, label),
          h('p', { className: 'mc-hint' }, t('envPasteHint'))),
        h('div', { className: 'mc-pairs' }, list.map((pair, index) => {
          const secret = looksSecret(pair.key)
          const masked = secret && revealed[index] === true
          return h('div', { className: 'mc-pair', key: String(index) },
            h('input', {
              className: 'mc-input',
              'aria-label': t('keyLabel'),
              value: pair.key,
              placeholder: t('keyLabel'),
              spellCheck: false,
              onChange: event => { replace(index, { key: event.target.value }) },
              onPaste: event => {
                const text = event.clipboardData ? event.clipboardData.getData('text') : ''
                if (!text || (!/\r?\n/.test(text) && !text.trim().startsWith('{'))) return
                if (pasteRows(index, text)) event.preventDefault()
              },
            }),
            h('input', {
              ref: element => { valueRefs.current[index] = element },
              className: 'mc-input',
              type: masked ? 'password' : 'text',
              'aria-label': t('valueLabel'),
              value: pair.value,
              placeholder: t('valueLabel'),
              spellCheck: false,
              onChange: event => { replace(index, { value: event.target.value }) },
            }),
            secret
              ? h('button', {
                type: 'button',
                className: 'mc-button',
                'aria-label': masked ? t('showValue') : t('hideValue'),
                onClick: () => { setRevealed(previous => ({ ...previous, [index]: !masked })) },
              }, masked ? t('showValue') : t('hideValue'))
              : undefined,
            h('button', {
              type: 'button',
              className: 'mc-button',
              'aria-label': t('insertCredential'),
              title: t('insertCredential'),
              onClick: () => { insertCredential(index) },
            }, '${}'),
            h('button', {
              type: 'button',
              className: 'mc-button',
              'aria-label': t('removeRow'),
              onClick: () => { onChange(list.filter((_pair, position) => position !== index)) },
            }, '×'))
        })),
        h('div', null, h('button', {
          type: 'button',
          className: 'mc-button',
          onClick: () => { onChange([...list, { key: '', value: '' }]) },
        }, t('addRow'))))
    }

    /**
     * One labelled argument list: a row per argument, with multi-line paste and
     * a bulk paste surface for JSON arrays and whole command lines.
     * @param {{ t: Function, args: Array, onChange: Function, onRemember?: Function, onBulk: Function }} input
     */
    function ArgsEditor(input) {
      const { t, args, onChange, onRemember, onBulk } = input
      const list = Array.isArray(args) ? args : []
      return h('div', { className: 'mc-field' },
        h('div', { className: 'mc-field-head' },
          h('span', { className: 'mc-label' }, t('args')),
          h('span', { className: 'mc-hint' }, t('argsCount', { count: list.length }))),
        h('div', { className: 'mc-pairs' }, list.map((arg, index) => h('div', { className: 'mc-pair', key: String(index) },
          h('input', {
            className: 'mc-input',
            'aria-label': t('argLabel', { index: index + 1 }),
            value: arg,
            spellCheck: false,
            onChange: event => {
              const next = list.slice()
              next[index] = event.target.value
              onChange(next)
            },
            onPaste: event => {
              const text = event.clipboardData ? event.clipboardData.getData('text') : ''
              if (!text || !/\r?\n/.test(text)) return
              event.preventDefault()
              if (onRemember) onRemember()
              const next = list.slice()
              next.splice(index, 1, ...splitLines(text))
              onChange(next)
            },
          }),
          h('button', {
            type: 'button',
            className: 'mc-button',
            'aria-label': t('removeRow'),
            onClick: () => { onChange(list.filter((_value, position) => position !== index)) },
          }, '×')))),
        h('div', { className: 'mc-field-actions' },
          h('button', {
            type: 'button',
            className: 'mc-button',
            onClick: () => { onChange([...list, '']) },
          }, t('addArg')),
          h('button', {
            type: 'button',
            className: 'mc-button',
            onClick: onBulk,
          }, t('pasteArgs'))))
    }

    /**
     * Inline paste surface shared by the config import, the argument list, and
     * the command splitter.
     * @param {object} input - copy, current text, and apply/cancel handlers.
     */
    function PastePanel(input) {
      const { t, title, hint, placeholder, multiline, value, error, applyLabel, onChange, onApply, onCancel } = input
      return h('div', { className: 'mc-paste' },
        h('p', { className: 'mc-editor-title' }, title),
        h('p', { className: 'mc-hint' }, hint),
        multiline
          ? h('textarea', {
            className: 'mc-textarea',
            'aria-label': title,
            value,
            placeholder,
            spellCheck: false,
            onChange: event => { onChange(event.target.value) },
          })
          : h('input', {
            className: 'mc-input',
            'aria-label': title,
            value,
            placeholder,
            spellCheck: false,
            onChange: event => { onChange(event.target.value) },
          }),
        error ? h('p', { className: 'mc-error', role: 'alert' }, error) : undefined,
        h('div', { className: 'mc-editor-actions' },
          h('button', {
            type: 'button',
            className: 'mc-button',
            'data-emphasis': 'strong',
            onClick: onApply,
          }, applyLabel || t('pasteApply')),
          h('button', {
            type: 'button',
            className: 'mc-button',
            onClick: onCancel,
          }, t('cancel'))))
    }

    /**
     * Create or edit one server entry.
     * @param {object} input - draft, handlers, and flags from the section.
     */
    function ServerEditor(input) {
      const {
        t, mode, name, draft, error, saving, deleteLabel, confirmingDelete, canUndo,
        onNameChange, onChange, onSave, onCancel, onDelete, onConfirmDelete, onCancelDelete,
        onRemember, onUndo, onImport,
      } = input
      const creating = mode === 'new'
      const stdio = draft.transport === 'stdio'
      const busy = saving === true
      const heading = creating ? t('newServer') : t('editServer', { name })
      const [panel, setPanel] = React.useState('none')
      const [panelText, setPanelText] = React.useState('')
      const [panelError, setPanelError] = React.useState('')
      const [notice, setNotice] = React.useState('')

      const openPanel = (kind) => {
        setPanel(kind)
        setPanelText('')
        setPanelError('')
        setNotice('')
      }

      const closePanel = () => {
        setPanel('none')
        setPanelText('')
        setPanelError('')
      }

      const applyImport = () => {
        try {
          const imported = parseEntryPaste(panelText)
          onRemember()
          onImport(draftFromEntry(imported.entry))
          if (imported.name !== undefined && creating) onNameChange(imported.name)
          const fields = ENTRY_FIELDS.filter(field => hasOwn(imported.entry, field))
          setNotice(t('imported', { fields: fields.join(', ') })
            + (imported.ignored.length > 0 ? ' · ' + t('importIgnored', { names: imported.ignored.join(', ') }) : ''))
          closePanel()
        } catch (importError) {
          setPanelError(t('importFailed', { message: messageOf(importError) }))
        }
      }

      const applyArgs = () => {
        try {
          const args = parseArgsPaste(panelText)
          onRemember()
          onChange({ args })
          setNotice(t('noticeArgs', { count: args.length }))
          closePanel()
        } catch (argsError) {
          setPanelError(t('importFailed', { message: messageOf(argsError) }))
        }
      }

      const applyCommand = () => {
        try {
          const tokens = tokenizeCommandLine(panelText)
          if (tokens.length === 0) throw new Error('empty command')
          onRemember()
          onChange({ command: tokens[0], args: tokens.slice(1) })
          setNotice(t('noticeCommand', { command: tokens[0], count: tokens.length - 1 }))
          closePanel()
        } catch (commandError) {
          setPanelError(t('splitFailed', { message: messageOf(commandError) }))
        }
      }

      return h('div', { className: 'mc-editor' },
        h('div', { className: 'mc-editor-head' },
          h('p', { className: 'mc-editor-title' }, heading),
          h('div', { className: 'mc-editor-actions' },
            canUndo
              ? h('button', {
                type: 'button',
                className: 'mc-button',
                disabled: busy,
                onClick: onUndo,
              }, t('undo'))
              : undefined,
            h('button', {
              type: 'button',
              className: 'mc-button',
              disabled: busy,
              onClick: () => { openPanel('import') },
            }, t('importConfig')))),
        notice ? h('p', { className: 'mc-hint', role: 'status' }, notice) : undefined,
        panel === 'import'
          ? h(PastePanel, {
            t,
            title: t('importConfig'),
            hint: t('importHint'),
            placeholder: '{"command":"npx","args":["-y","pkg"],"env":{"TOKEN":"${credential:TOKEN}"}}',
            multiline: true,
            value: panelText,
            error: panelError,
            onChange: setPanelText,
            onApply: applyImport,
            onCancel: closePanel,
            applyLabel: t('importApply'),
          })
          : undefined,
        panel === 'args'
          ? h(PastePanel, {
            t,
            title: t('pasteArgs'),
            hint: t('argsPasteHint'),
            placeholder: '["-y","@scope/server"]',
            multiline: true,
            value: panelText,
            error: panelError,
            onChange: setPanelText,
            onApply: applyArgs,
            onCancel: closePanel,
            applyLabel: t('pasteApply'),
          })
          : undefined,
        panel === 'command'
          ? h(PastePanel, {
            t,
            title: t('splitCommand'),
            hint: t('splitHint'),
            placeholder: 'npx -y @scope/server --flag "a b"',
            multiline: false,
            value: panelText,
            error: panelError,
            onChange: setPanelText,
            onApply: applyCommand,
            onCancel: closePanel,
            applyLabel: t('splitApply'),
          })
          : undefined,
        h('label', { className: 'mc-field' },
          h('span', { className: 'mc-label' }, t('name')),
          h('input', {
            className: 'mc-input',
            value: name,
            readOnly: !creating,
            disabled: busy,
            spellCheck: false,
            autoComplete: 'off',
            onChange: event => { onNameChange(event.target.value) },
          }),
          h('p', { className: 'mc-hint' }, t('nameHint'))),
        h('label', { className: 'mc-field' },
          h('span', { className: 'mc-label' }, t('transport')),
          h('select', {
            className: 'mc-select',
            value: draft.transport,
            disabled: busy,
            onChange: event => { onChange({ transport: event.target.value }) },
          },
          h('option', { value: 'stdio' }, t('transportStdio')),
          h('option', { value: 'streamable-http' }, t('transportHttp')))),
        stdio
          ? h('div', { className: 'mc-field' },
            h('div', { className: 'mc-field' },
              h('div', { className: 'mc-field-head' },
                h('span', { className: 'mc-label' }, t('command')),
                h('button', {
                  type: 'button',
                  className: 'mc-button',
                  disabled: busy,
                  onClick: () => { openPanel('command') },
                }, t('splitCommand'))),
              h('input', {
                className: 'mc-input',
                'aria-label': t('command'),
                value: draft.command,
                disabled: busy,
                spellCheck: false,
                autoComplete: 'off',
                onChange: event => { onChange({ command: event.target.value }) },
              })),
            h(ArgsEditor, {
              t,
              args: draft.args,
              onRemember,
              onChange: values => { onChange({ args: values }) },
              onBulk: () => { openPanel('args') },
            }),
            h(PairEditor, {
              t,
              label: t('env'),
              pairs: draft.env,
              onRemember,
              onChange: pairs => { onChange({ env: pairs }) },
            }),
            h('label', { className: 'mc-field' },
              h('span', { className: 'mc-label' }, t('cwd') + ' · ' + t('optional')),
              h('input', {
                className: 'mc-input',
                value: draft.cwd,
                disabled: busy,
                spellCheck: false,
                onChange: event => { onChange({ cwd: event.target.value }) },
              })))
          : h('div', { className: 'mc-field' },
            h('label', { className: 'mc-field' },
              h('span', { className: 'mc-label' }, t('url')),
              h('input', {
                className: 'mc-input',
                value: draft.url,
                disabled: busy,
                spellCheck: false,
                autoComplete: 'off',
                placeholder: 'https://',
                onChange: event => { onChange({ url: event.target.value }) },
              })),
            h(PairEditor, {
              t,
              label: t('headers'),
              pairs: draft.headers,
              onRemember,
              onChange: pairs => { onChange({ headers: pairs }) },
            })),
        h('p', { className: 'mc-hint' }, t('secretHint')),
        h('label', { className: 'mc-check' },
          h('input', {
            type: 'checkbox',
            checked: draft.enabled !== false,
            disabled: busy,
            onChange: event => { onChange({ enabled: event.target.checked }) },
          }),
          h('span', null, t('enabled'))),
        h('p', { className: 'mc-hint' }, t('enabledHint')),
        h('p', { className: 'mc-label' }, t('advanced')),
        h('div', { className: 'mc-fieldrow' },
          h('label', { className: 'mc-field' },
            h('span', { className: 'mc-label' }, t('startupTimeout')),
            h('input', {
              className: 'mc-input',
              type: 'number',
              min: '1',
              value: draft.startupTimeoutMs,
              disabled: busy,
              onChange: event => { onChange({ startupTimeoutMs: event.target.value }) },
            })),
          h('label', { className: 'mc-field' },
            h('span', { className: 'mc-label' }, t('toolCallTimeout')),
            h('input', {
              className: 'mc-input',
              type: 'number',
              min: '1',
              value: draft.toolCallTimeoutMs,
              disabled: busy,
              onChange: event => { onChange({ toolCallTimeoutMs: event.target.value }) },
            })),
          h('label', { className: 'mc-field' },
            h('span', { className: 'mc-label' }, t('closeTimeout')),
            h('input', {
              className: 'mc-input',
              type: 'number',
              min: '1',
              value: draft.closeTimeoutMs,
              disabled: busy,
              onChange: event => { onChange({ closeTimeoutMs: event.target.value }) },
            }))),
        h('p', { className: 'mc-hint' }, t('advancedHint')),
        error ? h('p', { className: 'mc-error', role: 'alert' }, error) : undefined,
        h('div', { className: 'mc-editor-actions' },
          h('button', {
            type: 'button',
            className: 'mc-button',
            'data-emphasis': 'strong',
            disabled: busy,
            onClick: onSave,
          }, busy ? t('saving') : t('save')),
          h('button', {
            type: 'button',
            className: 'mc-button',
            disabled: busy,
            onClick: onCancel,
          }, t('cancel')),
          h('span', { className: 'mc-spacer' }),
          deleteLabel === undefined || confirmingDelete
            ? undefined
            : h('button', {
              type: 'button',
              className: 'mc-button',
              'data-tone': 'danger',
              disabled: busy,
              onClick: onDelete,
            }, deleteLabel)),
        // The confirmation owns its own row with its own copy: two controls
        // labelled "Cancel" side by side read as the same action.
        confirmingDelete
          ? h('div', { className: 'mc-editor-actions mc-confirm' },
            h('span', { className: 'mc-hint' }, t('confirmDeleteHint')),
            h('button', {
              type: 'button',
              className: 'mc-button',
              'data-tone': 'danger',
              disabled: busy,
              onClick: onConfirmDelete,
            }, t('confirmDelete')),
            h('button', {
              type: 'button',
              className: 'mc-button',
              disabled: busy,
              onClick: onCancelDelete,
            }, t('cancelDelete')))
          : undefined)
    }

    /**
     * One server row, with its editor when that row is being edited.
     * @param {object} input - row data, provenance badge, actions, and editor.
     */
    function ServerRow(input) {
      const { t, row, operation, badge, hint, canEdit, editor, onProbe, onRestart, onEdit } = input
      const status = row && row.status
      const tone = toneOf(status)
      const detail = detailOf(t, status)
      const probing = operation && operation.probing === true
      const restarting = operation && operation.restarting === true
      const busy = probing || restarting
      const probeResult = operation && operation.probe
      const toolNames = probeResult && probeResult.ok && Array.isArray(probeResult.toolNames) ? probeResult.toolNames : []

      const probeLines = []
      if (probeResult && probeResult.ok === true) {
        if (probeResult.serverInfo) {
          probeLines.push(t('probeOkServer', { name: probeResult.serverInfo.name, version: probeResult.serverInfo.version }))
        }
        probeLines.push(t('probeOk', { count: toolNames.length, ms: Math.round(Number(probeResult.durationMs) || 0) }))
        if (probeResult.truncated) probeLines.push(t('probeTruncated'))
        if (!probeResult.closeConfirmed) probeLines.push(t('probeUnclosed'))
        if (probeResult.cleanupError) probeLines.push(t('probeCleanupError', { message: probeResult.cleanupError }))
      }
      const probeFailure = probeResult && probeResult.ok === false
        ? t(probeResult.stage === 'list' ? 'probeFailedList' : 'probeFailedConnect', { message: probeResult.message || '' })
        : undefined

      return h('li', { className: 'mc-row' },
        h('span', { className: 'mc-dot', 'data-tone': tone, 'aria-hidden': 'true' }),
        h('div', { className: 'mc-body' },
          h('div', { className: 'mc-rowheading' },
            h('code', { className: 'mc-name' }, row.name),
            h('span', { className: 'mc-badge' }, badge),
            h('span', { className: 'mc-status', 'data-tone': tone }, statusLabel(t, status))),
          detail ? h('p', { className: 'mc-detail' }, detail) : undefined,
          hint ? h('p', { className: 'mc-hint' }, hint) : undefined,
          operation && operation.restarted
            ? h('p', { className: 'mc-detail', role: 'status' }, t('restarted'))
            : undefined,
          probeLines.length > 0
            ? h('div', { className: 'mc-probe', 'data-tone': 'ok' },
              h('p', { className: 'mc-probe-line', role: 'status' }, probeLines.join(' · ')),
              toolNames.length > 0
                ? h('p', { className: 'mc-tools' },
                  h('span', { className: 'mc-tools-label' }, t('toolsLabel') + ': '),
                  toolNames.slice(0, 24).join(', ') + (toolNames.length > 24 ? ' …' : ''))
                : undefined)
            : undefined,
          probeFailure
            ? h('div', { className: 'mc-probe', 'data-tone': 'error' },
              h('p', { className: 'mc-probe-line', role: 'status' }, probeFailure),
              probeResult && !probeResult.closeConfirmed ? h('p', { className: 'mc-tools' }, t('probeUnclosed')) : undefined,
              probeResult && probeResult.cleanupError ? h('p', { className: 'mc-tools' }, t('probeCleanupError', { message: probeResult.cleanupError })) : undefined)
            : undefined,
          operation && operation.error ? h('p', { className: 'mc-error' }, operation.error) : undefined,
          editor),
        editor !== undefined
          ? undefined
          : h('div', { className: 'mc-actions' },
            canEdit
              ? h('button', {
                type: 'button',
                className: 'mc-button',
                disabled: busy,
                'aria-label': t('edit') + ' ' + row.name,
                onClick: () => { onEdit(row.name) },
              }, t('edit'))
              : undefined,
            h('button', {
              type: 'button',
              className: 'mc-button',
              disabled: busy,
              'aria-label': t('probe') + ' ' + row.name,
              onClick: () => { onProbe(row.name) },
            }, probing ? t('probing') : t('probe')),
            h('button', {
              type: 'button',
              className: 'mc-button',
              disabled: busy,
              'aria-label': t('restart') + ' ' + row.name,
              onClick: () => { onRestart(row.name) },
            }, restarting ? t('restarting') : t('restart'))))
    }

    /**
     * The MCP settings page: live status plus configuration editing.
     * @param {object} props - injected faces from {@link apply}.
     */
    function McpConsoleSection(props) {
      const {
        t, watch, restart, probe, subscribe,
        subscribeSettings, getSettingsSnapshot, ensureSettings, mutateSettings, acceptSettingsView, refreshNamespace,
      } = props
      const headingId = React.useId()
      const settings = React.useSyncExternalStore(subscribeSettings, getSettingsSnapshot)
      const [rows, setRows] = React.useState([])
      const [phase, setPhase] = React.useState('loading')
      const [failure, setFailure] = React.useState('')
      const [generation, setGeneration] = React.useState(0)
      const [operations, setOperations] = React.useState({})
      const [editing, setEditing] = React.useState(null)
      const [, repaint] = React.useReducer((value) => value + 1, 0)
      const pending = React.useRef(new Set())

      // Language switches must repaint the copy; the bound `t` reads the active
      // locale at call time, so a re-render is all that is needed.
      React.useEffect(() => {
        if (typeof subscribe !== 'function') return undefined
        return subscribe(() => { repaint() })
      }, [subscribe, repaint])

      // First read of the settings document; later freshness arrives through the
      // mirror's own invalidation subscriptions.
      React.useEffect(() => { void ensureSettings() }, [ensureSettings])

      React.useEffect(() => {
        const controller = new AbortController()
        let live = true
        setPhase('loading')
        setFailure('')
        const consume = async () => {
          try {
            const stream = watch(controller.signal)
            if (stream && typeof stream[Symbol.asyncIterator] === 'function') {
              for await (const frame of stream) {
                if (!live) return
                setRows(Array.isArray(frame) ? frame : [])
                setPhase('ready')
              }
              // The Host ended the stream while this page still shows the
              // last snapshot: stop claiming the list keeps itself live.
              if (live) {
                setFailure(t('streamEnded'))
                setPhase('error')
              }
            } else {
              const value = await stream
              if (!live) return
              setRows(Array.isArray(value) ? value : [])
              setPhase('ready')
            }
          } catch (error) {
            if (!live || controller.signal.aborted) return
            setFailure(messageOf(error))
            setPhase('error')
          }
        }
        void consume()
        return () => {
          live = false
          controller.abort()
        }
      }, [watch, generation])

      React.useEffect(() => () => {
        for (const controller of pending.current) controller.abort()
        pending.current.clear()
      }, [])

      const patchOperation = (name, change) => {
        setOperations((previous) => ({ ...previous, [name]: { ...(previous[name] || {}), ...change } }))
      }

      const runProbe = (name) => {
        patchOperation(name, { probing: true, error: '', probe: undefined, restarted: false })
        const controller = new AbortController()
        pending.current.add(controller)
        Promise.resolve()
          .then(() => probe(name, controller.signal))
          .then((result) => unwrap(result))
          .then((value) => { patchOperation(name, { probing: false, probe: value }) })
          .catch((error) => { patchOperation(name, { probing: false, error: messageOf(error) }) })
          .finally(() => { pending.current.delete(controller) })
      }

      const runRestart = (name) => {
        // The probe panel describes the instance that lived before this click.
        patchOperation(name, { restarting: true, error: '', probe: undefined, restarted: false })
        Promise.resolve()
          .then(() => restart(name))
          .then((result) => unwrap(result))
          .then(() => { patchOperation(name, { restarting: false, restarted: true }) })
          .catch((error) => { patchOperation(name, { restarting: false, error: messageOf(error) }) })
      }

      const view = settings && settings.view
      const namespace = pickNamespace(view)
      const writable = Boolean(view && view.writable)
      const servers = namespace && isPlainObject(namespace.value) && isPlainObject(namespace.value.servers)
        ? namespace.value.servers
        : {}
      const userServers = namespace && isPlainObject(namespace.user) && isPlainObject(namespace.user.servers)
        ? namespace.user.servers
        : {}
      const baseServers = namespace && isPlainObject(namespace.base) && isPlainObject(namespace.base.servers)
        ? namespace.base.servers
        : {}

      const canWrite = writable && namespace !== undefined

      /** One settings mutation, with the revision this page last read. */
      const writeOps = async (ops) => {
        const result = await mutateSettings(namespace.ns, ops, namespace.revision)
        const value = unwrap(result)
        acceptSettingsView(value)
        return value
      }

      const rememberDraft = () => {
        setEditing(previous => (previous === null ? previous : { ...previous, undo: { name: previous.name, draft: previous.draft } }))
      }

      const undoDraft = () => {
        setEditing(previous => (previous === null || previous.undo === undefined
          ? previous
          : { ...previous, name: previous.undo.name, draft: previous.undo.draft, undo: undefined, error: '' }))
      }

      const startCreate = () => {
        setEditing({
          mode: 'new',
          name: '',
          draft: draftFromEntry(undefined),
          error: '',
          saving: false,
          confirmingDelete: false,
          undo: undefined,
        })
      }

      const startEdit = (name) => {
        setEditing({
          mode: 'edit',
          name,
          draft: draftFromEntry(servers[name]),
          error: '',
          saving: false,
          confirmingDelete: false,
          undo: undefined,
        })
      }

      const replaceDraft = (next) => {
        setEditing(previous => (previous === null ? previous : { ...previous, draft: next, error: '' }))
      }

      const changeDraft = (change) => {
        setEditing(previous => (previous === null ? previous : { ...previous, draft: { ...previous.draft, ...change }, error: '' }))
      }

      const changeName = (name) => {
        setEditing(previous => (previous === null ? previous : { ...previous, name, error: '' }))
      }

      const closeEditor = () => { setEditing(null) }

      const saveEditor = () => {
        if (editing === null || namespace === undefined) return
        const name = editing.name.trim()
        const problem = validateDraft(t, editing.draft, name, servers, editing.mode === 'new')
        if (problem !== undefined) {
          setEditing(previous => (previous === null ? previous : { ...previous, error: problem }))
          return
        }
        setEditing(previous => (previous === null ? previous : { ...previous, saving: true, error: '' }))
        const entry = entryFromDraft(editing.draft, editing.mode === 'new' ? undefined : servers[name])
        void writeOps([{ op: 'set', path: ['servers', name], value: entry }])
          .then(() => { setEditing(null) })
          .catch((error) => {
            if (error && error.code === 'settings/conflict') {
              // A stale revision is not a bad form: keep the draft, drop in the
              // fresh document, and let the user decide to save again.
              setEditing(previous => (previous === null ? previous : { ...previous, saving: false, error: t('conflict') }))
              void refreshNamespace(namespace.ns)
              return
            }
            setEditing(previous => (previous === null ? previous : { ...previous, saving: false, error: t('saveFailed', { message: messageOf(error) }) }))
          })
      }

      const deleteEntry = () => {
        if (editing === null || namespace === undefined) return
        const name = editing.name.trim()
        setEditing(previous => (previous === null ? previous : { ...previous, saving: true, error: '', confirmingDelete: false }))
        void writeOps([{ op: 'unset', path: ['servers', name] }])
          .then(() => { setEditing(null) })
          .catch((error) => {
            if (error && error.code === 'settings/conflict') {
              setEditing(previous => (previous === null ? previous : { ...previous, saving: false, error: t('conflict') }))
              void refreshNamespace(namespace.ns)
              return
            }
            setEditing(previous => (previous === null ? previous : { ...previous, saving: false, error: t('deleteFailed', { message: messageOf(error) }) }))
          })
      }

      const ordered = React.useMemo(() => {
        const list = Array.isArray(rows) ? rows.slice() : []
        list.sort((left, right) => {
          const leftConfigured = left && left.configured === true
          const rightConfigured = right && right.configured === true
          if (leftConfigured !== rightConfigured) return leftConfigured ? -1 : 1
          return String(left && left.name).localeCompare(String(right && right.name))
        })
        return list
      }, [rows])

      const connected = ordered.filter((row) => row && row.status && row.status.state === 'connected').length

      // Provenance needs the settings document; before it arrives, a configured
      // row is simply "configured" rather than mislabelled as plugin-owned.
      const badgeOf = (row) => {
        if (!row || row.configured !== true) return t('sourceCleanup')
        if (namespace === undefined) return t('sourceConfigured')
        return hasOwn(servers, row.name) ? t('sourceConfigured') : t('sourceRegistered')
      }

      const buildEditor = (deleteLabel) => {
        if (editing === null) return undefined
        return h(ServerEditor, {
          t,
          mode: editing.mode,
          name: editing.name,
          draft: editing.draft,
          error: editing.error,
          saving: editing.saving,
          deleteLabel,
          confirmingDelete: editing.confirmingDelete === true,
          canUndo: editing.undo !== undefined,
          onRemember: rememberDraft,
          onUndo: undoDraft,
          onImport: replaceDraft,
          onNameChange: changeName,
          onChange: changeDraft,
          onSave: saveEditor,
          onCancel: closeEditor,
          onDelete: () => { setEditing(previous => (previous === null ? previous : { ...previous, confirmingDelete: true })) },
          onConfirmDelete: deleteEntry,
          onCancelDelete: () => { setEditing(previous => (previous === null ? previous : { ...previous, confirmingDelete: false })) },
        })
      }

      // A row's editor exists only while that row is the one being edited; the
      // create form is a separate block, so it never lands inside a row.
      const editorForRow = (name) => {
        if (editing === null || editing.mode !== 'edit' || editing.name !== name) return undefined
        const deleteLabel = hasOwn(userServers, name)
          ? (hasOwn(baseServers, name) ? t('restoreInherited') : t('delete'))
          : undefined
        return buildEditor(deleteLabel)
      }

      const empty = h('div', { className: 'mc-empty' },
        h('p', { className: 'mc-empty-title' }, t('emptyTitle')),
        h('p', { className: 'mc-empty-body' }, t('emptyBody')))

      const newEditor = editing !== null && editing.mode === 'new' ? buildEditor(undefined) : undefined

      return h('section', { className: 'mc-section', 'aria-labelledby': headingId },
        h('style', null, CSS),
        h('header', { className: 'mc-header' },
          h('h2', { className: 'mc-title', id: headingId }, t('title')),
          h('p', { className: 'mc-intro' }, t('intro'))),
        h('div', { className: 'mc-toolbar' },
          h('span', { className: 'mc-summary', role: 'status' },
            phase === 'ready' || ordered.length > 0
              ? t('summary', { total: ordered.length, connected })
              : ''),
          canWrite && editing === null
            ? h('button', {
              type: 'button',
              className: 'mc-button',
              'data-emphasis': 'strong',
              onClick: startCreate,
            }, t('addServer'))
            : undefined),
        settings && settings.view !== undefined && !canWrite
          ? h('p', { className: 'mc-hint' }, view && view.writable === false ? t('readOnly') : t('settingsUnavailable'))
          : undefined,
        phase === 'loading' ? h('p', { className: 'mc-empty-body' }, t('loading')) : undefined,
        phase === 'error' ? h('p', { className: 'mc-error' }, t('loadError', { message: failure })) : undefined,
        phase === 'error'
          ? h('div', null, h('button', {
            type: 'button',
            className: 'mc-button',
            onClick: () => { setGeneration((value) => value + 1) },
          }, t('retry')))
          : undefined,
        newEditor,
        phase === 'ready' && ordered.length === 0 && newEditor === undefined ? empty : undefined,
        ordered.length > 0
          ? h('ul', { className: 'mc-list' }, ordered.map((row, index) => {
            const name = row && row.name
            const registered = namespace !== undefined && !hasOwn(servers, name)
            const editor = name === undefined ? undefined : editorForRow(name)
            return h(ServerRow, {
              key: name || String(index),
              t,
              row,
              operation: operations[name],
              badge: badgeOf(row),
              hint: registered && row.configured === true ? t('registeredHint') : undefined,
              canEdit: canWrite && row.configured === true && !registered && editing === null,
              editor,
              onProbe: runProbe,
              onRestart: runRestart,
              onEdit: startEdit,
            })
          }))
          : undefined)
    }

    return {
      inject: ['slots', 'locale', 'remote', 'remote.mcpManager', 'remote.settings', 'configForms'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { en, zh }), 'mcp-console: dictionaries')

        const t = ctx.locale.bind(NS)
        const remote = () => ctx.remote.mcpManager
        const describe = ctx.configForms.describe()

        // Stable function references: the settings renderer re-creates the
        // inject face on every render, so an unstable function here would
        // restart the live subscription on each paint.
        const watch = (signal) => remote().watch(signal)
        const restart = (name) => remote().restart(name)
        const probe = (name, signal) => remote().probe(name, signal)
        const subscribe = (listener) => ctx.locale.subscribe(listener)
        // The mirror's methods read `this`, so they ride bound wrappers: the
        // section hands them straight to useSyncExternalStore.
        const subscribeSettings = (listener) => describe.subscribe(listener)
        const getSettingsSnapshot = () => describe.getSnapshot()
        const ensureSettings = () => describe.ensure()
        const mutateSettings = (ns, ops, revision) => ctx.remote.settings.mutate(ns, ops, revision)
        const acceptSettingsView = (view) => describe.acceptView(view)
        // The mirror only reads from `idle`, so a stale revision after a
        // conflict is refreshed by asking the Host directly and folding the
        // answer in; a failed refresh keeps the last good view.
        const refreshNamespace = async (ns) => {
          try {
            const view = unwrap(await ctx.remote.settings.describe())
            const row = Array.isArray(view && view.namespaces)
              ? view.namespaces.find(entry => entry && entry.ns === ns)
              : undefined
            if (row !== undefined) describe.acceptView(row)
          } catch (_error) {
            // Keeping the held document is better than blanking the page.
          }
        }
        const injected = () => ({
          t, watch, restart, probe, subscribe,
          subscribeSettings, getSettingsSnapshot, ensureSettings, mutateSettings, acceptSettingsView, refreshNamespace,
        })

        ctx.slots.inject('settings.section', () => ctx.slots.register({
          name: 'settings.section',
          id: 'mcp',
          order: 18,
          label: () => t('nav'),
          locale: NS,
          inject: injected,
        }, McpConsoleSection))
      },
    }
  },
})
