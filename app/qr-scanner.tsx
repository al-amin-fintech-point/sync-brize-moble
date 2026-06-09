import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { socket } from '../services/socket';
import { useRouter } from 'expo-router';
import { getDeviceId } from '../utils/device';

export default function QrScanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    requestPermission();
    getDeviceId().then(id => setDeviceId(id));
  }, [requestPermission]);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned || !deviceId) return;
    setScanned(true);

    console.log("[QrScanner] Scanned device ID:", data);
    
    socket.emit("send-pair-request", { 
      fromDeviceId: deviceId,
      toDeviceId: data 
    });

    Alert.alert("Request Sent", "Pair request sent to desktop. Please check your desktop screen.");
    router.back();
  };

  if (!permission) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#6366f1" />
    </View>
  );

  if (!permission.granted) return (
    <View style={styles.center}>
      <Text style={styles.errorText}>Camera permission is required to scan QR codes.</Text>
      <Text style={[styles.errorText, { fontSize: 14, marginTop: 10 }]} onPress={() => requestPermission()}>
        Tap here to request permission
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      />
      <View style={styles.overlay}>
        <View style={styles.scanFrame} />
        <Text style={styles.instructions}>Scan the QR code on your SyncBridge Desktop App</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { color: "#f44336", fontSize: 18, textAlign: 'center', fontWeight: '600' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#6366f1',
    backgroundColor: 'transparent',
    borderRadius: 20,
  },
  instructions: {
    color: 'white',
    marginTop: 30,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 40,
  }
});