import Phaser from 'phaser';
import { gameClient } from '../net/GameClient.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import type { SkillTemplate } from '@mir/shared';

interface SlotView {
  skill: SkillTemplate;
  bg: Phaser.GameObjects.Rectangle;
  icon: Phaser.GameObjects.Text;
  label: Phaser.GameObjects.Text;
  cdText: Phaser.GameObjects.Text;
}

/** 技能栏：显示已学会技能，点击或按 1/2 施放 */
export class SkillBar {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private slots: SlotView[] = [];
  private lastSignature = '';

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(GAME_WIDTH / 2, GAME_HEIGHT - 60)
      .setDepth(110).setScrollFactor(0);
    this.rebuild();
  }

  private rebuild() {
    for (const s of this.slots) {
      s.bg.destroy(); s.icon.destroy(); s.label.destroy(); s.cdText.destroy();
    }
    this.slots = [];

    const skills = gameClient.getSkills();
    const slotSize = 52;
    const gap = 8;
    const totalW = skills.length * slotSize + (skills.length - 1) * gap;
    const startX = -totalW / 2 + slotSize / 2;

    skills.forEach((skill, i) => {
      const x = startX + i * (slotSize + gap);
      const color = skill.color;
      const bg = this.scene.add.rectangle(x, 0, slotSize, slotSize, 0x1f2937, 0.95)
        .setStrokeStyle(2, color).setOrigin(0.5).setInteractive({ useHandCursor: true });
      const icon = this.scene.add.text(x, -4, skill.name.charAt(0), {
        fontFamily: 'monospace', fontSize: '20px', color: '#fff',
      }).setOrigin(0.5);
      const label = this.scene.add.text(x, slotSize / 2 + 12, `${i + 1}.${skill.name}`, {
        fontFamily: 'monospace', fontSize: '9px', color: '#9ca3af',
      }).setOrigin(0.5);
      const cdText = this.scene.add.text(x, 0, '', {
        fontFamily: 'monospace', fontSize: '12px', color: '#fff', backgroundColor: '#000000', padding: { x: 4, y: 2 },
      }).setOrigin(0.5).setVisible(false);

      bg.on('pointerdown', () => gameClient.sendUseSkill(skill.id));
      bg.on('pointerover', () => bg.setFillStyle(0x374151, 0.95));
      bg.on('pointerout', () => bg.setFillStyle(0x1f2937, 0.95));

      this.slots.push({ skill, bg, icon, label, cdText });
    });

    this.lastSignature = skills.map((s) => s.id).join(',');
  }

  update() {
    const skills = gameClient.getSkills();
    const sig = skills.map((s) => s.id).join(',');
    if (sig !== this.lastSignature) this.rebuild();

    const me = gameClient.room?.state.players.get('local');
    for (const slot of this.slots) {
      const cd = gameClient.getCooldownRemaining(slot.skill.id);
      const hasMp = (me?.mp ?? 0) >= slot.skill.mpCost;
      if (cd > 0) {
        slot.cdText.setText(`${Math.ceil(cd / 1000)}`).setVisible(true);
        slot.bg.setAlpha(0.5);
      } else if (!hasMp) {
        slot.cdText.setText('MP').setVisible(true);
        slot.bg.setAlpha(0.5);
      } else {
        slot.cdText.setVisible(false);
        slot.bg.setAlpha(1);
      }
    }
  }

  destroy() {
    this.container.destroy();
  }
}
