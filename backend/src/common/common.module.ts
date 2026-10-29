import { Global, Module } from '@nestjs/common';
import { OwnershipService } from './ownership.service.js';
import { PasswordService } from './password.service.js';
import { ReferencesService } from './references.service.js';

@Global()
@Module({
  providers: [OwnershipService, PasswordService, ReferencesService],
  exports: [OwnershipService, PasswordService, ReferencesService],
})
export class CommonModule {}
