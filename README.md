# Online Calendar

一个可本地运行、可部署到 Vercel 的在线日历 MVP。支持按天标记活动、查看当日全部记录、管理活动，以及过去一年的统计图表。

## 亮点

- 三个月月历视图，默认显示当前月、前后各一个月
- 日期点选后，按活动快速新增或删除标记
- 同一天可按不同活动分别记录
- 独立活动管理页，支持新增、编辑、删除
- 日期搜索页，可快速查看当天全部标记
- 统计页默认展示最近 30 天次数和过去 12 个月月度图表
- 移动端适配，日期弹层在手机上以底部抽屉方式展示

## 页面结构

- `/calendar`：月历主界面
- `/activities`：活动管理
- `/search`：日期搜索
- `/stats`：统计分析

## 快速开始

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
3. 如需连接 Supabase，在 Vercel 项目里配置环境变量：

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

4. 确认构建命令为 `npm run build`，安装命令为 `npm install`。
5. 点击部署。之后每次 push 都会自动重新部署。

## REST API

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

## 当前实现说明

- 配置 Supabase 环境变量后，数据会持久化到数据库。
- 如果未配置 Supabase 环境变量，开发环境会退回到内存仓库，重启后数据会清空。
- Supabase 迁移 SQL 在 [supabase/migrations/20260606_init_calendar.sql](supabase/migrations/20260606_init_calendar.sql)。
- 后续可继续把仓库层替换为 Supabase 持久化实现。

## 技术栈

- Next.js 15
- TypeScript
- dayjs
- Vitest
- Zod
