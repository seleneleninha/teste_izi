console.log("OneSignal Updater: Loading local SDK script...");
try {
    importScripts('./OneSignalSDK.sw.js');
} catch (e) {
    console.error("OneSignal Updater: importScripts failed!", e);
}
