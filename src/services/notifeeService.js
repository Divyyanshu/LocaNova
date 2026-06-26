import notifee, {
  AndroidImportance,
  AuthorizationStatus,
} from '@notifee/react-native';

export const showNotification = async () => {
  try {
    console.log('==============================');
    console.log('Notification Function Started');

    // Permission
    const settings = await notifee.requestPermission();
    console.log('Permission Status:', settings.authorizationStatus);

    if (
      settings.authorizationStatus === AuthorizationStatus.DENIED
    ) {
      console.log('Notification Permission Denied');
      return;
    }

    // Create Channel
    const channelId = await notifee.createChannel({
      id: 'default',
      name: 'Default Channel',
      importance: AndroidImportance.HIGH,
    });

    console.log('Channel Created:', channelId);
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

    console.log('Notification Displayed Successfully');
    console.log('==============================');
  } catch (error) {
    console.log('Notification Error');
    console.log(error);
    console.log(JSON.stringify(error, null, 2));
  }
};