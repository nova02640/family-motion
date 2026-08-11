import http from 'node:http';
import express from 'express';
import cors from 'cors';
import { Server } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { RedisPresence } from '@colyseus/redis-presence';
import { monitor } from '@colyseus/monitor';
import IoRedis from 'ioredis';
import { config } from './config.js';
import { authRouter } from './auth/authRoutes.js';
import { characterRouter } from './auth/characterRoutes.js';
import { GameRoom } from './game/GameRoom.js';
import { pool } from './auth/db.js';

async function main() {
  const app = express();
  app.use(express.json());
  app.use(cors({ origin: config.clientOrigin, credentials: true }));

  // 健康检查
  app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

  // REST API
  app.use('/api/auth', authRouter);
  app.use('/api/characters', characterRouter);

  // Colyseus 服务器
  const gameServer = new Server({
    transport: new WebSocketTransport({
      server: http.createServer(app),
    }),
    presence: new RedisPresence(config.redisUrl),
  });

  gameServer.define('game', GameRoom).enableRealtimeListing();

  // Colyseus 监控面板（仅开发环境）
  if (!config.isProd) {
    app.use('/colyseus', monitor());
  }

  // 启动
  const port = config.port;
  gameServer.listen(port);
  console.log(`[server] listening on http://localhost:${port}`);
  console.log(`[server] colyseus monitor: http://localhost:${port}/colyseus`);
  console.log(`[server] env: ${config.env}`);

  // 优雅关闭
  const shutdown = async (signal: string) => {
    console.log(`[server] ${signal} received, shutting down...`);
    await gameServer.gracefullyShutdown(false);
    await pool.end();
    process.exit(0);
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('[server] fatal error:', err);
  process.exit(1);
});
