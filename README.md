# Mir Web — 浏览器传奇类 MMORPG

基于 Phaser 4 + Colyseus 的 Web 端传奇类游戏，浏览器即开即玩。

## 技术栈

| 层 | 技术 |
|---|---|
| 客户端 | Phaser 4 + TypeScript + Vite |
| 实时同步 | Colyseus（权威服务器 + 增量状态同步） |
| REST API | Express + JWT |
| 数据库 | PostgreSQL（持久化）+ Redis（在线状态/排行） |
| 部署 | Docker Compose |

## 项目结构

```
mir-web/
├── shared/    # 前后端共享类型、协议、配置
├── server/    # Colyseus 游戏服 + Express API
├── client/    # Phaser 4 前端
└── docker-compose.yml
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动基础设施（PostgreSQL + Redis）

```bash
docker compose up -d postgres redis
```

### 3. 初始化数据库

```bash
npm -w server run db:init
```

### 4. 启动开发环境

```bash
npm run dev
```

- 客户端：http://localhost:5173
- 服务端：http://localhost:2567

## 核心特性

- 服务器权威架构（反作弊）
- 增量状态同步（节省带宽）
- 客户端预测 + 服务端纠偏
- 斜视角瓦片地图 + A* 寻路
- 怪物 AI / 刷新 / 装备掉落
- 背包 / 聊天 / 行会（规划中）

## 开发命令

```bash
npm run dev          # 同时启动前后端
npm run build        # 构建所有包
npm run typecheck    # 类型检查
```
