// Native bridge: exposes window.SalahNative so the page can schedule real
// Android notifications that fire even when the app is closed.
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Geolocation } from "@capacitor/geolocation";

const START_CH = "salah-start";
const URGENT_CH = "salah-urgent";
const START_SOUND = "prayer_start.wav";
const URGENT_SOUND = "urgent_reminder.wav";

async function ensureChannels() {
  try {
    await LocalNotifications.createChannel({
      id: START_CH,
      name: "Prayer time started",
      description: "A soft chime when a prayer window opens",
      importance: 5,
      visibility: 1,
      vibration: true,
      sound: START_SOUND,
    });
    await LocalNotifications.createChannel({
      id: URGENT_CH,
      name: "Prayer ending soon",
      description: "Louder alerts shortly before a prayer window ends",
      importance: 5,
      visibility: 1,
      vibration: true,
      sound: URGENT_SOUND,
    });
    try { await LocalNotifications.deleteChannel({ id: "salah-reminders" }); } catch (e) {}
  } catch (e) {}
}

function toNotification(i) {
  return {
    id: i.id,
    title: i.title,
    body: i.body,
    channelId: i.urgent ? URGENT_CH : START_CH,
    sound: i.urgent ? URGENT_SOUND : START_SOUND,
    smallIcon: "ic_stat_salah",
    schedule: { at: new Date(i.at), allowWhileIdle: true },
  };
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
      if (p.display === "granted") await ensureChannels();
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

  // items: [{ id:int, title, body, at:ms, urgent:bool }]  (replaces everything scheduled before)
  async scheduleAll(items) {
    try {
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display !== "granted") return false;
      await ensureChannels();
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length) {
        await LocalNotifications.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) });
      }
      const now = Date.now();
      const list = items.filter((i) => i.at > now + 2000).map(toNotification);
      if (list.length) await LocalNotifications.schedule({ notifications: list });
      return true;
    } catch (e) { return false; }
  },

  async testNow(urgent) {
    try {
      await ensureChannels();
      await LocalNotifications.schedule({
        notifications: [toNotification({
          id: urgent ? 999998 : 999999,
          title: urgent ? "🚨 Last chance for Asr!" : "Test reminder 🕌",
          body: urgent ? "Only 5 min left! Salah time is almost over, pray right now!" : "This is how your Salah reminders will look.",
          at: Date.now() + 3000,
          urgent: !!urgent,
        })],
      });
      return true;
    } catch (e) { return false; }
  },

  // Approximate location (coarse) for prayer times.
  async getPosition() {
    const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: 20000, maximumAge: 600000 });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  },

  async openUrl(url) {
    try { await Browser.open({ url }); return true; } catch (e) { return false; }
  },

  onResume(fn) {
    try { App.addListener("resume", fn); } catch (e) {}
  },
};
