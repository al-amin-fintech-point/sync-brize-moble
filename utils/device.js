/**
 * ============================================================================
 * @file        utils/device.js
 * @project     SyncBridge - Multi-Device Mesh Network Architecture
 * @type        Mobile Device Utility
 * @version     1.1.1 (Optimized)
 * @date        2026-06-09
 * @description Generates and persists unique device ID for mobile client
 * using SecureStore for reliable identification.
 * ============================================================================
 */

import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';

/**
 * কাস্টম UUID জেনারেটর - যা React Native এনভায়রনমেন্টে সাপোর্ট করবে
 */
const generateSimpleUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Generates or retrieves a persistent unique device ID
 */
export async function getDeviceId() {
  try {
    // SecureStore থেকে আইডি চেক করা
    let deviceId = await SecureStore.getItemAsync('deviceId');
    
    if (deviceId) {
      console.log('[Device] Existing device ID found:', deviceId);
      return deviceId;
    }

    // নতুন আইডি জেনারেট করা
    const generatedId = 'mobile-' + generateSimpleUUID();
    
    // SecureStore-এ সেভ করা
    await SecureStore.setItemAsync('deviceId', generatedId);
    console.log('[Device] New device ID generated:', generatedId);
    
    return generatedId;
  } catch (error) {
    console.warn('[Device] Error accessing secure storage:', error);
    // এরর হলে ফলব্যাক আইডি
    return 'mobile-' + generateSimpleUUID();
  }
}

/**
 * Retrieves device name for pairing display
 */
export function getDeviceName() {
  return Device.deviceName || 'Mobile Device';
}

/**
 * Clears stored device ID
 */
export async function clearDeviceId() {
  try {
    await SecureStore.deleteItemAsync('deviceId');
    console.log('[Device] Device ID cleared');
  } catch (error) {
    console.warn('[Device] Error clearing device ID:', error);
  }
}