import notifee, {AndroidImportance} from '@notifee/react-native';

export const showNotification = async () => {
  const channelId = await notifee.createChannel({
    id: 'default',
    name: 'Default Channel',
    importance: AndroidImportance.HIGH,
  });

  await notifee.displayNotification({
    title: '🚀 LocaNova',
    body: 'Your notification is working successfully!',
    android: {
      channelId,
      pressAction: {
        id: 'default',
      },
      smallIcon: 'ic_launcher',
    },
  });
};