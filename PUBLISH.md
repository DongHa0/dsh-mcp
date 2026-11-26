# 发布到 GitHub 与 npm

这份说明写给维护者，不随 npm 包发布（`package.json` 的 `files` 不含它）。

## 先理解：安装方式决定「更新」怎么走

DeepSeek Harness 的插件管理器按安装 spec 区分更新能力：

| 安装方式 | 同事填什么 | 更新怎么做 |
|---|---|---|
| 本地目录 | 绝对路径 | 覆盖目录 + 重启 DSH |
| `.tgz` 文件 | tgz 绝对路径 | 移除后重新添加 |
| GitHub（分支/标签） | `github:OWNER/REPO` | 移除后重新添加（管理器明确把这类 install spec 标为不可更新） |
| GitHub（固定提交） | `github:OWNER/REPO#<40 位提交号>` | 需要用 `updateBundle` 指到新提交，插件页没有版本列表 |
| **npm 注册表** | `@scope/mcp-console` | **插件页可见版本列表并一键更新** |

所以「让大家随时更新」只有 npm（或内网 registry）这条能真正做到一键；GitHub 直装能用，
但更新等于「先移除再添加」。GitHub 在这里最适合当**源码仓库 + 发布流水线**。

## 推荐流程：GitHub 仓库 + npm 发布

0. **仓库**：<https://github.com/DongHa0/dsh-mcp>（本目录就是仓库根，`main` 分支）。
   同事直接安装本仓库：`github:DongHa0/dsh-mcp`；或安装发布的 npm 包。
1. **建仓库**：把本目录（`mcp-console`）的内容作为仓库根目录推上去。仓库根必须是插件包
   （`package.json` + `cordis.patch.yml` + `client.js`），不要放成子目录，否则安装串要带
   `#path:/…`。
2. **改包名**（只有发布到 npm 需要）：
   - `"name": "@local/mcp-console"` → 你们自己的 scope，例如 `"@nmg/mcp-console"`；
   - 删掉 `"private": true`；
   - 加 `"publishConfig": { "access": "public" }`；
   - 建议补 `"license"` 与 `"repository"`。
   - 注意：改名后本机已装的那份仍登记为旧名字，需要先移除旧的、再按新名字装一次。
3. **本地自检**：`npm pack` 看文件列表是否包含 `client.js`、`index.js`、`cordis.patch.yml`、
   `locale/*.json`、`icon.svg`。
4. **发布**（二选一）：
   - 手动：`npm login` → `npm publish --access public`；
   - 自动：仓库 Secrets 里加 `NPM_TOKEN`，然后 `npm version patch && git push --follow-tags`，
     `.github/workflows/publish.yml` 会校验 tag 与 `package.json` 版本一致后发布。
5. **同事安装**：设置 → 插件 → 添加插件 → 填 `@nmg/mcp-console`（或带版本 `@1.0.1`）。
6. **同事更新**：插件页出现新版本后点更新即可。

## 只想要 GitHub、不发布 npm

- 同事安装串：`github:OWNER/REPO`（也可写完整 `https://github.com/OWNER/REPO`）。
- 更新：把新提交推到默认分支后，让同事在插件页移除再添加；或者你给固定提交号
  `github:OWNER/REPO#<40 位提交号>`，改用脚本调用 `updateBundle` 指到新提交。
- GitHub 仓库必须公开（或同事本机 Git 已配置好凭据）；安装前管理器会用 `git ls-remote`
  探测可达性，5 秒超时会中断安装。
- 也可以用 GitHub Releases 挂 `.tgz`，同事填那个 https 地址安装，更新同样要换新地址。

## 内网 registry（不想用公网 npm 时）

用 Verdaccio / Nexus 之类的私有 registry 发布同一个包，同事的 DSH 配置该 registry 后
安装与更新体验与 npm 一致。插件管理器支持自定义 registry 与备选 registry
（`fallbackRegistries`），私有源不会回落到公共源。

## 版本与兼容

- 每次发布前 `npm version patch|minor`，tag 与 `package.json` 版本一致。
- 包内没有 `engines.dsh` 限制；本版本依据 DSH 0.2.x 的接口（`settings.section`、
  `ctx.remote.mcpManager`、`ctx.remote.settings`、`configForms`）编写，宿主大版本升级后需要复核。
- 包里没有任何安装脚本与依赖，同事安装时不会触发构建脚本审批。
