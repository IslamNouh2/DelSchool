import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { parse } from 'cookie';

interface JwtPayload {
  id: number;
  username: string;
  role: string;
}

interface SocketData {
  user?: JwtPayload;
}

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://del-school-bvev.vercel.app',
      'https://delschool-production.up.railway.app',
    ],
    credentials: true,
  },
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    try {
      let token: string | null = null;

      // ================= 1. COOKIE =================
      const cookies = client.handshake.headers.cookie;

      if (cookies) {
        const parsedCookies: Record<string, string> = parse(cookies);

        token = parsedCookies['accessToken'] || parsedCookies['token'];
      }
      // ================= 2. AUTH HEADER =================
      if (!token) {
        const authHeader = client.handshake.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
          token = authHeader.split(' ')[1];
        }
      }

      // ================= 3. QUERY (fallback) =================
      if (!token) {
        token = (client.handshake.auth?.token as string) || null;
      }

      if (!token) {
        throw new Error('No token provided');
      }

      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });

      // ✅ Attach user to socket (VERY IMPORTANT)
      (client.data as SocketData).user = payload;

      console.log(`✅ WS Auth: ${payload.username} (${client.id})`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.log(`❌ WS Auth failed (${client.id}):`, errorMessage);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userData = (client.data as SocketData).user;
    const username = userData?.username || 'Unknown';
    console.log(`🔌 Client disconnected: ${username} (${client.id})`);
  }

  // ✅ Emit to all
  emitRefresh() {
    this.server.emit('refresh');
  }

  // ✅ Emit to specific user (enterprise)
  emitToUser(userId: number, event: string, data: any) {
    this.server.sockets.sockets.forEach((socket) => {
      const userData = socket.data as SocketData;
      if (userData?.user?.id === userId) {
        socket.emit(event, data);
      }
    });
  }
}
