/**
 * 全局错误上屏与诊断工具。
 *
 * 在 main.ts 中调用 installGlobalErrorHandlers()，
 * 把未捕获异常渲染到页面顶部红色横幅，便于用户/开发者直接看到报错。
 */

let banner: HTMLDivElement | null = null;
let bannerText: HTMLPreElement | null = null;
const seenErrors = new Set<string>();

function ensureBanner(): { el: HTMLDivElement; text: HTMLPreElement } {
  if (banner && bannerText) return { el: banner, text: bannerText };
  banner = document.createElement('div');
  banner.style.cssText =
    'position:fixed;top:0;left:0;right:0;z-index:999999;background:#7f1d1d;color:#fff;' +
    'font:12px/1.5 monospace;padding:8px 12px;white-space:pre-wrap;word-break:break-all;' +
    'max-height:40vh;overflow:auto;border-bottom:2px solid #ef4444;pointer-events:auto;';
  bannerText = document.createElement('pre');
  bannerText.style.cssText = 'margin:0;white-space:pre-wrap;word-break:break-all;';
  banner.appendChild(bannerText);
  document.body.appendChild(banner);
  return { el: banner, text: bannerText };
}

/** 显示一条错误（去重），返回是否首次出现 */
export function reportError(message: string, source = ''): boolean {
  // 保留 console 输出，便于调试
  // eslint-disable-next-line no-console
  console.error(`[mir][${source || 'error'}]`, message);
  const key = `${source}:${message}`;
  const isNew = !seenErrors.has(key);
  if (isNew) {
    seenErrors.add(key);
    if (seenErrors.size > 50) seenErrors.clear();
  }
  const { text } = ensureBanner();
  const prefix = source ? `[${source}] ` : '';
  text.textContent = (text.textContent ? text.textContent + '\n' : '') + prefix + message;
  return isNew;
}

function describe(value: unknown): string {
  if (value instanceof Error) {
    return `${value.name}: ${value.message}\n${value.stack ?? ''}`;
  }
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

/** 安装全局兜底：window error / unhandledrejection */
export function installGlobalErrorHandlers() {
  if (typeof window === 'undefined') return;

  window.addEventListener('error', (e) => {
    reportError(describe(e.error ?? e.message), 'window.error');
  });

  window.addEventListener('unhandledrejection', (e) => {
    reportError(describe(e.reason), 'unhandledrejection');
  });
}
