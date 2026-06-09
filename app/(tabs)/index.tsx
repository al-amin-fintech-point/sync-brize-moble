import { Text, View, StyleSheet, Button, Alert, TouchableOpacity, ScrollView, Modal, TextInput } from "react-native";
import { Link } from 'expo-router';
import * as Clipboard from "expo-clipboard";
import { useSocketConnection } from "../../hooks/useSocketConnection";
import { socket } from "../../services/socket";
import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";

type IncomingRequest = {
  fromDeviceId: string;
  fromDeviceName: string;
} | null;

export default function Index() {
  const {
    isConnected,
    deviceId,
    pairedDevices,
    incomingRequest,
    generatedPin,
    pairError,
    acceptPairRequest,
    rejectPairRequest,
    disconnectPair
  } = useSocketConnection() as any; // Cast for now given the mixed JS/TS setup

  const [pinInput, setPinInput] = useState("");

  const handleSyncClipboard = async () => {
    const text = await Clipboard.getStringAsync();
    if (text) {
      socket.emit("sync-clipboard", { text });
      Alert.alert("Success", "Clipboard synced to all paired devices!");
    } else {
      Alert.alert("Empty", "Nothing to sync!");
    }
  };

  const pairedDeviceCount = Object.keys(pairedDevices).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>S</Text>
        </View>
        <View>
          <Text style={styles.headerTitle}>SyncBridge</Text>
          <Text style={styles.headerSubtitle}>High-Performance Mesh Network</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Connection Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusInfo}>
            <Text style={styles.statusLabel}>Network Status</Text>
            <View style={styles.statusIndicatorRow}>
              <View style={[styles.dot, { backgroundColor: isConnected ? "#10b981" : "#ef4444" }]} />
              <Text style={[styles.statusValue, { color: isConnected ? "#10b981" : "#ef4444" }]}>
                {isConnected ? "Online" : "Offline"}
              </Text>
            </View>
          </View>
          <View style={[styles.statusInfo, { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.1)', paddingLeft: 20 }]}>
            <Text style={styles.statusLabel}>Secure Pairs</Text>
            <Text style={styles.statusValue}>{pairedDeviceCount} Device{pairedDeviceCount === 1 ? '' : 's'}</Text>
          </View>
        </View>

        {/* Device ID Card */}
        <View style={styles.deviceIdCard}>
          <Text style={styles.label}>MOBILE DEVICE ID</Text>
          <Text style={styles.deviceIdText}>{deviceId || "Loading..."}</Text>
        </View>

        {/* Actions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Network Actions</Text>
          
          <View style={styles.actionGrid}>
            <Link href="/qr-scanner" asChild>
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#6366f1' }]}>
                <Ionicons name="scan-outline" size={24} color="white" />
                <Text style={styles.actionButtonText}>Scan QR</Text>
              </TouchableOpacity>
            </Link>

            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#10b981', opacity: pairedDeviceCount > 0 ? 1 : 0.5 }]} 
              onPress={handleSyncClipboard}
              disabled={pairedDeviceCount === 0}
            >
              <Ionicons name="copy-outline" size={24} color="white" />
              <Text style={styles.actionButtonText}>Sync Clip</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Paired Devices List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Mesh Nodes</Text>
          {pairedDeviceCount === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="wifi-outline" size={48} color="#475569" />
              <Text style={styles.emptyText}>No secure connections established.</Text>
            </View>
          ) : (
            Object.entries(pairedDevices).map(([id, roomId]) => (
              <View key={id} style={styles.deviceRow}>
                <View style={styles.deviceInfo}>
                  <Ionicons name="laptop-outline" size={24} color="#6366f1" />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.deviceName}>Desktop Peer</Text>
                    <Text style={styles.deviceSubId}>{id}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => disconnectPair(id)} style={styles.unpairBtn}>
                  <Ionicons name="close-circle-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Incoming Request Modal */}
      <Modal visible={!!incomingRequest} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="shield-checkmark-outline" size={48} color="#6366f1" />
            <Text style={styles.modalTitle}>Incoming Bridge Connection</Text>
            <Text style={styles.modalSubtitle}>
              <Text style={{ fontWeight: '700', color: '#fff' }}>{incomingRequest?.fromDeviceName}</Text> wants to bridge with you.
            </Text>
            
            <TextInput
              style={styles.pinInput}
              placeholder="Enter 4-digit PIN"
              placeholderTextColor="#64748b"
              keyboardType="number-pad"
              maxLength={4}
              value={pinInput}
              onChangeText={setPinInput}
              secureTextEntry
            />

            {pairError && <Text style={styles.errorText}>{pairError}</Text>}

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.primaryBtn]} 
                onPress={() => { acceptPairRequest(pinInput); setPinInput(""); }}
              >
                <Text style={styles.buttonText}>Authenticate</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.secondaryBtn]} 
                onPress={() => { rejectPairRequest(); setPinInput(""); }}
              >
                <Text style={[styles.buttonText, { color: '#94a3b8' }]}>Decline</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* PIN Generated Modal */}
      <Modal visible={!!generatedPin} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="key-outline" size={48} color="#6366f1" />
            <Text style={styles.modalTitle}>Verification Required</Text>
            <Text style={styles.modalSubtitle}>Enter this PIN on the target device to establish the bridge.</Text>
            
            <View style={styles.pinDisplay}>
              <Text style={styles.pinText}>{generatedPin}</Text>
            </View>

            <TouchableOpacity 
              style={[styles.modalButton, styles.secondaryBtn, { marginTop: 20 }]} 
              onPress={rejectPairRequest}
            >
              <Text style={[styles.buttonText, { color: '#94a3b8' }]}>Cancel Request</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)'
  },
  logoContainer: {
    width: 45,
    height: 45,
    backgroundColor: '#6366f1',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  logoText: { color: 'white', fontSize: 24, fontWeight: '800' },
  headerTitle: { color: 'white', fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  headerSubtitle: { color: '#94a3b8', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  
  statusCard: { 
    flexDirection: 'row', 
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 20
  },
  statusInfo: { flex: 1 },
  statusLabel: { color: '#94a3b8', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', marginBottom: 5 },
  statusIndicatorRow: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusValue: { color: 'white', fontSize: 16, fontWeight: '700' },
  
  deviceIdCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(99,102,241,0.3)',
    marginBottom: 30
  },
  label: { color: '#6366f1', fontSize: 10, fontWeight: '800', marginBottom: 5 },
  deviceIdText: { color: '#94a3b8', fontSize: 13, fontFamily: 'monospace' },

  section: { marginBottom: 30 },
  sectionTitle: { color: 'white', fontSize: 18, fontWeight: '700', marginBottom: 15 },
  
  actionGrid: { flexDirection: 'row', gap: 15 },
  actionButton: { 
    flex: 1, 
    flexDirection: 'row',
    height: 60, 
    borderRadius: 15, 
    justifyContent: 'center', 
    alignItems: 'center',
    gap: 10
  },
  actionButtonText: { color: 'white', fontWeight: '700', fontSize: 15 },

  emptyState: { alignItems: 'center', padding: 40, borderStyle: 'dotted', borderWidth: 1, borderColor: '#334155', borderRadius: 20 },
  emptyText: { color: '#64748b', marginTop: 15, textAlign: 'center', fontSize: 14 },

  deviceRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    padding: 15,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  deviceInfo: { flexDirection: 'row', alignItems: 'center' },
  deviceName: { color: 'white', fontSize: 16, fontWeight: '600' },
  deviceSubId: { color: '#64748b', fontSize: 11, fontFamily: 'monospace' },
  unpairBtn: { padding: 5 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.9)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1e293b', borderRadius: 24, padding: 30, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  modalTitle: { color: 'white', fontSize: 20, fontWeight: '800', marginTop: 20, marginBottom: 10 },
  modalSubtitle: { color: '#94a3b8', textAlign: 'center', fontSize: 14, lineHeight: 20, marginBottom: 25 },
  
  pinInput: { 
    width: '100%', 
    height: 60, 
    backgroundColor: '#0f172a', 
    borderRadius: 15, 
    textAlign: 'center', 
    color: 'white', 
    fontSize: 24, 
    letterSpacing: 10,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 10
  },
  errorText: { color: '#ef4444', fontSize: 13, fontWeight: '600', marginBottom: 20 },
  
  pinDisplay: { 
    backgroundColor: 'rgba(99,102,241,0.1)', 
    padding: 20, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderStyle: 'dashed', 
    borderColor: '#6366f1',
    width: '100%',
    alignItems: 'center'
  },
  pinText: { color: '#6366f1', fontSize: 42, fontWeight: '800', letterSpacing: 15 },

  modalActions: { width: '100%', gap: 10 },
  modalButton: { height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  primaryBtn: { backgroundColor: '#6366f1' },
  secondaryBtn: { borderWidth: 1, borderColor: 'rgba(148,163,184,0.2)' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '700' }
});