import { Schema, type } from '@colyseus/schema';
import { Vec2State } from './Vec2.js';

/** 怪物实体 */
export class MonsterState extends Schema {
  @type('string') id = '';
  @type('string') templateId = '';
  @type('string') name = '';
  @type('number') level = 1;
  @type(Vec2State) position = new Vec2State();
  @type(Vec2State) spawnPosition = new Vec2State();
  @type('string') direction = 'down';
  @type('string') state = 'idle';     // idle / moving / attacking / dead
  @type('number') hp = 0;
  @type('number') maxHp = 0;
  @type('number') attack = 0;
  @type('number') defense = 0;
  @type('string') targetId = '';       // aggro 目标
  /** 死亡时的时间戳（用于复活倒计时）；0 表示存活 */
  @type('number') deadAt = 0;
}
