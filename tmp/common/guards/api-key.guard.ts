import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { REQUIRE_API_KEY_KEY } from '@/common/decorators/require-api-key.decorator';

/**
 * API Key Guard
 * Validates API key from request headers
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name);
  private readonly allowedApiKeys: string[];

  constructor(
    private readonly configService: ConfigService,
    private readonly reflector: Reflector
  ) {
    // Load allowed API keys from environment variable
    // Format: BACKEND_API_KEYS=key1,key2,key3
    const apiKeysEnv = this.configService.get<string>('BACKEND_API_KEYS', '');

    // Log first 10 characters of apiKeysEnv for debugging
    this.logger.log(
      `[ENV CHECK] BACKEND_API_KEYS (first 10 chars): ${apiKeysEnv.substring(0, 10)}...`
    );

    this.allowedApiKeys = apiKeysEnv
      .split(',')
      .map(key => key.trim())
      .filter(key => key.length > 0);

    if (this.allowedApiKeys.length === 0) {
      this.logger.warn('No API keys configured! API key authentication will fail.');
    } else {
      this.logger.log(`ApiKeyGuard initialized with ${this.allowedApiKeys.length} API key(s)`);
    }
  }

  /**
   * Validate API key from request headers
   *
   * Supports two header formats:
   * - X-API-Key: {api_key}
   * - Authorization: Bearer {api_key}
   *
   * @param context - execution context
   * @returns whether access is allowed
   * @throws UnauthorizedException if API key is invalid or missing
   */
  canActivate(context: ExecutionContext): boolean {
    // Check if API key is required for this route
    const requireApiKey = this.reflector.getAllAndOverride<boolean>(REQUIRE_API_KEY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If API key is not required, allow access
    if (!requireApiKey) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    // Extract API key from headers
    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      this.logger.warn('API key missing in request', {
        url: request.url,
        method: request.method,
        ip: request.ip,
      });
      throw new UnauthorizedException(
        'API key is required. Provide X-API-Key header or Authorization: Bearer token'
      );
    }

    // Validate API key
    if (!this.isValidApiKey(apiKey)) {
      this.logger.warn('Invalid API key provided', {
        url: request.url,
        method: request.method,
        ip: request.ip,
        apiKeyPrefix: apiKey.substring(0, 8) + '...',
      });
      throw new UnauthorizedException('Invalid API key');
    }

    this.logger.debug('API key validated successfully', {
      url: request.url,
      method: request.method,
      apiKeyPrefix: apiKey.substring(0, 8) + '...',
    });

    return true;
  }

  /**
   * Extract API key from request headers
   *
   * @param request - HTTP request
   * @returns API key or null
   */
  private extractApiKey(request: any): string | null {
    // Try X-API-Key header first
    const xApiKey = request.headers['x-api-key'];
    if (xApiKey) {
      return xApiKey;
    }

    // Try Authorization header (Bearer token)
    const authorization = request.headers['authorization'];
    if (authorization && authorization.startsWith('Bearer ')) {
      return authorization.substring(7);
    }

    return null;
  }

  /**
   * Check if API key is valid
   *
   * @param apiKey - API key to validate
   * @returns whether API key is valid
   */
  private isValidApiKey(apiKey: string): boolean {
    return this.allowedApiKeys.includes(apiKey);
  }
}
