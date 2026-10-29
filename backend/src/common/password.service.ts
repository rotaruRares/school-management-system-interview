import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import { getConfig } from '../config/app-config.js';

@Injectable()
export class PasswordService {
  private readonly rounds = getConfig().bcryptRounds;
  private dummyHash?: Promise<string>;

  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.rounds);
  }

  async verify(plain: string, hash: string | null): Promise<boolean> {
    const target = hash ?? (await this.getDummyHash());
    const matches = await bcrypt.compare(plain, target);
    return hash !== null && matches;
  }

  private getDummyHash(): Promise<string> {
    this.dummyHash ??= bcrypt.hash(randomBytes(16).toString('hex'), this.rounds);
    return this.dummyHash;
  }
}
