interface SiteSettings {
  [hostname: string]: boolean;
}

interface StatusResponse {
  isInverted: boolean;
  isLight: boolean;
}

const STORAGE_KEY = 'invertEnabled';
const SITE_KEY = 'siteSettings';

const globalToggle = document.getElementById('globalToggle') as HTMLInputElement;
const siteToggle = document.getElementById('siteToggle') as HTMLInputElement;
const statusDiv = document.getElementById('status') as HTMLDivElement;

let currentHostname = '';

async function getCurrentTab(): Promise<chrome.tabs.Tab | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab || null;
}

async function updateStatus(): Promise<void> {
  const tab = await getCurrentTab();
  if (!tab || !tab.id || !tab.url) {
    statusDiv.textContent = 'No active tab';
    return;
  }

  try {
    const url = new URL(tab.url);
    currentHostname = url.hostname;

    chrome.tabs.sendMessage(tab.id, { action: 'getStatus' }, (response: StatusResponse) => {
      if (chrome.runtime.lastError) {
        statusDiv.textContent = 'Cannot access this page';
        statusDiv.classList.remove('inverted');
        globalToggle.disabled = true;
        siteToggle.disabled = true;
        return;
      }

      if (response.isInverted) {
        statusDiv.textContent = '🌙 Dark mode active';
        statusDiv.classList.add('inverted');
      } else if (response.isLight) {
        statusDiv.textContent = '☀️ Light background detected';
        statusDiv.classList.remove('inverted');
      } else {
        statusDiv.textContent = '🌙 Dark background detected';
        statusDiv.classList.remove('inverted');
      }
    });
  } catch (e) {
    statusDiv.textContent = 'Invalid URL';
    globalToggle.disabled = true;
    siteToggle.disabled = true;
  }
}

async function loadSettings(): Promise<void> {
  chrome.storage.sync.get([STORAGE_KEY, SITE_KEY], (result) => {
    globalToggle.checked = result[STORAGE_KEY] !== false;

    const siteSettings = result[SITE_KEY] || {};
    const siteSetting = siteSettings[currentHostname];

    if (siteSetting !== undefined) {
      siteToggle.checked = siteSetting;
    } else {
      siteToggle.checked = false;
    }
  });
}

globalToggle.addEventListener('change', () => {
  chrome.storage.sync.set({ [STORAGE_KEY]: globalToggle.checked }, async () => {
    const tab = await getCurrentTab();
    if (tab && tab.id) {
      chrome.tabs.sendMessage(tab.id, { action: 'toggleSite' });
      setTimeout(updateStatus, 100);
    }
  });
});

siteToggle.addEventListener('change', () => {
  chrome.storage.sync.get([SITE_KEY], (result) => {
    const siteSettings = result[SITE_KEY] || {};

    if (siteToggle.checked) {
      siteSettings[currentHostname] = true;
    } else {
      delete siteSettings[currentHostname];
    }

    chrome.storage.sync.set({ [SITE_KEY]: siteSettings }, async () => {
      const tab = await getCurrentTab();
      if (tab && tab.id) {
        chrome.tabs.sendMessage(tab.id, { action: 'toggleSite' });
        setTimeout(updateStatus, 100);
      }
    });
  });
});

updateStatus();
loadSettings();