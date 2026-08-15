# 传奇 Web — 单机版（浏览器即开即玩）

基于 **Phaser 3 + TypeScript + Vite** 的传奇(Mir2) 风格单机 MMORPG。无需服务器、无需数据库，打开浏览器即可游玩，存档保存在本地 `localStorage`。

## 玩法说明

- **登录**：输入任意玩家名进入；账号与角色保存在浏览器本地。
- **角色**：创建战士 / 法师 / 道士，三职业属性侧重与初始装备不同。
- **操作键位**：
  - 鼠标点击地面：移动
  - 点击怪物：普通攻击；点击 NPC：交互
  - 点击掉落物 / `空格`：拾取
  - `1` / `2`（或 `Q` / `W`）：施放职业技能
  - `B`：背包　`C`：属性　`J`：任务　`Enter`：聊天　`R`：复活　`Esc`：退出
- **职业与技能**（随等级自动学会）：
  - 战士：攻杀剑术（高伤单体）、刺杀剑术（直线穿透）
  - 法师：火球术（远程弹道 + 范围爆炸）、雷电术（单体高伤）
  - 道士：治愈术（回血）、施毒术（持续掉血）
- **任务**：村长发布 3 个任务（杀 5 只鸡 / 杀 3 只骷髅 / 杀 1 只僵尸），完成自动领奖。
- **成长**：打怪获得经验与掉落，升级回满并送属性点（`C` 分配）；杂货店老板出售药水装备、回收物品。
- **地图**：新手村 ↔ 荒野（右侧出口），右上角小地图显示方位与 NPC / 怪物 / 玩家位置。

## 技术栈

| 层 | 技术 |
|---|---|
| 客户端 | Phaser 3.80 + TypeScript + Vite |
| 游戏引擎 | 纯本地模拟（`client/src/game/engine/`） |
| 数据 | 怪物 / 物品 / 地图 / 技能定义于 `shared/src/data/` |
| 存档 | localStorage |

> 说明：本项目由「Colyseus 多人服务器」改造为**纯前端单机版**；`server/` 仍保留并参与构建（数据文件已补齐），但单机玩法不依赖它。

## 本地运行

```bash
npm install
npm run dev          # 打开 http://localhost:5173
```

仅构建：

```bash
npm run build        # 产物在 client/dist/
npm run typecheck
```

预览产物：

```bash
npm -w client run preview
```

## 部署（GitHub Pages）

将代码 push 到 `main` 分支后，GitHub Actions 会自动构建并把 `client/dist/` 部署到 GitHub Pages。

1. 在仓库 **Settings → Pages** 中选择来源为 **GitHub Actions**；
2. push `main` 触发 `.github/workflows/deploy.yml`；
3. 部署完成后访问：`https://<用户名>.github.io/<仓库名>/`（在线地址占位，替换为你自己的仓库）。

## 目录结构

```
mir-web/
├── shared/    # 共享类型、协议、数据（怪物/物品/地图/技能）
├── server/    # 原多人服务器（保留，构建兼容）
├── client/    # Phaser 3 前端（单机游戏引擎 + UI）
│   └── src/game/   # 本地引擎：战斗/背包/寻路/技能/任务/存档
└── .github/workflows/deploy.yml
```

## 已知限制

- 无多人/联机；聊天为本地回显；无行会等社交系统。
- 画面为几何图形绘制（色块 + 圆形），非美术贴图。
- 掉落物不自动消失；地图仅 2 张；怪物 AI 为简化巡逻 / 追击。
