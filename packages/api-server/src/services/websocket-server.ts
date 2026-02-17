/**
 * WebSocket Server
 *
 * Manages WebSocket connections, game subscriptions, and event broadcasting
 * for real-time game state synchronization.
 *
 * @req API-002 - WebSocket events for real-time updates
 * @req API-002.6 - Subscribe to game channel
 * @req API-002.7 - Set narration preference
 */

import type WebSocket from 'ws';
import type {
  WebSocketMessage,
  WebSocketEventType,
  SubscribeEvent,
  SetNarrationEvent,
  ErrorEvent,
} from '../types/api';

/**
 * Metadata tracked per connected WebSocket client
 */
interface ClientInfo {
  /** Game IDs this client is subscribed to */
  subscribedGames: Set<string>;
  /** Whether narration is enabled for this client */
  narrationEnabled: boolean;
}

/**
 * WebSocket Server for real-time game event broadcasting.
 *
 * Manages client connections, game channel subscriptions, and
 * broadcasting events to subscribed clients.
 */
export class WebSocketServer {
  /** Connected clients and their metadata */
  private clients: Map<WebSocket, ClientInfo> = new Map();
  /** Game channels: gameId -> set of subscribed clients */
  private gameChannels: Map<string, Set<WebSocket>> = new Map();

  /**
   * Register a new WebSocket connection
   */
  handleConnection(ws: WebSocket): void {
    this.clients.set(ws, {
      subscribedGames: new Set(),
      narrationEnabled: true,
    });
  }

  /**
   * Handle client disconnection and clean up subscriptions
   */
  handleDisconnection(ws: WebSocket): void {
    const info = this.clients.get(ws);
    if (info) {
      for (const gameId of info.subscribedGames) {
        const channel = this.gameChannels.get(gameId);
        if (channel) {
          channel.delete(ws);
          if (channel.size === 0) {
            this.gameChannels.delete(gameId);
          }
        }
      }
    }
    this.clients.delete(ws);
  }

  /**
   * Handle client connection error - clean up and remove
   */
  handleError(ws: WebSocket, _error: Error): void {
    this.handleDisconnection(ws);
  }

  /**
   * Process an incoming message from a client
   */
  handleMessage(ws: WebSocket, data: string): void {
    let parsed: WebSocketMessage;
    try {
      parsed = JSON.parse(data);
    } catch {
      this.sendToClient(ws, 'error', {
        code: 'INVALID_REQUEST',
        message: 'Invalid JSON message',
      } satisfies ErrorEvent);
      return;
    }

    if (!parsed.type) {
      this.sendToClient(ws, 'error', {
        code: 'INVALID_REQUEST',
        message: 'Message missing type field',
      } satisfies ErrorEvent);
      return;
    }

    switch (parsed.type) {
      case 'subscribe':
        this.handleSubscribe(ws, parsed.payload as SubscribeEvent);
        break;
      case 'set_narration':
        this.handleSetNarration(ws, parsed.payload as SetNarrationEvent);
        break;
      default:
        // Unknown message types are silently ignored (no crash)
        break;
    }
  }

  /**
   * Get the number of active connections
   */
  getConnectionCount(): number {
    return this.clients.size;
  }

  /**
   * Get all WebSocket clients subscribed to a game
   */
  getSubscribers(gameId: string): WebSocket[] {
    const channel = this.gameChannels.get(gameId);
    if (!channel) return [];
    return Array.from(channel);
  }

  /**
   * Broadcast an event to all clients subscribed to a game
   */
  broadcastToGame<T>(gameId: string, type: WebSocketEventType, payload: T): void {
    const channel = this.gameChannels.get(gameId);
    if (!channel) return;

    const message: WebSocketMessage<T> = {
      type,
      payload,
      timestamp: Date.now(),
    };
    const serialized = JSON.stringify(message);

    for (const ws of channel) {
      // Skip closed connections
      if (ws.readyState !== 1) continue; // 1 = OPEN
      try {
        ws.send(serialized);
      } catch {
        // Client send failed; will be cleaned up on disconnect
      }
    }
  }

  /**
   * Send an event to a specific client
   */
  sendToClient<T>(ws: WebSocket, type: WebSocketEventType, payload: T): void {
    const message: WebSocketMessage<T> = {
      type,
      payload,
      timestamp: Date.now(),
    };
    try {
      ws.send(JSON.stringify(message));
    } catch {
      // Client send failed
    }
  }

  /**
   * Check if narration is enabled for a specific client
   */
  isNarrationEnabled(ws: WebSocket): boolean {
    const info = this.clients.get(ws);
    return info ? info.narrationEnabled : true;
  }

  /**
   * Remove all subscribers for a game (used when game ends/is deleted)
   */
  removeGame(gameId: string): void {
    const channel = this.gameChannels.get(gameId);
    if (channel) {
      for (const ws of channel) {
        const info = this.clients.get(ws);
        if (info) {
          info.subscribedGames.delete(gameId);
        }
      }
      this.gameChannels.delete(gameId);
    }
  }

  /**
   * Shut down the server - close all connections and clean up
   */
  shutdown(): void {
    for (const [ws] of this.clients) {
      try {
        ws.close(1001, 'Server shutting down');
      } catch {
        // Already closed
      }
    }
    this.clients.clear();
    this.gameChannels.clear();
  }

  /**
   * Subscribe a client to a game channel
   */
  private handleSubscribe(ws: WebSocket, payload: SubscribeEvent): void {
    const { gameId } = payload;
    const info = this.clients.get(ws);
    if (!info) return;

    info.subscribedGames.add(gameId);

    let channel = this.gameChannels.get(gameId);
    if (!channel) {
      channel = new Set();
      this.gameChannels.set(gameId, channel);
    }
    channel.add(ws);
  }

  /**
   * Update narration preference for a client
   */
  private handleSetNarration(ws: WebSocket, payload: SetNarrationEvent): void {
    const info = this.clients.get(ws);
    if (!info) return;
    info.narrationEnabled = payload.enabled;
  }
}
