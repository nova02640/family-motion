/**
 * REST API 客户端 - 注册/登录/角色管理
 */
import { apiUrl } from '../config.js';
import { localState } from '../state/LocalState.js';
import type {
  AuthResponse,
  CharacterInfo,
  CharacterListResponse,
  CreateCharacterRequest,
  PlayerClass,
} from '@mir/shared';

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  };
  if (localState.token) {
    headers.Authorization = `Bearer ${localState.token}`;
  }
  const res = await fetch(apiUrl(path), { ...init, headers });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const err = (data as { message?: string } | null)?.message ?? `HTTP ${res.status}`;
    throw new Error(err);
  }
  return data as T;
}

export const api = {
  async register(username: string, password: string): Promise<AuthResponse> {
    const resp = await req<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    localState.setAuth(resp);
    return resp;
  },

  async login(username: string, password: string): Promise<AuthResponse> {
    const resp = await req<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    localState.setAuth(resp);
    return resp;
  },

  async listCharacters(): Promise<CharacterInfo[]> {
    const resp = await req<CharacterListResponse>('/api/characters');
    localState.characters = resp.characters;
    return resp.characters;
  },

  async createCharacter(name: string, classId: PlayerClass): Promise<CharacterInfo> {
    const body: CreateCharacterRequest = { name, classId };
    const char = await req<CharacterInfo>('/api/characters', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    localState.characters.push(char);
    return char;
  },

  async deleteCharacter(id: string): Promise<void> {
    await req<{ ok: boolean }>(`/api/characters/${id}`, { method: 'DELETE' });
    localState.characters = localState.characters.filter((c) => c.id !== id);
  },
};
