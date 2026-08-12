import { Schema, type } from '@colyseus/schema';
import { Vec2State } from './Vec2.js';

/** 地上掉落物 */
export class ItemDropState extends Schema {
  @type('string') id = '';
  @type('string') itemId = '';
  @type('number') count = 1;
  @type(Vec2State) position = new Vec2State();
}
