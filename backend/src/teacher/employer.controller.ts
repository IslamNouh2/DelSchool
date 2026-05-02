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
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import 'multer';
import { EmployerService } from './employer.service';
import * as path from 'path';
import { CreateEmployerDto } from './dto/CreateEmployer.dto';
import { UpdateEmployerDto } from './dto/UpdateEmployer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UseGuards } from '@nestjs/common';
import { Public } from 'src/common/decorators/public.decorator';
import { TenantId } from 'src/auth/decorators/tenant-id.decorator';

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
    @TenantId() tenantId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('name') name?: string,
    @Query('type') type?: string,
  ) {
    return this.employerService.SearchEmployerByName(
      tenantId,
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
    @TenantId() tenantId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('type') type?: string,
    @Query('search') search?: string,
  ) {
    return this.employerService.GetEmployer(
      tenantId,
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
  async createEmployer(
    @TenantId() tenantId: string,
    @Body() dto: CreateEmployerDto,
    @UploadedFile() photo?: Express.Multer.File,
  ) {
    return this.employerService.CreateEmployer(tenantId, dto, photo);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('photo'))
  async updateEmployer(
    @TenantId() tenantId: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEmployerDto,
    @UploadedFile() photo?: Express.Multer.File,
  ) {
    return this.employerService.UpdateEmployer(tenantId, id, dto, photo);
  }

  @Delete(':id')
  async deleteEmployer(
    @TenantId() tenantId: string,
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    try {
      await this.employerService.deleteEmployer(tenantId, id);
      return res.status(200).json({ message: 'Employer deleted successfully' });
    } catch (error) {
      console.error('❌ Delete error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return res
        .status(500)
        .json({ message: 'Failed to delete employer', error: errorMessage });
    }
  }

  @Get(':id')
  async getEmployerById(
    @TenantId() tenantId: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.employerService.GetEmployerById(tenantId, id);
  }

  @Get('')
  async searchEmployersByName(
    @TenantId() tenantId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('name') name: string,
  ) {
    return this.employerService.GetEmployerWithName(
      tenantId,
      name || '',
      page,
      limit,
    );
  }

  @Post('assign-class')
  async assignClass(
    @TenantId() tenantId: string,
    @Body('employerId', ParseIntPipe) employerId: number,
    @Body('classId', ParseIntPipe) classId: number,
  ) {
    return this.employerService.assignClassToTeacher(
      tenantId,
      employerId,
      classId,
    );
  }

  @Get('teacher-class/:employerId')
  async getTeacherClass(
    @TenantId() tenantId: string,
    @Param('employerId', ParseIntPipe) employerId: number,
  ) {
    return this.employerService.getTeacherClass(tenantId, employerId);
  }

  // New endpoint to serve photo files
  @Public()
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
    } catch {
      res.status(404).send('Photo not found');
    }
  }

  @Get('count/teacher')
  @ApiOperation({ summary: 'Get total teacher count' })
  @ApiResponse({ status: 200, description: 'Returns the count of teachers' })
  async getCountTeacher(@TenantId() tenantId: string) {
    return this.employerService.GetCountTeacher(tenantId);
  }

  @Get('count/staff')
  @ApiOperation({ summary: 'Get total staff count' })
  @ApiResponse({ status: 200, description: 'Returns the count of staff' })
  async getCountStaff(@TenantId() tenantId: string) {
    return this.employerService.GetCountStaff(tenantId);
  }
}
