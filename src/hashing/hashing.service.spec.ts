/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import argon2 from "argon2";
import { HashingService } from "./hashing.service";
import type { ActiveUserType } from "@/authentication/dto/request-user.dto";
import type { RefreshTokenPayload } from "@/authentication/dto/request-user.dto";
import type { DurationType } from "@/common/schema/duration-schema";

jest.mock("argon2", () => ({
  hash: jest.fn(),
  verify: jest.fn(),
}));

const mockedArgon2 = jest.mocked(argon2);

describe("HashingService", () => {
  let service: HashingService;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HashingService,
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn(),
            signAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(HashingService);
    jwtService = module.get(JwtService);
  });

  describe("hash", () => {
    it("returns an argon2 hash for the given raw string", async () => {
      const raw = "myPassword123";
      mockedArgon2.hash.mockResolvedValue("$argon2id$v=19$m=65536,t=3,p=4$hashvalue");

      const result = await service.hash(raw);

      expect(result).toBe("$argon2id$v=19$m=65536,t=3,p=4$hashvalue");
      expect(mockedArgon2.hash).toHaveBeenCalledWith(raw);
    });

    it("propagates rejection from argon2.hash", async () => {
      const error = new Error("hash failure");
      mockedArgon2.hash.mockRejectedValue(error);

      await expect(service.hash("password")).rejects.toThrow(error);
    });
  });

  describe("compare", () => {
    it("returns true when raw matches encrypted", async () => {
      const passwordInfo = { raw: "password123", encrypted: "$argon2id$hash" };
      mockedArgon2.verify.mockResolvedValue(true);

      const result = await service.compare(passwordInfo);

      expect(result).toBe(true);
      expect(mockedArgon2.verify).toHaveBeenCalledWith(passwordInfo.encrypted, passwordInfo.raw);
    });

    it("returns false when raw does not match encrypted", async () => {
      const passwordInfo = { raw: "wrongPassword", encrypted: "$argon2id$hash" };
      mockedArgon2.verify.mockResolvedValue(false);

      const result = await service.compare(passwordInfo);

      expect(result).toBe(false);
    });

    it("propagates rejection from argon2.verify", async () => {
      const error = new Error("verify failure");
      mockedArgon2.verify.mockRejectedValue(error);

      await expect(service.compare({ raw: "pw", encrypted: "hash" })).rejects.toThrow(error);
    });
  });

  describe("verifyJwtToken", () => {
    it("returns the decoded payload for a valid token", async () => {
      const token = "valid.jwt.token";
      const payload = { sub: 1, email: "test@example.com" };
      jwtService.verifyAsync.mockResolvedValue(payload);

      const result = await service.verifyJwtToken<{ sub: number; email: string }>(token);

      expect(result).toStrictEqual(payload);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith(token);
    });

    it("propagates rejection from jwtService.verifyAsync", async () => {
      const error = new Error("jwt expired");
      jwtService.verifyAsync.mockRejectedValue(error);

      await expect(service.verifyJwtToken("expired.token")).rejects.toThrow(error);
    });
  });

  describe("signAccessToken", () => {
    it("calls jwtService.signAsync with ActiveUserType data and expiresIn option", async () => {
      const signedData: ActiveUserType = {
        sub: 1,
        email: "user@example.com",
        role: "CASHIER",
        language: "en",
        tokenType: "access",
      };
      const expiresIn: DurationType = "15m";
      jwtService.signAsync.mockResolvedValue("signed-access-token");

      const result = await service.signAccessToken(signedData, expiresIn);

      expect(result).toBe("signed-access-token");
      expect(jwtService.signAsync).toHaveBeenCalledWith(signedData, { expiresIn });
    });

    it("propagates rejection from jwtService.signAsync", async () => {
      const error = new Error("signing failed");
      const signedData: ActiveUserType = {
        sub: 1,
        email: "user@example.com",
        role: "CASHIER",
        language: "en",
        tokenType: "access",
      };
      jwtService.signAsync.mockRejectedValue(error);

      await expect(service.signAccessToken(signedData, "1h")).rejects.toThrow(error);
    });
  });

  describe("signRefreshToken", () => {
    it("calls jwtService.signAsync with RefreshTokenPayload data and expiresIn option", async () => {
      const signedData: RefreshTokenPayload = {
        sub: 1,
        tokenType: "refresh",
        refreshTokenId: "rt-id-123",
      };
      const expiresIn: DurationType = "7d";
      jwtService.signAsync.mockResolvedValue("signed-refresh-token");

      const result = await service.signRefreshToken(signedData, expiresIn);

      expect(result).toBe("signed-refresh-token");
      expect(jwtService.signAsync).toHaveBeenCalledWith(signedData, { expiresIn });
    });

    it("propagates rejection from jwtService.signAsync", async () => {
      const error = new Error("signing failed");
      const signedData: RefreshTokenPayload = {
        sub: 1,
        tokenType: "refresh",
        refreshTokenId: "rt-id-123",
      };
      jwtService.signAsync.mockRejectedValue(error);

      await expect(service.signRefreshToken(signedData, "1h")).rejects.toThrow(error);
    });
  });
});
