import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FeeService } from './fee.service';
import { CreateFeeDto } from './dto/create-fee.dto';
import { SubscribeStudentDto } from './dto/subscribe-student.dto';

@Controller('fees')
export class FeeController {
  constructor(private readonly feeService: FeeService) {}

  @Post('templates')
  createTemplate(@Req() req: any, @Body() dto: CreateFeeDto) {
    return this.feeService.createTemplate(req.tenantId, dto);
  }

  @Get('templates')
  findAllTemplates(@Req() req: any) {
    return this.feeService.findAllTemplates(req.tenantId);
  }

  @Post('subscribe')
  subscribeStudent(@Req() req: any, @Body() dto: SubscribeStudentDto) {
    return this.feeService.subscribeStudent(req.tenantId, dto);
  }

  @Post('subscribe-all')
  subscribeAll(
    @Req() req: any,
    @Body() body: { templateId: number; dueDate: string },
  ) {
    return this.feeService.subscribeAll(
      req.tenantId,
      body.templateId,
      body.dueDate,
    );
  }

  @Post('manual')
  createManualFee(@Req() req: any, @Body() dto: CreateFeeDto) {
    return this.feeService.createManualFee(req.tenantId, dto);
  }

  @Get('student/:id')
  getStudentFees(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.feeService.getStudentFees(req.tenantId, id);
  }

  @Delete(':id')
  deleteFee(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.feeService.deleteFee(req.tenantId, id);
  }
}
