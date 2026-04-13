import { Injectable } from "@nestjs/common";

@Injectable()
export abstract class HashingService {
  abstract hash(passwordInfo: { raw: string }): Promise<string>;
  abstract compare(passwordInfo: { raw: string; encrypted: string }): Promise<boolean>;
}
