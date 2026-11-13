import { Global, Module } from '@nestjs/common';

import { PrismaService } from './prisma.service.js';
import { TenantScope } from './tenant-scope.js';

@Global()
@Module({
  providers: [PrismaService, TenantScope],
  exports: [PrismaService, TenantScope],
})
export class PrismaModule {}
