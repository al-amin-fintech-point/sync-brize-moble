import { useEffect, useState, useCallback } from "react";
import * as Clipboard from "expo-clipboard";
import { socket } from "../services/socket";
import { getDeviceId, getDeviceName } from "../utils/device";

/**
 * Hook: Socket Connection & Device Registration
 * 
 * Responsibilities:
 * 1. Establish connection to Socket.io server
 * 2. Auto-register mobile device on connect
 * 3. Listen for clipboard sync events
 * 4. Handle pairing lifecycle events (PIN handshakes)
 */
export function useSocketConnection() {
  const [isConnected, setIsConnected] = useState(false);
  const [deviceId, setDeviceId] = useState(null);
  const [pairedDevices, setPairedDevices] = useState({});
  const [incomingRequest, setIncomingRequest] = useState(null);
  const [generatedPin, setGeneratedPin] = useState(null);
  const [pairError, setPairError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const initializeConnection = async () => {
      try {
        const id = await getDeviceId();
        if (!isMounted) return;
        
        setDeviceId(id);
        console.log("[useSocketConnection] Device ID loaded:", id);

        const handleConnect = () => {
          if (!isMounted) return;
          console.log("[useSocketConnection] Connected to server:", socket.id);
          
          socket.emit("register-device", {
            deviceId: id,
            deviceName: getDeviceName() || "Mobile Device",
            deviceType: "mobile"
          });
          
          setIsConnected(true);
        };

        const handleClipboardSync = async (data) => {
          console.log("[useSocketConnection] Clipboard sync received:", data.text);
          try {
            await Clipboard.setStringAsync(data.text);
          } catch (error) {
            console.error("[useSocketConnection] Failed to set clipboard:", error);
          }
        };

        const handlePairPinGenerated = (data) => {
          console.log("[useSocketConnection] PIN Generated:", data.pin);
          setGeneratedPin(data.pin);
          setPairError(null);
        };

        const handlePairSuccess = (data) => {
          console.log("[useSocketConnection] Pairing successful!", data.pairedDevices);
          setPairedDevices(data.pairedDevices || {});
          setIncomingRequest(null);
          setGeneratedPin(null);
          setPairError(null);
        };

        const handlePairError = (data) => {
          console.error("[useSocketConnection] Pairing failed:", data.message);
          setPairError(data.message);
        };

        const handleReceivePairRequest = (data) => {
          console.log("[useSocketConnection] Pair request received:", data);
          setIncomingRequest(data);
        };

        const handlePairCanceled = () => {
          console.log("[useSocketConnection] Pair request canceled");
          setIncomingRequest(null);
          setGeneratedPin(null);
        };

        const handleUnpairSuccess = (data) => {
          console.log("[useSocketConnection] Unpair successful!");
          setPairedDevices(data.pairedDevices || {});
        };

        const handleDisconnect = () => {
          console.log("[useSocketConnection] Disconnected from server");
          setIsConnected(false);
          setIncomingRequest(null);
          setGeneratedPin(null);
        };

        // Attach listeners
        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("receive-clipboard-sync", handleClipboardSync);
        socket.on("pair-pin-generated", handlePairPinGenerated);
        socket.on("pair-success", handlePairSuccess);
        socket.on("pair-error", handlePairError);
        socket.on("receive-pair-request", handleReceivePairRequest);
        socket.on("pair-canceled", handlePairCanceled);
        socket.on("unpair-success", handleUnpairSuccess);

        if (socket.connected) {
          handleConnect();
        }

        return () => {
          isMounted = false;
          socket.off("connect", handleConnect);
          socket.off("disconnect", handleDisconnect);
          socket.off("receive-clipboard-sync", handleClipboardSync);
          socket.off("pair-pin-generated", handlePairPinGenerated);
          socket.off("pair-success", handlePairSuccess);
          socket.off("pair-error", handlePairError);
          socket.off("receive-pair-request", handleReceivePairRequest);
          socket.off("pair-canceled", handlePairCanceled);
          socket.off("unpair-success", handleUnpairSuccess);
        };
      } catch (error) {
        console.error("[useSocketConnection] Initialization error:", error);
      }
    };

    initializeConnection();

    return () => {
      isMounted = false;
    };
  }, []);

  const sendPairRequest = useCallback((targetDeviceId) => {
    if (!deviceId) return;
    socket.emit("send-pair-request", {
      fromDeviceId: deviceId,
      toDeviceId: targetDeviceId
    });
  }, [deviceId]);

  const acceptPairRequest = useCallback((pin) => {
    if (!incomingRequest || !deviceId) return;
    socket.emit("accept-pair-request", {
      requesterId: incomingRequest.fromDeviceId,
      accepterId: deviceId,
      enteredPin: pin
    });
  }, [incomingRequest, deviceId]);

  const rejectPairRequest = useCallback(() => {
    if (!incomingRequest && !generatedPin) return;
    socket.emit("cancel-pair-request", {
      requesterId: generatedPin ? deviceId : incomingRequest.fromDeviceId
    });
    setIncomingRequest(null);
    setGeneratedPin(null);
  }, [incomingRequest, generatedPin, deviceId]);

  const disconnectPair = useCallback((targetId) => {
    if (!deviceId) return;
    socket.emit("disconnect-pair", {
      requesterId: deviceId,
      targetId: targetId
    });
  }, [deviceId]);

  return {
    isConnected,
    deviceId,
    pairedDevices,
    incomingRequest,
    generatedPin,
    pairError,
    sendPairRequest,
    acceptPairRequest,
    rejectPairRequest,
    disconnectPair
  };
}