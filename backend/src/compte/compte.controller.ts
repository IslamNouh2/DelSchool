import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Request } from '@nestjs/common';
import { CompteService } from './compte.service';
import { CreateCompteDto } from './dto/create-compte.dto';
import { UpdateCompteDto } from './dto/update-compte.dto';

@Controller('compte')
export class CompteController {
  constructor(private readonly compteService: CompteService) {}

  @Post()
  create(@Body() createCompteDto: CreateCompteDto) {
    return this.compteService.create(createCompteDto);
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('name') name?: string,
    @Query('status') status?: string,
  ) {
    return this.compteService.findAll(page ? +page : 1, limit ? +limit : 10, name, status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.compteService.findOne(+id);
  }

  @Get(':id/transactions')
  getTransactions(
      @Param('id') id: string,
      @Query('startDate') startDate?: string,
      @Query('endDate') endDate?: string
  ) {
    return this.compteService.getTransactions(+id, startDate, endDate);
  }

  @Post(':id/transaction')
  createTransaction(@Param('id') id: string, @Body() dto: any, @Request() req) {
    return this.compteService.createTransaction(+id, dto, req.user?.id);
  }

  @Post('transaction/:entryId') // Using Post/Put? Let's use Put for update
  // But wait, the route was /compte/transaction/:entryId
  // NestJS controller prefix is 'compte'
  @Patch('transaction/:entryId') 
  updateTransaction(@Param('entryId') entryId: string, @Body() dto: any, @Request() req) {
      return this.compteService.updateTransaction(+entryId, dto, req.user?.id);
  }

  @Delete('transaction/:entryId')
  deleteTransaction(@Param('entryId') entryId: string) {
      return this.compteService.deleteTransaction(+entryId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCompteDto: UpdateCompteDto) {
    return this.compteService.update(+id, updateCompteDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.compteService.remove(+id);
  }
}
