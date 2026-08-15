import { PlayerClass, type SkillTemplate } from '../types.js';

/**
 * 职业技能数据 —— 传奇(Mir2) 经典技能，每个职业 2 个。
 * 随等级自动学会（getLearnedSkills）。
 */

const SKILLS: SkillTemplate[] = [
  // ============ 战士 ============
  {
    id: 'slash',
    name: '攻杀剑术',
    classId: PlayerClass.Warrior,
    kind: 'melee',
    mpCost: 5,
    cooldown: 2000,
    level: 1,
    range: 1.5,
    multiplier: 1.6,
    description: '凝聚力量的一击，造成 160% 物理伤害',
    color: 0x60a5fa,
  },
  {
    id: 'assault',
    name: '刺杀剑术',
    classId: PlayerClass.Warrior,
    kind: 'pierce',
    mpCost: 12,
    cooldown: 6000,
    level: 5,
    range: 3,
    multiplier: 0.9,
    description: '直线穿透，命中路径上的多个敌人',
    color: 0x93c5fd,
  },
  // ============ 法师 ============
  {
    id: 'fireball',
    name: '火球术',
    classId: PlayerClass.Mage,
    kind: 'projectile',
    mpCost: 15,
    cooldown: 3000,
    level: 1,
    range: 6,
    multiplier: 1.2,
    aoeRadius: 2,
    description: '发射火球，命中后爆炸造成范围魔法伤害',
    color: 0xf97316,
  },
  {
    id: 'lightning',
    name: '雷电术',
    classId: PlayerClass.Mage,
    kind: 'bolt',
    mpCost: 20,
    cooldown: 5000,
    level: 7,
    range: 6,
    multiplier: 2.2,
    description: '召唤雷电，对单体造成高额魔法伤害',
    color: 0xfbbf24,
  },
  // ============ 道士 ============
  {
    id: 'heal',
    name: '治愈术',
    classId: PlayerClass.Taoist,
    kind: 'heal',
    mpCost: 15,
    cooldown: 5000,
    level: 1,
    range: 0,
    multiplier: 2.5,
    description: '回复自身生命（基于魔法攻击）',
    color: 0x34d399,
  },
  {
    id: 'poison',
    name: '施毒术',
    classId: PlayerClass.Taoist,
    kind: 'dot',
    mpCost: 20,
    cooldown: 6000,
    level: 5,
    range: 5,
    multiplier: 1,
    dot: { damage: 3, duration: 6000, tickInterval: 1000 },
    description: '使目标中毒，持续掉血',
    color: 0x84cc16,
  },
];

const BY_ID = new Map<string, SkillTemplate>(SKILLS.map((s) => [s.id, s]));

export function getSkill(id: string): SkillTemplate | undefined {
  return BY_ID.get(id);
}

/** 某职业的全部技能 */
export function getSkillsForClass(classId: PlayerClass): SkillTemplate[] {
  return SKILLS.filter((s) => s.classId === classId);
}

/** 当前等级已学会的技能 */
export function getLearnedSkills(classId: PlayerClass, level: number): SkillTemplate[] {
  return SKILLS.filter((s) => s.classId === classId && s.level <= level);
}

export const SKILL_TEMPLATES: SkillTemplate[] = SKILLS;
