import { Test, TestingModule } from "@nestjs/testing";
import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
import { ConfigService } from "@nestjs/config";
import { RefreshTokenIdsStorage } from "./refresh-token-ids.storage";

describe("RefreshTokenIdsStorage", () => {
  let storage: RefreshTokenIdsStorage;
  let cacheManager: jest.Mocked<Cache>;

  const mockRefreshTtl = "7d";

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenIdsStorage,
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue(mockRefreshTtl),
          },
        },
      ],
    }).compile();

    storage = module.get<RefreshTokenIdsStorage>(RefreshTokenIdsStorage);
    cacheManager = module.get(CACHE_MANAGER);
  });

  describe("insert", () => {
    it("insert_setsCacheWithKeyAndTtl", async () => {
      const userId = 1;
      const tokenId = "token-abc-123";

      await storage.insert(userId, tokenId);

      expect(cacheManager.set).toHaveBeenCalledWith(`user-${userId}`, tokenId, expect.any(Number));
    });
  });

  describe("validate", () => {
    it("validate_matchingToken_returnsTrue", async () => {
      const userId = 1;
      const tokenId = "token-abc-123";
      cacheManager.get.mockResolvedValue(tokenId);

      const result = await storage.validate(userId, tokenId);

      expect(result).toBe(true);
      expect(cacheManager.get).toHaveBeenCalledWith(`user-${userId}`);
    });

    it("validate_nonMatchingToken_returnsFalse", async () => {
      const userId = 1;
      const storedTokenId = "token-abc-123";
      const providedTokenId = "token-xyz-789";
      cacheManager.get.mockResolvedValue(storedTokenId);

      const result = await storage.validate(userId, providedTokenId);

      expect(result).toBe(false);
      expect(cacheManager.get).toHaveBeenCalledWith(`user-${userId}`);
    });
  });

  describe("invalidate", () => {
    it("invalidate_deletesCacheKey", async () => {
      const userId = 1;

      await storage.invalidate(userId);

      expect(cacheManager.del).toHaveBeenCalledWith(`user-${userId}`);
    });
  });
});
