import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './config.js';
import { BootScene } from './scenes/BootScene.js';
import { PreloadScene } from './scenes/PreloadScene.js';
import { LoginScene } from './scenes/LoginScene.js';
import { CharacterSelectScene } from './scenes/CharacterSelectScene.js';
import { GameScene } from './scenes/GameScene.js';
import { HudScene } from './ui/HudScene.js';
import { installGlobalErrorHandlers, reportError } from './util/errorReport.js';

installGlobalErrorHandlers();

// 诊断标记：GameScene 收到 onMapInit 时写入（供 ready 超时诊断使用）
declare global {
  interface Window {
    __mirMapInitAt?: number;
    __mirGameStartedAt?: number;
    __mirReadyAt?: number;
  }
}

const game = new Phaser.Game({
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

game.events.once('ready', () => {
  window.__mirReadyAt = Date.now();
  // 进入游戏场景后 10 秒内未收到 onMapInit 则提示诊断信息
  window.setTimeout(() => {
    if (window.__mirGameStartedAt && !window.__mirMapInitAt) {
      reportError(
        '诊断：已进入游戏场景但 10 秒内未收到地图数据（onMapInit 未触发）。\n' +
          '可能是本地存档异常或引擎初始化失败。请尝试：清除浏览器 localStorage 后刷新。',
        'diagnostic',
      );
    }
  }, 10000);
});
