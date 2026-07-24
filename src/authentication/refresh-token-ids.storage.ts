import { Inject, Injectable } from "@nestjs/common";
import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
import { ConfigService } from "@nestjs/config";
import { EnvVariables } from "@/common/schema/env";
import { durationToMs } from "@/common/schema/duration-schema";
@Injectable()
export class RefreshTokenIdsStorage {
  private refreshTtl: number;
  constructor(
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    private readonly configService: ConfigService<EnvVariables>,
  ) {
    const ttl = configService.getOrThrow("JWT_REFRESH_TTL", { infer: true });
    this.refreshTtl = durationToMs(ttl);
  }

  async insert(userId: number, tokenId: string): Promise<void> {
    const key = this.getKey(userId);
    await this.cacheManager.set(key, tokenId, this.refreshTtl);
  }
  async validate(userId: number, tokenId: string): Promise<boolean> {
    const key = this.getKey(userId);
    const storedId = await this.cacheManager.get(key);
    return storedId === tokenId;
  }
  async invalidate(userId: number): Promise<void> {
    const key = this.getKey(userId);
    await this.cacheManager.del(key);
  }
  getKey(userId: number): string {
    return `user-${userId}`;
  }
}
