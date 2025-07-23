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
  BadRequestException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { StudentService } from './student.service';
import { CreateStudentDto } from './dto/CreateStudentDto';
import { UpdateStudentDto } from './dto/UpdateStudentDto';
import * as path from 'path';
import { LocalService } from 'src/local/local.service';

@Controller('student')
export class StudentController {
  constructor(
    private readonly studentService: StudentService,
    private readonly localservice: LocalService,
  ) { }

  @Get('all-locals')
  async getLocalsFromStudentController() {
    try {
      return await this.localservice.getAllLocals();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('count')
  async getCountStudent() {
    return this.studentService.GetCountStudent();
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
    @Body() dto: CreateStudentDto,
    @UploadedFile() photo?: Express.Multer.File
  ) {
    return this.studentService.CreateStudent(dto, photo);
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
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStudentDto,
    @UploadedFile() photo?: Express.Multer.File
  ) {
    return this.studentService.UpdateStudent(id, dto, photo);
  }

  @Delete('delete/:id')
  async deleteStudent(@Param('id', ParseIntPipe) id: number) {
    return this.studentService.DeleteStudent(id);
  }

  @Get('list')
  async getStudents(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ) {
    return this.studentService.GetStudent(page, limit);
  }

  @Get(':id')
  async getStudentById(@Param('id', ParseIntPipe) id: number) {
    return this.studentService.GetStudentById(id);
  }

  @Get('search')
  async searchStudents(
    @Query('name') name: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ) {
    return this.studentService.GetStudentWithName(name, page, limit);
  }

  // New endpoint to serve photo files
  @Get('photo/:fileName')
  async getPhoto(
    @Param('fileName') fileName: string,
    @Res() res: Response
  ) {
    try {
      const photoBuffer = await this.studentService.getPhotoFile(fileName);
      const fileExtension = path.extname(fileName).toLowerCase();

      // Set appropriate content type
      let contentType = 'image/jpeg';
      if (fileExtension === '.png') contentType = 'image/png';
      if (fileExtension === '.webp') contentType = 'image/webp';

      res.set({
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      });

      res.send(photoBuffer);
    } catch (error) {
      res.status(404).send('Photo not found');
    }
  }


  
}