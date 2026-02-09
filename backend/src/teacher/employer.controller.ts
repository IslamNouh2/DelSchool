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
    DefaultValuePipe
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { EmployerService } from "./employer.service";
import * as path from 'path';
import { CreateEmployerDto } from './dto/CreateEmployer.dto';
import { UpdateEmployerDto } from './dto/UpdateEmployer.dto';
import { EmployerNameSearchDto } from './dto/EmployerQueryParamsDto';

@Controller('employer')
export class EmployerController {

    constructor(
        private employerService: EmployerService,
    ) { }

    @Get('search-by-name')
    async searchEmployers(
        @Query("page") page: number = 1,
        @Query("limit") limit: number = 10,
        @Query("name") name?: string,
        @Query("type") type?: string
    ) {
        return this.employerService.SearchEmployerByName(page, limit, name, type);
    }


    @Get('list')
    async getEmployer(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
        @Query('type') type?: string
    ) {
        return this.employerService.GetEmployer(page, limit, type);
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
        @Body() dto: CreateEmployerDto,
        @UploadedFile() photo?: Express.Multer.File
    ) {
        return this.employerService.CreateEmployer(dto, photo);
    }

    @Put(':id')
    @UseInterceptors(FileInterceptor('photo'))
    async updateEmployer(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateEmployerDto,
        @UploadedFile() photo?: Express.Multer.File
    ) {
        return this.employerService.UpdateEmployer(id, dto, photo);
    }

    @Delete(":id")
    async deleteEmployer(
        @Param("id", ParseIntPipe) id: number,
        @Res() res: Response,
    ) {
        try {
            await this.employerService.deleteEmployer(id);
            return res.status(200).json({ message: "Employer deleted successfully" });
        } catch (error) {
            console.error("❌ Delete error:", error);
            return res.status(500).json({ message: "Failed to delete employer", error: error.message });
        }
    }


    @Get(':id')
    async getEmployerById(@Param('id', ParseIntPipe) id: number) {
        return this.employerService.GetEmployerById(id);
    }


    @Get('')
    async searchStudents(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
        @Query('name') name: string,
    ) {
        return this.employerService.GetEmployerWithName(name || '', page, limit);
    }





    @Post('assign-class')
    async assignClass(
        @Body('employerId', ParseIntPipe) employerId: number,
        @Body('classId', ParseIntPipe) classId: number,
    ) {
        return this.employerService.assignClassToTeacher(employerId, classId);
    }

    @Get('teacher-class/:employerId')
    async getTeacherClass(@Param('employerId', ParseIntPipe) employerId: number) {
        return this.employerService.getTeacherClass(employerId);
    }

    // New endpoint to serve photo files
    @Get('photo/:fileName')
    async getPhoto(
        @Param('fileName') fileName: string,
        @Res() res: Response
    ) {
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
}