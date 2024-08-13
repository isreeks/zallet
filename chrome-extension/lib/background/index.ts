import 'webextension-polyfill';
import { exampleThemeStorage } from '@extension/storage';
import { clearSession } from '@extension/storage/lib/session';

exampleThemeStorage.get().then(theme => {
  console.log('theme', theme);
});

const ALARM_NAME = 'sessionTimeout';

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === ALARM_NAME) {
    chrome.storage.local.get('myKeyId', result => {
      if (result.myKeyId) {
        clearSession(result.activeSession);
        clearSessionTimer();
      }
    });
  }
});

// Clear the alarm when clearing a session
function clearSessionTimer() {
  chrome.alarms.clear(ALARM_NAME);
  chrome.storage.local.remove('myKeyId');
}

// Handle the alarm event

console.log('background loaded');
console.log("Edit 'chrome-extension/lib/background/index.ts' and save to reload.");
