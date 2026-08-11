import { Router } from 'express';
import bcrypt from 'bcrypt';
import { queryOne } from './db.js';
import { signToken, authMiddleware } from './jwt.js';
import { MAX_CHARACTERS_PER_USER } from '@mir/shared';

export const authRouter = Router();

const USERNAME_RE = /^[a-zA-Z0-9_]{3,32}$/;
const PASSWORD_MIN = 6;

interface UserRow {
  id: string;
  username: string;
  password_hash: string;
}

/** POST /api/auth/register */
authRouter.post('/register', async (req, res) => {
  const { username, password } = req.body ?? {};
  if (!USERNAME_RE.test(username ?? '')) {
    return res.status(400).json({ code: 'INVALID_USERNAME', message: '用户名仅支持 3-32 位字母数字下划线' });
  }
  if (typeof password !== 'string' || password.length < PASSWORD_MIN) {
    return res.status(400).json({ code: 'INVALID_PASSWORD', message: '密码至少 6 位' });
  }

  const exists = await queryOne<UserRow>('SELECT id FROM users WHERE username = $1', [username]);
  if (exists) {
    return res.status(409).json({ code: 'USERNAME_TAKEN', message: '用户名已被使用' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await queryOne<UserRow>(
    `INSERT INTO users (username, password_hash)
     VALUES ($1, $2) RETURNING id, username`,
    [username, passwordHash],
  );
  if (!user) {
    return res.status(500).json({ code: 'DB_ERROR', message: '创建用户失败' });
  }

  const token = signToken({ sub: user.id, username: user.username });
  res.json({ token, user: { id: user.id, username: user.username } });
});

/** POST /api/auth/login */
authRouter.post('/login', async (req, res) => {
  const { username, password } = req.body ?? {};
  if (!username || !password) {
    return res.status(400).json({ code: 'INVALID_INPUT', message: '用户名或密码不能为空' });
  }
  const user = await queryOne<UserRow>('SELECT * FROM users WHERE username = $1', [username]);
  if (!user) {
    return res.status(401).json({ code: 'INVALID_CREDENTIALS', message: '用户名或密码错误' });
  }
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    return res.status(401).json({ code: 'INVALID_CREDENTIALS', message: '用户名或密码错误' });
  }
  const token = signToken({ sub: user.id, username: user.username });
  res.json({ token, user: { id: user.id, username: user.username } });
});

/** GET /api/auth/verify （需要 token） */
authRouter.get('/verify', authMiddleware, (req, res) => {
  const user = (req as unknown as { user: { sub: string; username: string } }).user;
  res.json({ valid: true, user: { id: user.sub, username: user.username } });
});

export { MAX_CHARACTERS_PER_USER };
