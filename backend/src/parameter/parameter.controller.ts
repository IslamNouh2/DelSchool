import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ParameterService } from './parameter.service';
import { CreateParameterDto } from './dto/create-parameter.dto';
import { UpdateParameterDto } from './dto/update-parameter.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/dto/register.dto';

@Controller('parameter')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class ParameterController {
  constructor(private readonly parameterService: ParameterService) { }

  @Post()
  create(@Body() createParameterDto: CreateParameterDto) {
    return this.parameterService.create(createParameterDto);
  }

  @Get()
  findAll() {
    return this.parameterService.findAll();
  }

  @Get(':paramName')
  findOne(@Param('paramName') paramName: string) {
    return this.parameterService.findOne(paramName);
  }

  @Patch(':paramName')
  update(
    @Param('paramName') paramName: string,
    @Body() updateParameterDto: UpdateParameterDto,
  ) {
    return this.parameterService.update(paramName, updateParameterDto);
  }

  @Delete(':paramName')
  remove(@Param('paramName') paramName: string) {
    return this.parameterService.remove(paramName);
  }

  @Get('ok-sub-subject/status')
  getOkSubSubjectStatus() {
    return this.parameterService.getOkSubSubjectStatus();
  }
}