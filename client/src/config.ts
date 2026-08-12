import { TILE_SIZE } from '@mir/shared';

/** 服务端 URL（Vite 注入） */
export const SERVER_URL =
  (import.meta.env.VITE_SERVER_URL as string | undefined) ??
  (typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:2567'
    : '');

/** WebSocket URL（用于 Colyseus client） */
export function wsUrl(): string {
  if (!SERVER_URL) {
    // 生产环境同源
    return `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`;
  }
  return SERVER_URL.replace(/^http/, 'ws');
}

/** REST API 基地址 */
export function apiUrl(path: string): string {
  if (!SERVER_URL) return path; // 同源（生产）
  return `${SERVER_URL}${path}`;
}

export const TILE_PX = TILE_SIZE;
export const GAME_WIDTH = 1024;
export const GAME_HEIGHT = 640;
export const VIEW_TILES_X = Math.ceil(GAME_WIDTH / TILE_PX) + 2;
export const VIEW_TILES_Y = Math.ceil(GAME_HEIGHT / TILE_PX) + 2;
