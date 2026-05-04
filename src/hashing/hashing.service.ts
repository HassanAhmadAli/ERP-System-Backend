import { Injectable } from "@nestjs/common";
import argon2 from "argon2";
@Injectable()
export class HashingService {
  async hash(passwordInfo: { raw: string }): Promise<string> {
    return await argon2.hash(passwordInfo.raw);
  }
  async compare(passwordInfo: { raw: string; encrypted: string }): Promise<boolean> {
    return await argon2.verify(passwordInfo.encrypted, passwordInfo.raw);
  }
}
