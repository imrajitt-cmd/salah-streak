// Native bridge: exposes window.SalahNative so the page can schedule real
// Android notifications that fire even when the app is closed.
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";

const CHANNEL = "salah-reminders";

async function ensureChannel() {
  try {
    await LocalNotifications.createChannel({
      id: CHANNEL,
      name: "Salah reminders",
      description: "Prayer start and ending-soon reminders",
      importance: 5,
      visibility: 1,
      vibration: true,
    });
  } catch (e) {}
}

window.SalahNative = {
  isNative: Capacitor.isNativePlatform(),

  async permission() {
    try {
      const p = await LocalNotifications.checkPermissions();
      return p.display; // 'granted' | 'denied' | 'prompt' ...
    } catch (e) { return "denied"; }
  },

  async requestPermission() {
    try {
      const p = await LocalNotifications.requestPermissions();
      if (p.display === "granted") await ensureChannel();
      return p.display;
    } catch (e) { return "denied"; }
  },

  async exactAllowed() {
    try {
      const r = await LocalNotifications.checkExactNotificationSetting();
      return r.exact_alarm === "granted";
    } catch (e) { return true; }
  },

  async openExactSettings() {
    try { await LocalNotifications.changeExactNotificationSetting(); } catch (e) {}
  },

  // items: [{ id:int, title, body, at:ms }]  (replaces everything scheduled before)
  async scheduleAll(items) {
    try {
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display !== "granted") return false;
      await ensureChannel();
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length) {
        await LocalNotifications.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) });
      }
      const now = Date.now();
      const list = items
        .filter((i) => i.at > now + 2000)
        .map((i) => ({
          id: i.id,
          title: i.title,
          body: i.body,
          channelId: CHANNEL,
          smallIcon: "ic_stat_salah",
          schedule: { at: new Date(i.at), allowWhileIdle: true },
        }));
      if (list.length) await LocalNotifications.schedule({ notifications: list });
      return true;
    } catch (e) { return false; }
  },

  async testNow() {
    try {
      await ensureChannel();
      await LocalNotifications.schedule({
        notifications: [{
          id: 999999,
          title: "Test reminder 🕌",
          body: "This is how your Salah reminders will look.",
          channelId: CHANNEL,
          smallIcon: "ic_stat_salah",
          schedule: { at: new Date(Date.now() + 3000), allowWhileIdle: true },
        }],
      });
      return true;
    } catch (e) { return false; }
  },

  async openUrl(url) {
    try { await Browser.open({ url }); return true; } catch (e) { return false; }
  },

  onResume(fn) {
    try { App.addListener("resume", fn); } catch (e) {}
  },
};
