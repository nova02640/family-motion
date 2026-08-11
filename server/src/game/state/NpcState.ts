import { Schema, type } from '@colyseus/schema';
import { Vec2State } from './Vec2.js';

/** NPC（不可移动） */
export class NpcState extends Schema {
  @type('string') id = '';
  @type('string') name = '';
  @type(Vec2State) position = new Vec2State();
  @type('string') dialog = '';
}
