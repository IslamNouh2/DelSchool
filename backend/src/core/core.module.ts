import { Module, Global } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from '../auth/auth.module';
import { TenantGuard } from 'src/common/guards/tenant.guard';

@Global()
@Module({
  imports: [AuthModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: TenantGuard,
    },
  ],
})
export class CoreModule {}
