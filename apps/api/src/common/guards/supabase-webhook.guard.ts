import dayjs from 'dayjs';

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Webhook } from 'standardwebhooks';

/**
 * Supabase Webhook Guard
 *
 * Verifies webhook requests from Supabase using Standard Webhooks specification
 * - Validates webhook signature (HMAC-SHA256)
 * - Prevents replay attacks (timestamp validation)
 * - Ensures request authenticity
 *
 * @see https://supabase.com/docs/guides/auth/auth-hooks
 * @see https://www.standardwebhooks.com/
 */
@Injectable()
export class SupabaseWebhookGuard implements CanActivate {
  private readonly logger = new Logger(SupabaseWebhookGuard.name);
  private readonly webhookSecret: string;
  private readonly webhook: Webhook | null = null;

  constructor(private configService: ConfigService) {
    this.webhookSecret = this.configService.get<string>('SUPABASE_WEBHOOK_SECRET') || '';

    if (!this.webhookSecret) {
      this.logger.error('🚨 SUPABASE_WEBHOOK_SECRET not configured! Webhook endpoint is INSECURE!');
    } else {
      try {
        this.webhook = new Webhook(this.webhookSecret);
        this.logger.log('✅ Supabase Webhook Guard initialized with secret');
      } catch (error) {
        this.logger.error(
          '❌ Failed to initialize Webhook verifier',
          error instanceof Error ? error.stack : undefined
        );
      }
    }
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // If webhook verifier is not initialized, handle based on environment
    if (!this.webhook) {
      const nodeEnv = this.configService.get<string>('NODE_ENV') || 'dev';

      if (nodeEnv === 'production') {
        this.logger.error('❌ Webhook verification failed: No secret configured');
        throw new UnauthorizedException('Webhook authentication failed');
      } else {
        this.logger.warn(
          '⚠️ DEVELOPMENT MODE: Webhook secret not configured\n' +
            '   Bypassing webhook signature verification\n' +
            '   ⚠️ THIS IS INSECURE - Configure SUPABASE_WEBHOOK_SECRET for production!'
        );
        return true;
      }
    }

    try {
      // Extract Standard Webhooks headers
      const webhookId = request.headers['webhook-id'];
      const webhookTimestamp = request.headers['webhook-timestamp'];
      const webhookSignature = request.headers['webhook-signature'];

      this.logger.debug(
        `🔍 Webhook Request:\n` +
          `  ID: ${webhookId || '(missing)'}\n` +
          `  Timestamp: ${webhookTimestamp || '(missing)'}\n` +
          `  Signature: ${webhookSignature ? `${webhookSignature.substring(0, 20)}...` : '(missing)'}\n` +
          `  Body Size: ${JSON.stringify(request.body).length} bytes`
      );

      // Validate required headers presence
      if (!webhookId || !webhookTimestamp || !webhookSignature) {
        this.logger.warn(
          `❌ Missing webhook headers:\n` +
            `  webhook-id: ${webhookId ? '✓' : '✗'}\n` +
            `  webhook-timestamp: ${webhookTimestamp ? '✓' : '✗'}\n` +
            `  webhook-signature: ${webhookSignature ? '✓' : '✗'}`
        );
        throw new UnauthorizedException('Missing webhook headers');
      }

      // Validate timestamp is reasonable (not too old or in future)
      const timestamp = parseInt(webhookTimestamp, 10);
      const now = dayjs().unix();
      const timeDiff = Math.abs(now - timestamp);

      this.logger.debug(
        `⏱️ Timestamp validation:\n` +
          `  Webhook time: ${dayjs.unix(timestamp).toISOString()}\n` +
          `  Current time: ${dayjs.unix(now).toISOString()}\n` +
          `  Time diff: ${timeDiff}s`
      );

      // Get raw request body (must be string or Buffer)
      const payload = JSON.stringify(request.body);

      this.logger.debug(`🔐 Verifying webhook signature...`);

      // Verify webhook signature using standardwebhooks library
      // This validates:
      // 1. Signature authenticity (HMAC-SHA256)
      // 2. Timestamp freshness (prevents replay attacks)
      // 3. Payload integrity (prevents tampering)
      this.webhook.verify(payload, {
        'webhook-id': webhookId,
        'webhook-timestamp': webhookTimestamp,
        'webhook-signature': webhookSignature,
      });

      this.logger.log(
        `✅ Webhook verified successfully:\n` +
          `  ID: ${webhookId}\n` +
          `  User: ${request.body.user_id || '(unknown)'}\n` +
          `  Method: ${request.body.authentication_method || '(unknown)'}`
      );

      return true;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.warn(
          `❌ Webhook verification failed:\n` +
            `  Error: ${error.message}\n` +
            `  Type: ${error.constructor.name}\n` +
            `  Stack: ${error.stack?.split('\n')[1]?.trim() || '(no stack)'}`
        );
      } else {
        this.logger.warn('❌ Webhook verification failed: Unknown error');
      }
      throw new UnauthorizedException('Invalid webhook signature');
    }
  }
}