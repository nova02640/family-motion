import { getItem } from '@mir/shared';

/** 任务定义 */
export interface TaskDef {
  id: string;
  title: string;
  description: string;
  targetMonsterId: string;
  targetCount: number;
  rewardType: 'gold' | 'item';
  rewardGold?: number;
  rewardItemId?: string;
  rewardCount?: number;
}

export const TASKS: TaskDef[] = [
  {
    id: 'kill_chickens',
    title: '清理鸡群',
    description: '击杀 5 只鸡',
    targetMonsterId: 'chicken',
    targetCount: 5,
    rewardType: 'gold',
    rewardGold: 50,
  },
  {
    id: 'kill_skeletons',
    title: '骷髅的威胁',
    description: '击杀 3 只骷髅',
    targetMonsterId: 'skeleton',
    targetCount: 3,
    rewardType: 'item',
    rewardItemId: 'iron_sword',
    rewardCount: 1,
  },
  {
    id: 'kill_zombie',
    title: '清除僵尸',
    description: '击杀 1 只僵尸',
    targetMonsterId: 'zombie',
    targetCount: 1,
    rewardType: 'item',
    rewardItemId: 'light_armor',
    rewardCount: 1,
  },
];

/** 任务对外展示状态 */
export interface TaskState {
  id: string;
  title: string;
  description: string;
  targetCount: number;
  current: number;
  done: boolean;
  rewardLabel: string;
}

export function rewardLabel(t: TaskDef): string {
  if (t.rewardType === 'gold') return `${t.rewardGold} 金币`;
  const item = getItem(t.rewardItemId ?? '');
  return `${item?.name ?? t.rewardItemId} x${t.rewardCount ?? 1}`;
}
