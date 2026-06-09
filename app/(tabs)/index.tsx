import { Text, View, StyleSheet } from "react-native";
import { useSocketConnection } from "../../hooks/useSocketConnection";

export default function Index() {
  const isConnected = useSocketConnection();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SyncBridge Mobile</Text>
      <View style={[styles.statusBox, { backgroundColor: isConnected ? "#4caf50" : "#f44336" }]}>
        <Text style={styles.statusText}>
          {isConnected ? "Connected to Desktop" : "Disconnected"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  statusBox: { padding: 15, borderRadius: 10 },
  statusText: { color: "white", fontWeight: "bold" }
});