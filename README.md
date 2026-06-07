# Online Calendar

一个可本地运行、可部署到 Vercel 的在线日历应用。支持多用户注册/登录、按天标记活动、查看当日全部记录、管理活动，以及过去一年的统计图表。

## 亮点

- **多用户支持**：邮箱/密码注册登录，每个用户数据完全隔离
- **忘记密码**：通过 Supabase 内置邮件发送重置链接（免费方案）
- 三个月月历视图，默认显示当前月、前后各一个月
- 日期点选后，按活动快速新增或删除标记
- 同一天可按不同活动分别记录
- 新用户注册后自动创建默认活动（运动、学习、阅读、旅行），也可自定义
- 独立活动管理页，支持新增、编辑、删除
- 日期搜索页，可快速查看当天全部标记
- 统计页默认展示最近 30 天次数和过去 12 个月月度图表
- 移动端适配，日期弹层在手机上以底部抽屉方式展示

## 页面结构

- `/login`：登录
- `/register`：注册
- `/forgot-password`：忘记密码
- `/reset-password`：重置密码（通过邮件链接访问）
- `/calendar`：月历主界面
- `/activities`：活动管理
- `/search`：日期搜索
- `/stats`：统计分析

## 快速开始

### 前提条件

需要一个 Supabase 项目（免费即可）。

1. 在 [supabase.com](https://supabase.com) 创建项目
2. 在 Supabase 控制台执行 `supabase/migrations/20260607_multi_user.sql` 创建数据表
3. 在 Supabase 控制台 → Authentication → URL Configuration 中：
   - 设置 Site URL 为 `http://localhost:3000`
   - 添加 Redirect URLs：`http://localhost:3000/auth/callback`
4. 复制 `.env.example` 为 `.env.local`，填入 Supabase 的 URL 和 anon key

```bash
npm install
npm run dev
```

打开 `http://localhost:3000`。

### 本地验证

```bash
npm test
npm run build
```

## 部署到 Vercel

1. 将仓库推送到 GitHub。
2. 在 Vercel 中导入该 GitHub 仓库。
3. 在 Vercel 项目里配置环境变量：

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

4. 在 Supabase 控制台 → Authentication → URL Configuration 中添加 Vercel 的生产域名。
5. 确认构建命令为 `npm run build`，安装命令为 `npm install`。
6. 点击部署。之后每次 push 都会自动重新部署。

## 密码重置邮件

使用 Supabase 内置免费邮件服务：
- 免费额度限制约 4 封/小时，适合开发和小规模使用
- 生产环境建议在 Supabase 控制台配置自定义 SMTP（如 Resend 免费版每天 100 封）

## REST API

所有 API 均需认证（Supabase Auth Cookie），RLS 自动限定为当前用户数据。

- `GET /api/activities`
- `POST /api/activities`
- `PUT /api/activities`
- `DELETE /api/activities?id=...`
- `GET /api/entries?month=YYYY-MM`
- `POST /api/entries`
- `GET /api/entries/date/YYYY-MM-DD`
- `PUT /api/entries/:id`
- `DELETE /api/entries/:id`
- `GET /api/stats?activityId=<uuid>`

## 实现说明

- 使用 Supabase Auth 处理用户注册、登录、密码重置。
- 数据库表通过 RLS（行级安全）实现用户间数据隔离。
- `@supabase/ssr` 处理 Next.js 的服务端/客户端 Cookie 认证。
- 中间件自动将未登录用户重定向至登录页。
- 如果未配置 Supabase 环境变量，开发环境会退回到内存仓库（单用户，无认证）。
- 迁移 SQL 在 [supabase/migrations/20260607_multi_user.sql](supabase/migrations/20260607_multi_user.sql)。

## 技术栈

- Next.js 15
- TypeScript
- Supabase (Auth + PostgreSQL + RLS)
- @supabase/ssr
- dayjs
- Vitest
- Zod
