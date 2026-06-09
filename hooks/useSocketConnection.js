import { useEffect, useState } from "react";
import { socket } from "../services/socket";

export function useSocketConnection() {
  const [ isConnected, setIsConnected ] = useState( false );

  useEffect( () => {
    socket.on( "connect", () => setIsConnected( true ) );
    socket.on( "disconnect", () => setIsConnected( false ) );

    return () => {
      socket.off( "connect" );
      socket.off( "disconnect" );
    };
  }, [] );

  return isConnected;
}