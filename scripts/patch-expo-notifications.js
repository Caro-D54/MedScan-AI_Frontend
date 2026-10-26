const fs = require('fs');
const path = require('path');

// 1. TopicSubscriptionModule patch (ExpoTopicSubscriptionModule missing in Expo Go)
const topicFiles = [
  path.join(__dirname, '..', 'node_modules', 'expo-notifications', 'build', 'TopicSubscriptionModule.android.js'),
  path.join(__dirname, '..', 'node_modules', 'expo-notifications', 'src', 'TopicSubscriptionModule.android.ts'),
];

const topicReplacement = `import { requireOptionalNativeModule } from 'expo';

const fallback = {
  addListener: () => {},
  removeListeners: () => {},
  subscribeToTopicAsync: () => Promise.resolve(null),
  unsubscribeFromTopicAsync: () => Promise.resolve(null),
};

export default requireOptionalNativeModule('ExpoTopicSubscriptionModule') ?? fallback;
`;

let patchedCount = 0;

for (const filePath of topicFiles) {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes("requireNativeModule('ExpoTopicSubscriptionModule')") ||
        content.includes("requireNativeModule<TopicSubscriptionModule>('ExpoTopicSubscriptionModule')")) {
      fs.writeFileSync(filePath, topicReplacement, 'utf8');
      patchedCount++;
    }
  }
}

// 2. setNotificationChannelAsync patch (Catch NullPointerException in Expo Go Android)
const channelBuildFile = path.join(__dirname, '..', 'node_modules', 'expo-notifications', 'build', 'setNotificationChannelAsync.android.js');
if (fs.existsSync(channelBuildFile)) {
  const content = fs.readFileSync(channelBuildFile, 'utf8');
  const target = `    return await NotificationChannelManager.setNotificationChannelAsync(channelId, channel);`;
  const safeReturn = `    try {
        return await NotificationChannelManager.setNotificationChannelAsync(channelId, channel);
    } catch (error) {
        if (error && String(error).includes('NullPointerException')) {
            return {
                id: channelId,
                name: channel?.name ?? null,
                importance: channel?.importance ?? 5,
                bypassDnd: false,
                description: null,
                groupId: null,
                lightColor: '#000000',
                lockscreenVisibility: 1,
                showBadge: true,
                sound: null,
                audioAttributes: {},
                vibrationPattern: null,
                enableLights: false,
                enableVibrate: false,
            };
        }
        throw error;
    }`;
  if (content.includes(target) && !content.includes('// [safe-expo-go-channel]')) {
    const patchedContent = content.replace(target, safeReturn + '\n    // [safe-expo-go-channel]');
    fs.writeFileSync(channelBuildFile, patchedContent, 'utf8');
    patchedCount++;
  }
}

if (patchedCount > 0) {
  console.log(`[patch-expo-notifications] Successfully applied compatibility patches (${patchedCount} file(s)).`);
}
