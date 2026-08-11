import Phaser from 'phaser';

/** MVP 阶段无需加载外部资源，直接进入登录场景 */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('preload');
  }

  create() {
    this.scene.start('login');
  }
}
