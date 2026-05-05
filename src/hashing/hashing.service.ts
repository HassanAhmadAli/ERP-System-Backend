import { ActiveUserType, RefreshTokenPayload } from "@/authentication/dto/request-user.dto";
import { DurationType } from "@/common/schema/duration-schema";
import { Injectable } from "@nestjs/common";
import { JwtService, JwtSignOptions } from "@nestjs/jwt";
import argon2 from "argon2";
@Injectable()
export class HashingService {
  constructor(private readonly jwtService: JwtService) {}
  async hash(raw: string): Promise<string> {
    return await argon2.hash(raw);
  }
  async compare(passwordInfo: { raw: string; encrypted: string }): Promise<boolean> {
    return await argon2.verify(passwordInfo.encrypted, passwordInfo.raw);
  }
  async verifyJwtToken<T extends object>(token: string) {
    return await this.jwtService.verifyAsync<T>(token);
  }
  async signAccessToken(signedData: ActiveUserType, expiresIn: DurationType) {
    return await this.jwtService.signAsync(signedData, {
      expiresIn,
    } satisfies JwtSignOptions);
  }
  async signRefreshToken(signedData: RefreshTokenPayload, expiresIn: DurationType) {
    return await this.jwtService.signAsync(signedData, {
      expiresIn,
    } satisfies JwtSignOptions);
  }
}
