import { Schema, type } from '@colyseus/schema';

/** 网格坐标 */
export class Vec2State extends Schema {
  @type('number') x: number;
  @type('number') y: number;

  constructor(x = 0, y = 0) {
    super();
    this.x = x;
    this.y = y;
  }

  set(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  equals(x: number, y: number): boolean {
    return this.x === x && this.y === y;
  }
}
