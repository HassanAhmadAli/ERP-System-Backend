import { Injectable } from "@nestjs/common";
import { HashingService } from "./hashing.service";
import argon2 from "argon2";
@Injectable()
export class Argon2Service implements HashingService {
  async hash(passwordInfo: { raw: string }): Promise<string> {
    return await argon2.hash(passwordInfo.raw);
  }
  async compare(passwordInfo: { raw: string; encrypted: string }): Promise<boolean> {
    return await argon2.verify(passwordInfo.encrypted, passwordInfo.raw);
  }
}
