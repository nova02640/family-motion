import type { Stats } from '@mir/shared';

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

/** 计算伤害 */
export function calcDamage(
  attacker: CombatActor,
  defender: CombatActor,
  opts: { type?: 'physical' | 'magic' | 'true' } = {},
): DamageResult {
  const type = opts.type ?? 'physical';

  if (type === 'true') {
    return { hit: true, amount: Math.max(1, attacker.stats.attack), crit: false, type };
  }

  const accuracy = attacker.stats.accuracy;
  const evasion = defender.stats.evasion;
  const hitChance = Math.min(0.95, Math.max(0.05, accuracy / (accuracy + evasion)));
  if (Math.random() > hitChance) {
    return { hit: false, amount: 0, crit: false, type };
  }

  const atk = type === 'magic' ? attacker.stats.magicAttack : attacker.stats.attack;
  const def = type === 'magic' ? defender.stats.magicDefense : defender.stats.defense;

  const variance = 0.85 + Math.random() * 0.3;
  let dmg = (atk - def * 0.5) * variance;
  dmg = Math.max(1, Math.floor(dmg));

  let crit = false;
  if (Math.random() < attacker.stats.critRate) {
    crit = true;
    dmg = Math.floor(dmg * attacker.stats.critDamage);
  }

  return { hit: true, amount: dmg, crit, type };
}

/** 计算经验奖励（等级差衰减） */
export function calcExpReward(killerLevel: number, monsterLevel: number, baseExp: number): number {
  const diff = killerLevel - monsterLevel;
  let mult = 1;
  if (diff > 5) mult = Math.max(0.1, 1 - (diff - 5) * 0.1);
  return Math.max(1, Math.floor(baseExp * mult));
}

/** 死亡经验惩罚 */
export function calcDeathExpPenalty(currentExp: number, penaltyRate: number): number {
  return Math.floor(currentExp * penaltyRate);
}
