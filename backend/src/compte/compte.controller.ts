import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Request, UseGuards, Req } from '@nestjs/common';
import { CompteService } from './compte.service';
import { CreateCompteDto } from './dto/create-compte.dto';
import { UpdateCompteDto } from './dto/update-compte.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('compte')
export class CompteController {
  constructor(private readonly compteService: CompteService) {}

  @Post()
  create(@Req() req: any, @Body() createCompteDto: CreateCompteDto) {
    return this.compteService.create(req.tenantId, createCompteDto);
  }

  @Get()
  findAll(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.compteService.findAll(req.tenantId, page ? +page : 1, limit ? +limit : 10, search, status);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.compteService.findOne(req.tenantId, +id);
  }

  @Get(':id/transactions')
  getTransactions(
      @Req() req: any,
      @Param('id') id: string,
      @Query('startDate') startDate?: string,
      @Query('endDate') endDate?: string,
      @Query('page') page: string = '1',
      @Query('limit') limit: string = '20',
      @Query('search') search?: string
  ) {
    return this.compteService.getTransactions(req.tenantId, +id, startDate, endDate, +page, +limit, search);
  }

  @Post(':id/transaction')
  createTransaction(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.compteService.createTransaction(req.tenantId, +id, dto, req.user?.id);
  }

  @Post('transaction/:entryId') // Using Post/Put? Let's use Put for update
  // But wait, the route was /compte/transaction/:entryId
  // NestJS controller prefix is 'compte'
  @Patch('transaction/:entryId') 
  updateTransaction(@Req() req: any, @Param('entryId') entryId: string, @Body() dto: any) {
      return this.compteService.updateTransaction(req.tenantId, +entryId, dto, req.user?.id);
  }

  @Delete('transaction/:entryId')
  deleteTransaction(@Req() req: any, @Param('entryId') entryId: string) {
      return this.compteService.deleteTransaction(req.tenantId, +entryId);
  }

  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() updateCompteDto: UpdateCompteDto) {
    return this.compteService.update(req.tenantId, +id, updateCompteDto);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.compteService.remove(req.tenantId, +id);
  }
}
