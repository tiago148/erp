import { Module } from '@nestjs/common';
import { LaborRolesController } from './labor-roles.controller';
import { LaborRolesService } from './labor-roles.service';

@Module({
  controllers: [LaborRolesController],
  providers: [LaborRolesService],
})
export class LaborRolesModule {}
