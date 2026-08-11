import { Router } from 'express';
import { queryMany, queryOne } from './db.js';
import { authMiddleware } from './jwt.js';
import {
  CLASS_BASE_STATS,
  PlayerClass,
  MAX_CHARACTERS_PER_USER,
  type CreateCharacterRequest,
  type CharacterInfo,
} from '@mir/shared';

export const characterRouter = Router();
characterRouter.use(authMiddleware);

interface CharacterRow {
  id: string;
  name: string;
  class: string;
  level: number;
  exp: number;
  map_id: string;
  pos_x: number;
  pos_y: number;
  hp: number;
  mp: number;
  inventory: unknown;
  equipment: unknown;
  gold: number;
}

function toInfo(row: CharacterRow): CharacterInfo {
  return {
    id: row.id,
    name: row.name,
    classId: row.class as PlayerClass,
    level: row.level,
    mapId: row.map_id,
  };
}

const NAME_RE = /^[\u4e00-\u9fa5a-zA-Z0-9_]{2,16}$/;
const VALID_CLASSES = new Set(Object.values(PlayerClass));

/** GET /api/characters */
characterRouter.get('/', async (req, res) => {
  const user = (req as unknown as { user: { sub: string } }).user;
  const rows = await queryMany<CharacterRow>(
    'SELECT * FROM characters WHERE user_id = $1 ORDER BY created_at DESC',
    [user.sub],
  );
  res.json({ characters: rows.map(toInfo) });
});

/** POST /api/characters */
characterRouter.post('/', async (req, res) => {
  const user = (req as unknown as { user: { sub: string } }).user;
  const body = req.body as CreateCharacterRequest;

  if (!NAME_RE.test(body?.name ?? '')) {
    return res.status(400).json({ code: 'INVALID_NAME', message: '角色名 2-16 位，支持中英文数字下划线' });
  }
  if (!VALID_CLASSES.has(body?.classId)) {
    return res.status(400).json({ code: 'INVALID_CLASS', message: '非法职业' });
  }

  const countRow = await queryOne<{ count: string }>(
    'SELECT COUNT(*)::text AS count FROM characters WHERE user_id = $1',
    [user.sub],
  );
  if (Number(countRow?.count ?? 0) >= MAX_CHARACTERS_PER_USER) {
    return res.status(400).json({ code: 'TOO_MANY_CHARACTERS', message: `每个账号最多 ${MAX_CHARACTERS_PER_USER} 个角色` });
  }

  const nameTaken = await queryOne<CharacterRow>('SELECT id FROM characters WHERE name = $1', [body.name]);
  if (nameTaken) {
    return res.status(409).json({ code: 'NAME_TAKEN', message: '角色名已被使用' });
  }

  const baseStats = CLASS_BASE_STATS[body.classId];
  const row = await queryOne<CharacterRow>(
    `INSERT INTO characters
      (user_id, name, class, level, exp, map_id, pos_x, pos_y, hp, mp, gold)
     VALUES ($1, $2, $3, 1, 0, 'village', 25, 25, $4, $5, 0)
     RETURNING *`,
    [user.sub, body.name, body.classId, baseStats.maxHp, baseStats.maxMp],
  );
  if (!row) return res.status(500).json({ code: 'DB_ERROR', message: '创建失败' });
  res.status(201).json(toInfo(row));
});

/** DELETE /api/characters/:id */
characterRouter.delete('/:id', async (req, res) => {
  const user = (req as unknown as { user: { sub: string } }).user;
  const result = await queryOne<{ id: string }>(
    'DELETE FROM characters WHERE id = $1 AND user_id = $2 RETURNING id',
    [req.params.id, user.sub],
  );
  if (!result) return res.status(404).json({ code: 'NOT_FOUND', message: '角色不存在' });
  res.json({ ok: true });
});
