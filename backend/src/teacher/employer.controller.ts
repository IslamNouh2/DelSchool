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
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { EmployerService } from './employer.service';
import * as path from 'path';
import { CreateEmployerDto } from './dto/CreateEmployer.dto';
import { UpdateEmployerDto } from './dto/UpdateEmployer.dto';
import { EmployerNameSearchDto } from './dto/EmployerQueryParamsDto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Req, UseGuards } from '@nestjs/common';

@ApiTags('Teachers')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('employer')
export class EmployerController {
  constructor(private employerService: EmployerService) {}

  @Get('search-by-name')
  @ApiOperation({ summary: 'Search employers by name and type' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'name', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiResponse({ status: 200, description: 'Returns search results' })
  async searchEmployers(
    @Req() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('name') name?: string,
    @Query('type') type?: string,
  ) {
    return this.employerService.SearchEmployerByName(
      req.tenantId,
      page,
      limit,
      name,
      type,
    );
  }

  @Get('list')
  @ApiOperation({ summary: 'Get list of employers with pagination' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({
    status: 200,
    description: 'Returns a paginated list of employers',
    schema: {
      example: {
        data: [],
        total: 50,
        page: 1,
        limit: 10,
      },
    },
  })
  async getEmployer(
    @Req() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('type') type?: string,
    @Query('search') search?: string,
  ) {
    return this.employerService.GetEmployer(
      req.tenantId,
      page,
      limit,
      type,
      search,
    );
  }

  @Post('create')
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
    @Req() req: any,
    @Body() dto: CreateEmployerDto,
    @UploadedFile() photo?: Express.Multer.File,
  ) {
    return this.employerService.CreateEmployer(req.tenantId, dto, photo);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('photo'))
  async updateEmployer(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEmployerDto,
    @UploadedFile() photo?: Express.Multer.File,
  ) {
    return this.employerService.UpdateEmployer(req.tenantId, id, dto, photo);
  }

  @Delete(':id')
  async deleteEmployer(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    try {
      await this.employerService.deleteEmployer(req.tenantId, id);
      return res.status(200).json({ message: 'Employer deleted successfully' });
    } catch (error) {
      console.error('❌ Delete error:', error);
      return res
        .status(500)
        .json({ message: 'Failed to delete employer', error: error.message });
    }
  }

  @Get(':id')
  async getEmployerById(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.employerService.GetEmployerById(req.tenantId, id);
  }

  @Get('')
  async searchStudents(
    @Req() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('name') name: string,
  ) {
    return this.employerService.GetEmployerWithName(
      req.tenantId,
      name || '',
      page,
      limit,
    );
  }

  @Post('assign-class')
  async assignClass(
    @Req() req: any,
    @Body('employerId', ParseIntPipe) employerId: number,
    @Body('classId', ParseIntPipe) classId: number,
  ) {
    return this.employerService.assignClassToTeacher(
      req.tenantId,
      employerId,
      classId,
    );
  }

  @Get('teacher-class/:employerId')
  async getTeacherClass(
    @Req() req: any,
    @Param('employerId', ParseIntPipe) employerId: number,
  ) {
    return this.employerService.getTeacherClass(req.tenantId, employerId);
  }

  // New endpoint to serve photo files
  @Get('photo/:fileName')
  async getPhoto(@Param('fileName') fileName: string, @Res() res: Response) {
    try {
      const photoBuffer = await this.employerService.getPhotoFile(fileName);
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

  @Get('count/teacher')
  @ApiOperation({ summary: 'Get total teacher count' })
  @ApiResponse({ status: 200, description: 'Returns the count of teachers' })
  async getCountTeacher(@Req() req: any) {
    return this.employerService.GetCountTeacher(req.tenantId);
  }

  @Get('count/staff')
  @ApiOperation({ summary: 'Get total staff count' })
  @ApiResponse({ status: 200, description: 'Returns the count of staff' })
  async getCountStaff(@Req() req: any) {
    return this.employerService.GetCountStaff(req.tenantId);
  }
}
