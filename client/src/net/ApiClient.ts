/**
 * 本地账号/角色管理 —— 替代 REST API。
 * 账号与角色数据持久化到 localStorage（任意用户名即可进入）。
 */
import { localState } from '../state/LocalState.js';
import { MAX_CHARACTERS_PER_USER, type PlayerClass } from '@mir/shared';
import {
  ensureAccount,
  listCharacters,
  createCharacter,
  deleteCharacter,
  getCurrentUsername,
  clearSession,
} from '../game/save.js';
import type { CharacterInfo } from '@mir/shared';

export const api = {
  async register(username: string, _password: string): Promise<{ token: string; user: { id: string; username: string } }> {
    return this.login(username, _password);
  },

  async login(username: string, _password: string): Promise<{ token: string; user: { id: string; username: string } }> {
    const acc = ensureAccount(username);
    localState.setAuth({ token: 'local', user: { id: acc.id, username: acc.username } });
    return { token: 'local', user: { id: acc.id, username: acc.username } };
  },

  async listCharacters(): Promise<CharacterInfo[]> {
    const username = localState.username;
    if (!username) return [];
    const chars = listCharacters(username).map((c) => ({
      id: c.id,
      name: c.name,
      classId: c.classId,
      level: c.level,
      mapId: c.mapId,
    }));
    localState.characters = chars;
    return chars;
  },

  async createCharacter(name: string, classId: PlayerClass): Promise<CharacterInfo> {
    const username = localState.username;
    if (!username) throw new Error('未登录');
    if (localState.characters.length >= MAX_CHARACTERS_PER_USER) {
      throw new Error(`每个账号最多 ${MAX_CHARACTERS_PER_USER} 个角色`);
    }
    const ch = createCharacter(username, name, classId);
    const info: CharacterInfo = { id: ch.id, name: ch.name, classId: ch.classId, level: ch.level, mapId: ch.mapId };
    localState.characters.push(info);
    return info;
  },

  async deleteCharacter(id: string): Promise<void> {
    const username = localState.username;
    if (!username) return;
    deleteCharacter(username, id);
    localState.characters = localState.characters.filter((c) => c.id !== id);
  },

  /** 尝试恢复上次登录的账号（localStorage 持久化） */
  restoreSession(): boolean {
    const username = getCurrentUsername();
    if (username) {
      const acc = ensureAccount(username);
      localState.setAuth({ token: 'local', user: { id: acc.id, username: acc.username } });
      return true;
    }
    return false;
  },

  logout(): void {
    clearSession();
    localState.clearAuth();
  },
};
