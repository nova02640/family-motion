import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './config.js';
import { BootScene } from './scenes/BootScene.js';
import { PreloadScene } from './scenes/PreloadScene.js';
import { LoginScene } from './scenes/LoginScene.js';
import { CharacterSelectScene } from './scenes/CharacterSelectScene.js';
import { GameScene } from './scenes/GameScene.js';
import { HudScene } from './ui/HudScene.js';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#0d1117',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, PreloadScene, LoginScene, CharacterSelectScene, GameScene, HudScene],
});
