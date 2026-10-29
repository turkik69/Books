import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { PushNotifications } from '@capacitor/push-notifications';

const w = window as any;
const isNative = Capacitor.isNativePlatform();
const platform = Capacitor.getPlatform();

async function requestPush() {
  if (!isNative) return { status: 'unsupported' };
  let perms = await PushNotifications.checkPermissions();
  if (perms.receive === 'prompt') perms = await PushNotifications.requestPermissions();
  if (perms.receive !== 'granted') return { status: perms.receive };
  await PushNotifications.register();
  return { status: 'registering' };
}

async function chooseBookImage() {
  if (!isNative) return null;
  const photo = await Camera.getPhoto({
    quality: 86,
    allowEditing: false,
    resultType: CameraResultType.DataUrl,
    source: CameraSource.Prompt,
    width: 1800,
    height: 1800,
    correctOrientation: true
  });
  return photo.dataUrl || null;
}

w.WarraqNative = {
  isNative,
  platform,
  requestPush,
  chooseBookImage
};

if (isNative) {
  PushNotifications.addListener('registration', token => {
    window.dispatchEvent(new CustomEvent('warraq:native-push-token', {
      detail: { token: token.value, platform }
    }));
  });

  PushNotifications.addListener('registrationError', error => {
    window.dispatchEvent(new CustomEvent('warraq:native-push-error', { detail: error }));
  });

  PushNotifications.addListener('pushNotificationReceived', notification => {
    window.dispatchEvent(new CustomEvent('warraq:native-notification', { detail: notification }));
  });

  PushNotifications.addListener('pushNotificationActionPerformed', action => {
    window.dispatchEvent(new CustomEvent('warraq:native-notification-action', { detail: action }));
  });

  App.addListener('appUrlOpen', ({ url }) => {
    window.dispatchEvent(new CustomEvent('warraq:deep-link', { detail: { url } }));
  });
}

window.dispatchEvent(new CustomEvent('warraq:native-ready', { detail: { isNative, platform } }));
