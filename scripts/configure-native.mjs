import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const plist = new URL('../ios/App/App/Info.plist', import.meta.url);
if (existsSync(plist)) {
  let text = await readFile(plist, 'utf8');
  const entries = [
    ['NSCameraUsageDescription','يستخدم ورّاق الكاميرا لتصوير الكتب التي تريد عرضها للبيع.'],
    ['NSPhotoLibraryUsageDescription','يستخدم ورّاق مكتبة الصور لاختيار صور الكتب.'],
    ['NSPhotoLibraryAddUsageDescription','يسمح ورّاق بحفظ الصور التي ينشئها المستخدم عند الحاجة.']
  ];
  for (const [key,value] of entries) {
    if (!text.includes('<key>'+key+'</key>')) {
      text = text.replace('</dict>', '  <key>'+key+'</key>\n  <string>'+value+'</string>\n</dict>');
    }
  }
  await writeFile(plist, text);
}

const appDelegate = new URL('../ios/App/App/AppDelegate.swift', import.meta.url);
if (existsSync(appDelegate)) {
  let text = await readFile(appDelegate, 'utf8');
  if (!text.includes('capacitorDidRegisterForRemoteNotifications')) {
    const block = `
    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        NotificationCenter.default.post(name: .capacitorDidRegisterForRemoteNotifications, object: deviceToken)
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        NotificationCenter.default.post(name: .capacitorDidFailToRegisterForRemoteNotifications, object: error)
    }
`;
    text = text.replace(/\n}\s*$/, block + '\n}\n');
    await writeFile(appDelegate, text);
  }
}
console.log('Native platform privacy descriptions and push hooks configured.');
