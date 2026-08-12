/**
 * 本地 UI 状态（非同步）：登录 token、角色列表、当前角色、背包快照等
 */
import type {
  AuthResponse,
  CharacterInfo,
  InventorySnapshotMessage,
} from '@mir/shared';

class LocalState {
  token: string | null = null;
  userId: string | null = null;
  username: string | null = null;
  characters: CharacterInfo[] = [];
  currentCharacterId: string | null = null;

  /** 背包快照（从服务端 InventorySnapshot 消息接收） */
  inventory: InventorySnapshotMessage = { gold: 0, slots: [], equipment: [] };

  /** 当前玩家 ID（房间内 sessionId） */
  localSessionId: string | null = null;

  setAuth(resp: AuthResponse) {
    this.token = resp.token;
    this.userId = resp.user.id;
    this.username = resp.user.username;
  }

  clearAuth() {
    this.token = null;
    this.userId = null;
    this.username = null;
    this.characters = [];
    this.currentCharacterId = null;
  }
}

export const localState = new LocalState();
