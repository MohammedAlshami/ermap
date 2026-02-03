import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { ChatService } from './chat.service';
import type { ChatBodyDto } from './dto/chat-body.dto';

@Controller('api')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('health')
  health(): { status: string } {
    return { status: 'healthy' };
  }

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  async streamChat(
    @Body() body: ChatBodyDto,
    @Res({ passthrough: false }) res: Response,
  ): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    try {
      for await (const chunk of this.chatService.streamChat(body)) {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        if (
          typeof (res as unknown as { flush?: () => void }).flush === 'function'
        ) {
          (res as unknown as { flush: () => void }).flush();
        }
      }
    } catch (err) {
      console.error('[CHAT] Error:', err);
      res.write(
        `data: ${JSON.stringify({
          type: 'error',
          id: '',
          model: 'langgraph',
          timestamp: Date.now(),
          error: {
            message: err instanceof Error ? err.message : String(err),
          },
        })}\n\n`,
      );
    } finally {
      res.end();
    }
  }
}
