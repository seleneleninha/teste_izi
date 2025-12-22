console.log("OneSignal Worker: Loading local SDK script...");
try {
    importScripts('./OneSignalSDK.sw.js');
} catch (e) {
    console.error("OneSignal Worker: importScripts failed!", e);
}
