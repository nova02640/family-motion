import { Schema, type } from '@colyseus/schema';
import { Vec2State } from './Vec2.js';

/** 玩家实体（同步给客户端的状态） */
export class PlayerState extends Schema {
  @type('string') id = '';
  @type('string') name = '';
  @type('string') classId = '';        // PlayerClass
  @type('number') level = 1;
  @type('number') exp = 0;
  @type('number') expToNext = 0;
  @type(Vec2State) position = new Vec2State();
  @type('string') direction = 'down'; // Direction
  @type('string') state = 'idle';     // EntityState
  @type('number') hp = 0;
  @type('number') maxHp = 0;
  @type('number') mp = 0;
  @type('number') maxMp = 0;
  @type('number') attack = 0;
  @type('number') defense = 0;
  @type('number') magicAttack = 0;
  @type('number') magicDefense = 0;
  @type('number') moveSpeed = 4;
  @type('number') attackSpeed = 1;
  @type('number') gold = 0;
  @type('string') targetId = '';       // 当前目标实体 ID
}
