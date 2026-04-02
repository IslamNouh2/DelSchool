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
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { StudentService } from './student.service';
import { CreateStudentDto } from './dto/CreateStudentDto';
import { UpdateStudentDto } from './dto/UpdateStudentDto';
import * as path from 'path';
import { LocalService } from 'src/local/local.service';
import { FeeService } from 'src/fee/fee.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { TenantId } from 'src/auth/decorators/tenant-id.decorator';
import { Public } from 'src/common/decorators/public.decorator';

@ApiTags('Students')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('student')
export class StudentController {
  constructor(
    private readonly studentService: StudentService,
    private readonly localservice: LocalService,
    private readonly feeService: FeeService,
  ) {}

  @Get('all-locals')
  async getLocalsFromStudentController(@TenantId() tenantId: string) {
    try {
      return await this.localservice.getAllLocals(tenantId);
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('An error occurred');
    }
  }

  @Get('count')
  @ApiOperation({ summary: 'Get total student count' })
  @ApiResponse({ status: 200, description: 'Returns the count of students' })
  async getCountStudent(@TenantId() tenantId: string) {
    return this.studentService.GetCountStudent(tenantId);
  }

  @Get('counts-by-gender')
  @ApiOperation({ summary: 'Get student counts by gender' })
  @ApiResponse({ status: 200, description: 'Returns counts by gender' })
  async getCountsByGender(@TenantId() tenantId: string) {
    return this.studentService.GetCountStudent(tenantId);
  }

  @Post('create')
  @ApiOperation({ summary: 'Create a new student' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Student successfully created' })
  @UseInterceptors(
    FileInterceptor('photo', {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new HttpException('Invalid file type', HttpStatus.BAD_REQUEST),
            false,
          );
        }
      },
    }),
  )
  async createStudent(
    @TenantId() tenantId: string,
    @Body() dto: CreateStudentDto,
    @UploadedFile() photo?: Express.Multer.File,
  ) {
    return this.studentService.CreateStudent(tenantId, dto, photo);
  }

  @Put('update/:id')
  @UseInterceptors(
    FileInterceptor('photo', {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new HttpException('Invalid file type', HttpStatus.BAD_REQUEST),
            false,
          );
        }
      },
    }),
  )
  async updateStudent(
    @TenantId() tenantId: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStudentDto,
    @UploadedFile() photo?: Express.Multer.File,
  ) {
    return this.studentService.UpdateStudent(tenantId, id, dto, photo);
  }

  @Delete('delete/:id')
  async deleteStudent(
    @TenantId() tenantId: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.studentService.DeleteStudent(tenantId, id);
  }

  @Get('list')
  @ApiOperation({ summary: 'Get list of students with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'classId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({
    status: 200,
    description: 'Returns a paginated list of students',
    schema: {
      example: {
        data: [],
        total: 120,
        page: 1,
        limit: 10,
      },
    },
  })
  async getStudents(
    @TenantId() tenantId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('classId') classId?: number,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.studentService.GetStudent(
      tenantId,
      page,
      limit,
      classId,
      status,
      search,
    );
  }

  @Get(':id')
  async getStudentById(
    @TenantId() tenantId: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.studentService.GetStudentById(tenantId, id);
  }

  @Get('search')
  async searchStudents(
    @TenantId() tenantId: string,
    @Query('name') name: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.studentService.GetStudentWithName(tenantId, name, page, limit);
  }

  @Public()
  @Get('photo/:fileName')
  async getPhoto(@Param('fileName') fileName: string, @Res() res: Response) {
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
    } catch {
      res.status(404).send('Photo not found');
    }
  }

  @Get(':id/pending-fees')
  async getPendingFees(
    @TenantId() tenantId: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.feeService.getPendingFees(tenantId, id);
  }
}
