/**
 * WebSocket Server - Real-time Notifications
 * 
 * Implementa notificações em tempo real para:
 * - Diagnósticos críticos (RAI crítico)
 * - Aprovações de documentos
 * - Atualizações de conversas
 * - Alertas de sistema
 */

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

interface NotificationPayload {
  type: 'diagnostic_critical' | 'document_approved' | 'conversation_update' | 'system_alert';
  title: string;
  message: string;
  data?: Record<string, any>;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface UserConnection {
  userId: number;
  socketId: string;
  connectedAt: number;
  role: 'user' | 'admin';
}

/**
 * Gerenciador de conexões WebSocket
 */
class WebSocketManager {
  private io: SocketIOServer;
  private userConnections: Map<number, UserConnection[]> = new Map();
  private adminConnections: Set<string> = new Set();

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: [
          'https://evolucopil-pk69zyag.manus.space',
          'https://3000-ikq1zghwjn2luda6mwzys-2c82bc1d.us2.manus.computer',
          'http://localhost:3000',
        ],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupEventHandlers();
  }

  /**
   * Configurar handlers de eventos
   */
  private setupEventHandlers() {
    this.io.on('connection', (socket: Socket) => {
      console.log(`[WebSocket] Cliente conectado: ${socket.id}`);

      // Autenticar usuário
      socket.on('authenticate', (data: { userId: number; role: 'user' | 'admin' }) => {
        this.registerUserConnection(data.userId, socket.id, data.role);
        socket.emit('authenticated', { success: true });
      });

      // Desconectar
      socket.on('disconnect', () => {
        this.unregisterUserConnection(socket.id);
        console.log(`[WebSocket] Cliente desconectado: ${socket.id}`);
      });

      // Heartbeat (keep-alive)
      socket.on('ping', () => {
        socket.emit('pong');
      });
    });
  }

  /**
   * Registrar conexão de usuário
   */
  private registerUserConnection(userId: number, socketId: string, role: 'user' | 'admin') {
    const connection: UserConnection = {
      userId,
      socketId,
      connectedAt: Date.now(),
      role,
    };

    const userConnections = this.userConnections.get(userId) || [];
    userConnections.push(connection);
    this.userConnections.set(userId, userConnections);

    if (role === 'admin') {
      this.adminConnections.add(socketId);
    }

    console.log(`[WebSocket] Usuário ${userId} autenticado (${role})`);
  }

  /**
   * Remover conexão de usuário
   */
  private unregisterUserConnection(socketId: string) {
    const entriesToDelete: number[] = [];
    
    this.userConnections.forEach((connections, userId) => {
      const index = connections.findIndex((c: UserConnection) => c.socketId === socketId);
      if (index !== -1) {
        connections.splice(index, 1);
        if (connections.length === 0) {
          entriesToDelete.push(userId);
        }
      }
    });

    entriesToDelete.forEach((userId) => {
      this.userConnections.delete(userId);
    });

    this.adminConnections.delete(socketId);
  }

  /**
   * Enviar notificação para usuário específico
   */
  public notifyUser(userId: number, notification: NotificationPayload) {
    const connections = this.userConnections.get(userId);
    if (!connections) return;

    connections.forEach((conn) => {
      this.io.to(conn.socketId).emit('notification', notification);
    });

    console.log(`[WebSocket] Notificação enviada para usuário ${userId}`);
  }

  /**
   * Enviar notificação para todos os admins
   */
  public notifyAdmins(notification: NotificationPayload) {
    this.adminConnections.forEach((socketId) => {
      this.io.to(socketId).emit('notification', notification);
    });

    console.log(`[WebSocket] Notificação enviada para ${this.adminConnections.size} admins`);
  }

  /**
   * Enviar notificação para todos os usuários
   */
  public broadcastNotification(notification: NotificationPayload) {
    this.io.emit('notification', notification);
    console.log(`[WebSocket] Notificação broadcast enviada`);
  }

  /**
   * Obter status de conexão
   */
  public getConnectionStats() {
    return {
      totalUsers: this.userConnections.size,
      totalConnections: Array.from(this.userConnections.values()).reduce(
        (sum, conns) => sum + conns.length,
        0
      ),
      totalAdmins: this.adminConnections.size,
    };
  }
}

export let wsManager: WebSocketManager;

/**
 * Inicializar WebSocket
 */
export function initializeWebSocket(httpServer: HTTPServer) {
  wsManager = new WebSocketManager(httpServer);
  console.log('[WebSocket] Servidor inicializado');
  return wsManager;
}

/**
 * Helpers para notificações
 */
export const notificationHelpers = {
  /**
   * Notificar diagnóstico crítico
   */
  notifyCriticalDiagnostic: (userId: number, diagnosticId: number, riskLevel: string) => {
    wsManager.notifyUser(userId, {
      type: 'diagnostic_critical',
      title: '⚠️ Diagnóstico Crítico',
      message: `Novo diagnóstico com risco ${riskLevel} requer aprovação`,
      data: { diagnosticId },
      timestamp: Date.now(),
      severity: 'critical',
    });
  },

  /**
   * Notificar aprovação de documento
   */
  notifyDocumentApproved: (userId: number, documentTitle: string) => {
    wsManager.notifyUser(userId, {
      type: 'document_approved',
      title: '✅ Documento Aprovado',
      message: `"${documentTitle}" foi aprovado e está disponível no RAG`,
      timestamp: Date.now(),
      severity: 'high',
    });
  },

  /**
   * Notificar atualização de conversa
   */
  notifyConversationUpdate: (userId: number, conversationId: number) => {
    wsManager.notifyUser(userId, {
      type: 'conversation_update',
      title: '💬 Conversa Atualizada',
      message: 'Nova resposta disponível na sua conversa',
      data: { conversationId },
      timestamp: Date.now(),
      severity: 'medium',
    });
  },

  /**
   * Alerta de sistema
   */
  notifySystemAlert: (message: string, severity: 'low' | 'medium' | 'high' | 'critical') => {
    wsManager.broadcastNotification({
      type: 'system_alert',
      title: '🔔 Alerta do Sistema',
      message,
      timestamp: Date.now(),
      severity,
    });
  },
};
