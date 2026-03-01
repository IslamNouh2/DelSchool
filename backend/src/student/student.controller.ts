import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
  Res,
  ParseIntPipe,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  BadRequestException,
  UseGuards,
  Req
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response, Request } from 'express';
import { StudentService } from './student.service';
import { CreateStudentDto } from './dto/CreateStudentDto';
import { UpdateStudentDto } from './dto/UpdateStudentDto';
import * as path from 'path';
import { LocalService } from 'src/local/local.service';
import { FeeService } from 'src/fee/fee.service';

@Controller('student')

export class StudentController {
  constructor(
    private readonly studentService: StudentService,
    private readonly localservice: LocalService,
    private readonly feeService: FeeService,
  ) { }

  @Get('all-locals')
  async getLocalsFromStudentController(@Req() req: any) {
    try {
      return await this.localservice.getAllLocals(req.tenantId);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('count')
  async getCountStudent(@Req() req: any) {
    return this.studentService.GetCountStudent(req.tenantId);
  }

  @Get('counts-by-gender')
  async getCountsByGender(@Req() req: any) {
    return this.studentService.GetCountStudent(req.tenantId);
  }

  @Post('create')
  @UseInterceptors(FileInterceptor('photo', {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: (req, file, cb) => {
      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new HttpException('Invalid file type', HttpStatus.BAD_REQUEST), false);
      }
    },
  }))
  async createStudent(
    @Req() req: any,
    @Body() dto: CreateStudentDto,
    @UploadedFile() photo?: Express.Multer.File
  ) {
    return this.studentService.CreateStudent(req.tenantId, dto, photo);
  }

  @Put('update/:id')
  @UseInterceptors(FileInterceptor('photo', {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: (req, file, cb) => {
      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new HttpException('Invalid file type', HttpStatus.BAD_REQUEST), false);
      }
    },
  }))
  async updateStudent(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStudentDto,
    @UploadedFile() photo?: Express.Multer.File
  ) {
    return this.studentService.UpdateStudent(req.tenantId, id, dto, photo);
  }

  @Delete('delete/:id')
  async deleteStudent(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.studentService.DeleteStudent(req.tenantId, id);
  }

  @Get('list')
  async getStudents(
    @Req() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('classId') classId?: number,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.studentService.GetStudent(req.tenantId, page, limit, classId, status, search);
  }

  @Get(':id')
  async getStudentById(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.studentService.GetStudentById(req.tenantId, id);
  }

  @Get('search')
  async searchStudents(
    @Req() req: any,
    @Query('name') name: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ) {
    return this.studentService.GetStudentWithName(req.tenantId, name, page, limit);
  }

  @Get('photo/:fileName')
  async getPhoto(
    @Param('fileName') fileName: string,
    @Res() res: Response
  ) {
    try {
      const photoBuffer = await this.studentService.getPhotoFile(fileName);
      const fileExtension = path.extname(fileName).toLowerCase();

      let contentType = 'image/jpeg';
      if (fileExtension === '.png') contentType = 'image/png';
      if (fileExtension === '.webp') contentType = 'image/webp';

      res.set({
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
      });

      res.send(photoBuffer);
    } catch (error) {
      res.status(404).send('Photo not found');
    }
  }

  @Get(':id/pending-fees')
  async getPendingFees(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.feeService.getPendingFees(req.tenantId, id);
  }
}