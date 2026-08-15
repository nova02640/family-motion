import {
  PlayerClass,
  CLASS_BASE_STATS,
  expToNextLevel,
  type Stats,
} from '@mir/shared';
import { getMap, DEFAULT_MAP_ID } from '@mir/shared';
import {
  createEmptyInventory,
  addItem,
  type PlayerInventory,
  type InvSlot,
} from './engine/inventory.js';
import { computeStats } from './engine/stats.js';

/** 存档数据（localStorage 持久化） */
export interface CharacterSave {
  id: string;
  name: string;
  classId: PlayerClass;
  level: number;
  exp: number;
  expToNext: number;
  mapId: string;
  position: { x: number; y: number };
  hp: number;
  mp: number;
  gold: number;
  inventory: { gold: number; slots: InvSlot[]; equipment: Partial<Record<string, string>> };
  freePoints: number;
  bonus: Partial<Stats>;
  tasks: { progress: Record<string, number>; completed: string[] };
}

const ACCOUNTS_KEY = 'mir_accounts';
const CURRENT_USER_KEY = 'mir_current_user';
const charKey = (username: string) => `mir_chars_${username}`;

interface AccountRecord {
  id: string;
  username: string;
}

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

let idCounter = 0;
function makeId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter}_${Math.floor(Math.random() * 1e6).toString(36)}`;
}

// ==================== 账号 ====================

export function ensureAccount(username: string): AccountRecord {
  const accounts = readJSON<Record<string, AccountRecord>>(ACCOUNTS_KEY, {});
  const existing = Object.values(accounts).find((a) => a.username === username);
  if (existing) {
    localStorage.setItem(CURRENT_USER_KEY, username);
    return existing;
  }
  const acc: AccountRecord = { id: makeId('u'), username };
  accounts[acc.id] = acc;
  writeJSON(ACCOUNTS_KEY, accounts);
  localStorage.setItem(CURRENT_USER_KEY, username);
  return acc;
}

export function getCurrentUsername(): string | null {
  return localStorage.getItem(CURRENT_USER_KEY);
}

export function clearSession(): void {
  localStorage.removeItem(CURRENT_USER_KEY);
}

// ==================== 角色 ====================

export function listCharacters(username: string): CharacterSave[] {
  return readJSON<CharacterSave[]>(charKey(username), []);
}

function saveCharacters(username: string, chars: CharacterSave[]) {
  writeJSON(charKey(username), chars);
}

/** 职业初始装备与补给 */
function startingItems(classId: PlayerClass): { itemId: string; count: number }[] {
  const weapon = classId === PlayerClass.Mage ? 'magic_staff'
    : classId === PlayerClass.Taoist ? 'taoist_sword'
    : 'wood_sword';
  return [
    { itemId: weapon, count: 1 },
    { itemId: 'cloth_armor', count: 1 },
    { itemId: 'hp_potion', count: 5 },
    { itemId: 'mp_potion', count: 3 },
  ];
}

export function createCharacter(username: string, name: string, classId: PlayerClass): CharacterSave {
  const base = CLASS_BASE_STATS[classId];
  const inv = createEmptyInventory();
  for (const it of startingItems(classId)) addItem(inv, it.itemId, it.count);

  const spawn = getMap(DEFAULT_MAP_ID)?.spawnPoint ?? { x: 20, y: 20 };
  const save: CharacterSave = {
    id: makeId('c'),
    name,
    classId,
    level: 1,
    exp: 0,
    expToNext: expToNextLevel(1),
    mapId: DEFAULT_MAP_ID,
    position: { ...spawn },
    hp: base.maxHp,
    mp: base.maxMp,
    gold: 100,
    inventory: {
      gold: inv.gold,
      slots: inv.slots.filter((s): s is InvSlot => s !== null),
      equipment: inv.equipment as Partial<Record<string, string>>,
    },
    freePoints: 0,
    bonus: {},
    tasks: { progress: {}, completed: [] },
  };

  const chars = listCharacters(username);
  chars.push(save);
  saveCharacters(username, chars);
  return save;
}

export function deleteCharacter(username: string, id: string): void {
  const chars = listCharacters(username).filter((c) => c.id !== id);
  saveCharacters(username, chars);
}

export function getCharacter(username: string, id: string): CharacterSave | undefined {
  return listCharacters(username).find((c) => c.id === id);
}

export function saveCharacter(username: string, save: CharacterSave): void {
  const chars = listCharacters(username);
  const i = chars.findIndex((c) => c.id === save.id);
  if (i >= 0) chars[i] = save;
  else chars.push(save);
  saveCharacters(username, chars);
}

/** 反序列化背包 */
export function loadInventory(save: CharacterSave): PlayerInventory {
  const inv = createEmptyInventory();
  inv.gold = save.inventory.gold;
  for (const s of save.inventory.slots) {
    if (s && typeof s.index === 'number' && s.index >= 0 && s.index < inv.slots.length) {
      inv.slots[s.index] = { index: s.index, itemId: s.itemId, count: s.count };
    }
  }
  inv.equipment = { ...save.inventory.equipment } as Partial<Record<string, string>>;
  return inv;
}

export function serializeInventory(inv: PlayerInventory): CharacterSave['inventory'] {
  return {
    gold: inv.gold,
    slots: inv.slots.filter((s): s is InvSlot => s !== null),
    equipment: inv.equipment as Partial<Record<string, string>>,
  };
}

/** 重算属性（读取装备） */
export function computeCharacterStats(save: CharacterSave, inv: PlayerInventory): Stats {
  return computeStats(save.classId, save.level, inv.equipment, save.bonus);
}
