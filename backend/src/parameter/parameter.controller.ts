import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ParameterService } from './parameter.service';
import { CreateParameterDto } from './dto/create-parameter.dto';
import { UpdateParameterDto } from './dto/update-parameter.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RequestWithTenant } from 'src/subject/subject.controller';

@Controller('parameter')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ParameterController {
  constructor(private readonly parameterService: ParameterService) {}

  @Post()
  @Roles('ADMIN')
  create(@Body() createParameterDto: CreateParameterDto) {
    return this.parameterService.create(createParameterDto);
  }

  @Get()
  @Roles('ADMIN')
  findAll() {
    return this.parameterService.findAll();
  }

  @Get(':paramName')
  @Roles('ADMIN')
  findOne(@Param('paramName') paramName: string) {
    return this.parameterService.findOne(paramName);
  }

  @Patch(':paramName')
  @Roles('ADMIN')
  update(
    @Param('paramName') paramName: string,
    @Body() updateParameterDto: UpdateParameterDto,
  ) {
    return this.parameterService.update(paramName, updateParameterDto);
  }

  @Delete(':paramName')
  @Roles('ADMIN')
  remove(@Param('paramName') paramName: string) {
    return this.parameterService.remove(paramName);
  }

  @Get('ok-sub-subject/status')
  @Roles('ADMIN', 'TEACHER', 'STUDENT')
  getOkSubSubjectStatus(@Req() req: RequestWithTenant) {
    return this.parameterService.getOkSubSubjectStatus(req.tenantId);
  }
}
