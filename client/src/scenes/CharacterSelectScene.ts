import Phaser from 'phaser';
import { api } from '../net/ApiClient.js';
import { localState } from '../state/LocalState.js';
import { TextInput } from '../ui/TextInput.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import { PlayerClass, MAX_CHARACTERS_PER_USER } from '@mir/shared';

const CLASS_INFO: Record<PlayerClass, { name: string; desc: string; color: number }> = {
  [PlayerClass.Warrior]: { name: '战士', desc: '高血量近战，攻防均衡', color: 0x60a5fa },
  [PlayerClass.Mage]: { name: '法师', desc: '高魔攻低血量，远程爆发', color: 0xf472b6 },
  [PlayerClass.Taoist]: { name: '道士', desc: '可召唤可辅助，生存强', color: 0xfacc15 },
};

export class CharacterSelectScene extends Phaser.Scene {
  private list: Phaser.GameObjects.Container[] = [];
  private createPanel?: Phaser.GameObjects.Container;
  private nameInput?: TextInput;
  private selectedClass: PlayerClass = PlayerClass.Warrior;
  private statusText!: Phaser.GameObjects.Text;

  constructor() {
    super('character-select');
  }

  async create() {
    this.add.text(GAME_WIDTH / 2, 40, `选择角色 — ${localState.username ?? ''}`, {
      fontFamily: 'monospace', fontSize: '24px', color: '#fbbf24',
    }).setOrigin(0.5);

    this.statusText = this.add.text(GAME_WIDTH / 2, 70, '加载中...', {
      fontFamily: 'monospace', fontSize: '14px', color: '#9ca3af',
    }).setOrigin(0.5);

    await this.refreshList();

    this.makeButton(120, GAME_HEIGHT - 40, '← 退出登录', 0x4b5563, () => {
      localState.clearAuth();
      this.scene.start('login');
    });

    if (localState.characters.length < MAX_CHARACTERS_PER_USER) {
      this.makeButton(GAME_WIDTH - 120, GAME_HEIGHT - 40, '+ 新建角色', 0x059669, () => this.toggleCreatePanel());
    }

    this.events.once('shutdown', () => {
      this.nameInput?.destroy();
    });
  }

  private async refreshList() {
    for (const c of this.list) c.destroy();
    this.list = [];
    try {
      await api.listCharacters();
    } catch (err) {
      this.statusText.setText(`加载失败: ${(err as Error).message}`).setColor('#f87171');
      return;
    }
    this.statusText.setText('');

    const chars = localState.characters;
    if (chars.length === 0) {
      this.add.text(GAME_WIDTH / 2, 200, '暂无角色，点击右下角"新建角色"创建', {
        fontFamily: 'monospace', fontSize: '16px', color: '#6b7280',
      }).setOrigin(0.5);
      return;
    }

    let y = 120;
    for (const ch of chars) {
      const c = this.makeCharCard(GAME_WIDTH / 2, y, ch);
      this.list.push(c);
      y += 70;
    }
  }

  private makeCharCard(cx: number, cy: number, char: { id: string; name: string; classId: PlayerClass; level: number; mapId: string }) {
    const info = CLASS_INFO[char.classId];
    const container = this.add.container(cx, cy);
    const bg = this.add.rectangle(0, 0, 460, 56, 0x1f2937, 0.9).setStrokeStyle(1, 0x374151);
    container.add(bg);

    const avatar = this.add.circle(-200, 0, 16, info.color).setStrokeStyle(2, 0x000);
    container.add(avatar);

    const nameTxt = this.add.text(-170, -10, `${char.name}  Lv.${char.level}`, {
      fontFamily: 'monospace', fontSize: '16px', color: '#e5e7eb',
    });
    container.add(nameTxt);

    const subTxt = this.add.text(-170, 10, `${info.name} · ${char.mapId}`, {
      fontFamily: 'monospace', fontSize: '12px', color: '#9ca3af',
    });
    container.add(subTxt);

    const enterBtn = this.add.text(160, 0, '进入游戏 →', {
      fontFamily: 'monospace', fontSize: '14px', color: '#60a5fa',
      backgroundColor: '#1e3a8a', padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    enterBtn.on('pointerdown', () => {
      localState.currentCharacterId = char.id;
      this.scene.start('game');
    });
    container.add(enterBtn);

    const delBtn = this.add.text(80, 0, '删除', {
      fontFamily: 'monospace', fontSize: '12px', color: '#f87171',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    delBtn.on('pointerdown', async () => {
      if (!confirm(`确定删除角色 ${char.name}？此操作不可恢复。`)) return;
      try {
        await api.deleteCharacter(char.id);
        await this.refreshList();
      } catch (err) {
        this.statusText.setText(`删除失败: ${(err as Error).message}`).setColor('#f87171');
      }
    });
    container.add(delBtn);

    return container;
  }

  private toggleCreatePanel() {
    if (this.createPanel) {
      this.createPanel.destroy();
      this.createPanel = undefined;
      this.nameInput?.destroy();
      this.nameInput = undefined;
      return;
    }
    const panel = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    const bg = this.add.rectangle(0, 0, 480, 320, 0x111827, 0.98).setStrokeStyle(2, 0x4b5563);
    panel.add(bg);
    panel.add(this.add.text(0, -130, '新建角色', {
      fontFamily: 'monospace', fontSize: '20px', color: '#fbbf24',
    }).setOrigin(0.5));

    panel.add(this.add.text(-200, -80, '角色名', {
      fontFamily: 'monospace', fontSize: '14px', color: '#e5e7eb',
    }).setOrigin(0, 0.5));
    this.nameInput = new TextInput(this, -120, -80, 320, '2-16 位中英文数字', 16);
    // 注意：TextInput 的位置是绝对的，需要相对 panel 偏移
    this.nameInput.bg.setPosition(GAME_WIDTH / 2 - 120, GAME_HEIGHT / 2 - 80);
    this.nameInput.text.setPosition(GAME_WIDTH / 2 - 120 + 8, GAME_HEIGHT / 2 - 80);
    this.nameInput.focus();

    // 职业选择
    panel.add(this.add.text(-200, -30, '职业', {
      fontFamily: 'monospace', fontSize: '14px', color: '#e5e7eb',
    }).setOrigin(0, 0.5));
    const classEntries = Object.values(PlayerClass) as PlayerClass[];
    let cx = -120;
    const classButtons: { button: Phaser.GameObjects.Container; cls: PlayerClass }[] = [];
    for (const cls of classEntries) {
      const info = CLASS_INFO[cls];
      const btn = this.add.container(cx, -30);
      const rect = this.add.rectangle(0, 0, 100, 50, 0x1f2937).setStrokeStyle(1, 0x374151);
      const name = this.add.text(0, -10, info.name, {
        fontFamily: 'monospace', fontSize: '13px', color: '#e5e7eb',
      }).setOrigin(0.5);
      const desc = this.add.text(0, 8, info.desc.slice(0, 8), {
        fontFamily: 'monospace', fontSize: '9px', color: '#9ca3af',
      }).setOrigin(0.5);
      btn.add([rect, name, desc]);
      rect.setInteractive({ useHandCursor: true });
      rect.on('pointerdown', () => {
        this.selectedClass = cls;
        for (const b of classButtons) {
          b.button.getAt(0) as Phaser.GameObjects.Rectangle;
          const r = b.button.getAt(0) as Phaser.GameObjects.Rectangle;
          r.setFillStyle(0x1f2937);
          if (b.cls === cls) {
            r.setFillStyle(info.color, 0.3).setStrokeStyle(2, info.color);
          } else {
            r.setStrokeStyle(1, 0x374151);
          }
        }
      });
      classButtons.push({ button: btn, cls });
      panel.add(btn);
      cx += 110;
    }
    // 默认选中
    (classButtons[0].button.getAt(0) as Phaser.GameObjects.Rectangle).setFillStyle(CLASS_INFO[this.selectedClass].color, 0.3).setStrokeStyle(2, CLASS_INFO[this.selectedClass].color);

    panel.add(this.add.text(0, 30, '职业说明', {
      fontFamily: 'monospace', fontSize: '12px', color: '#9ca3af',
    }).setOrigin(0.5));

    // 创建按钮
    const createBtn = this.add.text(0, 100, '创建并进入', {
      fontFamily: 'monospace', fontSize: '16px', color: '#fff',
      backgroundColor: '#059669', padding: { x: 24, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    createBtn.on('pointerdown', () => this.tryCreate());
    panel.add(createBtn);

    // 取消按钮
    const cancelBtn = this.add.text(0, 140, '取消', {
      fontFamily: 'monospace', fontSize: '12px', color: '#9ca3af',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    cancelBtn.on('pointerdown', () => this.toggleCreatePanel());
    panel.add(cancelBtn);

    this.createPanel = panel;
  }

  private async tryCreate() {
    if (!this.nameInput) return;
    const name = this.nameInput.getValue().trim();
    if (!name) {
      this.statusText.setText('请输入角色名').setColor('#f87171');
      return;
    }
    this.statusText.setText('创建中...').setColor('#9ca3af');
    try {
      const ch = await api.createCharacter(name, this.selectedClass);
      localState.currentCharacterId = ch.id;
      this.scene.start('game');
    } catch (err) {
      this.statusText.setText(`创建失败: ${(err as Error).message}`).setColor('#f87171');
    }
  }

  private makeButton(x: number, y: number, label: string, color: number, onClick: () => void) {
    const text = this.add.text(x, y, label, {
      fontFamily: 'monospace', fontSize: '14px', color: '#fff', padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    const bg = this.add.rectangle(x, y, 140, 30, color, 1).setOrigin(0.5).setDepth(-1);
    text.on('pointerdown', onClick);
    return { text, bg };
  }
}
