import { Inject, Injectable } from "@nestjs/common";
import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
@Injectable()
export class RefreshTokenIdsStorage {
  constructor(
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  async insert(userId: number, tokenId: string): Promise<void> {
    const key = this.getKey(userId);
    await this.cacheManager.set(key, tokenId, 0);
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
