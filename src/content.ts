interface SiteSettings {
  [hostname: string]: boolean;
}

interface StorageData {
  invertEnabled?: boolean;
  siteSettings?: SiteSettings;
}

const STORAGE_KEY = 'invertEnabled';
const SITE_KEY = 'siteSettings';

function isLightBackground(): boolean {
  const body = document.body;
  const bgColor = window.getComputedStyle(body).backgroundColor;

  if (!bgColor || bgColor === 'transparent' || bgColor === 'rgba(0, 0, 0, 0)') {
    return true;
  }

  const rgb = bgColor.match(/\d+/g);
  if (!rgb || rgb.length < 3) return true;

  const [r, g, b] = rgb.map(Number);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  return brightness > 200;
}

function applyInversion(): void {
  if (!document.getElementById('auto-dark-mode-filter')) {
    const style = document.createElement('style');
    style.id = 'auto-dark-mode-filter';
    style.textContent = `
      html {
        filter: invert(1) hue-rotate(180deg) !important;
        background: #111 !important;
      }
      img, video, iframe, canvas, embed, object, svg {
        filter: invert(1) hue-rotate(180deg) !important;
      }
      [style*="background-image"] {
        filter: invert(1) hue-rotate(180deg) !important;
      }
    `;
    document.head.appendChild(style);
  }
}

function removeInversion(): void {
  const style = document.getElementById('auto-dark-mode-filter');
  if (style) {
    style.remove();
  }
}

function checkAndApply(): void {
  const hostname = window.location.hostname;

  chrome.storage.sync.get([STORAGE_KEY, SITE_KEY], (result: StorageData) => {
    const globalEnabled = result.invertEnabled !== false;
    const siteSettings = result.siteSettings || {};

    const siteEnabled = siteSettings[hostname];

    let shouldInvert = false;

    if (siteEnabled !== undefined) {
      shouldInvert = siteEnabled;
    } else if (globalEnabled) {
      shouldInvert = isLightBackground();
    }

    if (shouldInvert) {
      applyInversion();
    } else {
      removeInversion();
    }
  });
}

checkAndApply();

chrome.storage.onChanged.addListener((changes) => {
  if (changes[STORAGE_KEY] || changes[SITE_KEY]) {
    checkAndApply();
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggleSite') {
    checkAndApply();
  } else if (request.action === 'getStatus') {
    const isInverted = !!document.getElementById('auto-dark-mode-filter');
    const isLight = isLightBackground();
    sendResponse({ isInverted, isLight });
  }
});

export {};