import { io, Socket } from "socket.io-client";

class SocketService {
	private socket: Socket | null = null;
	private isConnected = false;

	/**
	 * Connect to Socket.IO server
	 */
	connect(): void {
		if (this.isConnected && this.socket) {
			console.log("✅ Socket already connected");
			return;
		}

		const SOCKET_URL =
			(import.meta as any).env?.VITE_API_URL || "http://localhost:5000";

		this.socket = io(SOCKET_URL, {
			transports: ["websocket", "polling"],
			reconnection: true,
			reconnectionAttempts: 5,
			reconnectionDelay: 1000,
		});

		this.socket.on("connect", () => {
			this.isConnected = true;
			console.log("✅ Socket connected:", this.socket?.id);
		});

		this.socket.on("disconnect", (reason) => {
			this.isConnected = false;
			console.log("❌ Socket disconnected:", reason);
		});

		this.socket.on("connect_error", (error) => {
			console.error("❌ Socket connection error:", error);
		});

		// DEBUG: Listen to ALL events
		this.socket.onAny((eventName, ...args) => {
			console.log(`🔥🔥🔥 [SOCKET EVENT] ${eventName}:`, args);
		});
	}

	/**
	 * Disconnect from Socket.IO server
	 */
	disconnect(): void {
		if (this.socket) {
			this.socket.disconnect();
			this.socket = null;
			this.isConnected = false;
			console.log("👋 Socket disconnected manually");
		}
	}

	/**
	 * Join a role-based room (for waiters, kitchen staff)
	 */
	joinRoleRoom(role: string, restaurantId: string): void {
		if (this.socket) {
			this.socket.emit("join:role", { role, restaurantId });
			console.log(`🚪 Joining role room: ${restaurantId}:${role}`);
		} else {
			console.warn("⚠️ Cannot join role room: Socket not initialized");
		}
	}

	/**
	 * Join a table room (for customers)
	 */
	joinTableRoom(tableId: string): void {
		if (this.socket) {
			this.socket.emit("join:table", { tableId });
			console.log(`🪑 Joining table room: ${tableId}`);
		} else {
			console.warn("⚠️ Cannot join table room: Socket not initialized");
		}
	}

	/**
	 * Join an order room
	 */
	joinOrderRoom(orderId: string): void {
		if (this.socket) {
			this.socket.emit("join:order", { orderId });
			console.log(`📋 Joining order room: ${orderId}`);
		} else {
			console.warn("⚠️ Cannot join order room: Socket not initialized");
		}
	}

	/**
	 * Listen for new order events (waiters)
	 */
	onNewOrder(callback: (data: any) => void): void {
		if (this.socket) {
			// Remove old listener first to prevent duplicates
			this.socket.off("order:new");
			this.socket.on("order:new", (data) => {
				console.log("🔥 [SOCKET] Received order:new event:", data);
				callback(data);
			});
			console.log("👂 [SOCKET] Listening for order:new events");
		}
	}

	/**
	 * Listen for order accepted events (kitchen & customers)
	 */
	onOrderAccepted(callback: (data: any) => void): void {
		if (this.socket) {
			// Remove old listener first to prevent duplicates
			this.socket.off("order:accepted");
			this.socket.on("order:accepted", (data) => {
				console.log("🔥 [SOCKET] Received order:accepted event:", data);
				callback(data);
			});
			console.log("👂 [SOCKET] Listening for order:accepted events");
		}
	}

	/**
	 * Listen for order status updates
	 */
	onOrderStatusUpdate(callback: (data: any) => void): void {
		if (this.socket) {
			// Remove old listener first to prevent duplicates
			this.socket.off("order:statusUpdate");
			this.socket.on("order:statusUpdate", (data) => {
				console.log("🔥 [SOCKET] Received order:statusUpdate event:", data);
				callback(data);
			});
			console.log("👂 [SOCKET] Listening for order:statusUpdate events");
		}
	}

	/**
	 * Listen for connect event
	 */
	onConnect(callback: () => void): void {
		if (this.socket) {
			this.socket.on("connect", callback);
		}
	}

	/**
	 * Remove connect listener
	 */
	offConnect(callback: () => void): void {
		if (this.socket) {
			this.socket.off("connect", callback);
		}
	}

	/**
	 * Listen for disconnect event
	 */
	onDisconnect(callback: () => void): void {
		if (this.socket) {
			this.socket.on("disconnect", callback);
		}
	}

	/**
	 * Remove disconnect listener
	 */
	offDisconnect(callback: () => void): void {
		if (this.socket) {
			this.socket.off("disconnect", callback);
		}
	}

	/**
	 * Remove event listener
	 */
	off(event: string, callback?: (...args: any[]) => void): void {
		if (this.socket) {
			this.socket.off(event, callback);
		}
	}

	/**
	 * Get connection status
	 */
	getConnectionStatus(): boolean {
		return this.isConnected;
	}

	/**
	 * Get socket instance (for advanced usage)
	 */
	getSocket(): Socket | null {
		return this.socket;
	}
}

export default new SocketService();
