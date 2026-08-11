import { type Stats } from '@mir/shared';

export interface CombatActor {
  id: string;
  stats: Stats;
}

export interface DamageResult {
  hit: boolean;
  amount: number;
  crit: boolean;
  type: 'physical' | 'magic' | 'true';
}

/** 计算伤害（服务器权威） */
export function calcDamage(
  attacker: CombatActor,
  defender: CombatActor,
  opts: { type?: 'physical' | 'magic' | 'true' } = {},
): DamageResult {
  const type = opts.type ?? 'physical';

  if (type === 'true') {
    return { hit: true, amount: Math.max(1, attacker.stats.attack), crit: false, type };
  }

  // 命中判定
  const accuracy = attacker.stats.accuracy;
  const evasion = defender.stats.evasion;
  // 命中率 = accuracy / (accuracy + evasion)，下限 5% 上限 95%
  const hitChance = Math.min(0.95, Math.max(0.05, accuracy / (accuracy + evasion)));
  if (Math.random() > hitChance) {
    return { hit: false, amount: 0, crit: false, type };
  }

  // 攻防
  const atk = type === 'magic' ? attacker.stats.magicAttack : attacker.stats.attack;
  const def = type === 'magic' ? defender.stats.magicDefense : defender.stats.defense;

  // 基础伤害浮动 0.85 ~ 1.15
  const variance = 0.85 + Math.random() * 0.3;
  let dmg = (atk - def * 0.5) * variance;
  dmg = Math.max(1, Math.floor(dmg));

  // 暴击
  let crit = false;
  if (Math.random() < attacker.stats.critRate) {
    crit = true;
    dmg = Math.floor(dmg * attacker.stats.critDamage);
  }

  return { hit: true, amount: dmg, crit, type };
}

/** 计算经验分摊（按贡献，简化版：直接给击杀者） */
export function calcExpReward(
  killerLevel: number,
  monsterLevel: number,
  baseExp: number,
): number {
  // 等级差惩罚：怪等级比玩家高 5 级以上倍率 1，低于 5 级以下衰减
  const diff = killerLevel - monsterLevel;
  let mult = 1;
  if (diff > 5) mult = Math.max(0.1, 1 - (diff - 5) * 0.1);
  return Math.max(1, Math.floor(baseExp * mult));
}

/** 死亡掉落经验惩罚 */
export function calcDeathExpPenalty(currentExp: number, penaltyRate: number): number {
  return Math.floor(currentExp * penaltyRate);
}
