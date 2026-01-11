import { useEffect, useState } from "react";
import socketService from "../services/socketService";

interface UseSocketOptions {
	role?: "waiter" | "kitchen" | "customer";
	restaurantId?: string;
	tableId?: string;
	autoConnect?: boolean;
}

export const useSocket = (options: UseSocketOptions = {}) => {
	const { role, restaurantId, tableId, autoConnect = true } = options;
	const [isConnected, setIsConnected] = useState(false);

	useEffect(() => {
		if (autoConnect) {
			// Connect to socket server
			socketService.connect();

			// Setup connection listener to join rooms AFTER connected
			const handleConnect = () => {
				console.log("🔌 Socket connected, joining rooms...");

				// Join appropriate rooms after connection is established
				if (role && restaurantId) {
					socketService.joinRoleRoom(role, restaurantId);
				}

				if (tableId) {
					socketService.joinTableRoom(tableId);
				}

				setIsConnected(true);
			};

			const handleDisconnect = () => {
				console.log("🔌 Socket disconnected");
				setIsConnected(false);
			};

			// Listen for connection events
			socketService.onConnect(handleConnect);
			socketService.onDisconnect(handleDisconnect);

			// Check if already connected
			if (socketService.getConnectionStatus()) {
				handleConnect();
			}

			return () => {
				socketService.offConnect(handleConnect);
				socketService.offDisconnect(handleDisconnect);
			};
		}
	}, [role, restaurantId, tableId, autoConnect]);

	const onNewOrder = (callback: (data: any) => void) => {
		socketService.onNewOrder(callback);
	};

	const onOrderAccepted = (callback: (data: any) => void) => {
		socketService.onOrderAccepted(callback);
	};

	const onOrderStatusUpdate = (callback: (data: any) => void) => {
		socketService.onOrderStatusUpdate(callback);
	};

	const disconnect = () => {
		socketService.disconnect();
		setIsConnected(false);
	};

	return {
		isConnected,
		socket: socketService.getSocket(), // Add socket instance
		onNewOrder,
		onOrderAccepted,
		onOrderStatusUpdate,
		disconnect,
		socketService,
	};
};
