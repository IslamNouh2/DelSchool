"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const student_service_1 = require("./student.service");
const CreateStudentDto_1 = require("./dto/CreateStudentDto");
const UpdateStudentDto_1 = require("./dto/UpdateStudentDto");
const path = __importStar(require("path"));
const local_service_1 = require("src/local/local.service");
const fee_service_1 = require("src/fee/fee.service");
let StudentController = class StudentController {
    studentService;
    localservice;
    feeService;
    constructor(studentService, localservice, feeService) {
        this.studentService = studentService;
        this.localservice = localservice;
        this.feeService = feeService;
    }
    async getLocalsFromStudentController(req) {
        try {
            return await this.localservice.getAllLocals(req.tenantId);
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    async getCountStudent(req) {
        return this.studentService.GetCountStudent(req.tenantId);
    }
    async getCountsByGender(req) {
        return this.studentService.GetCountStudent(req.tenantId);
    }
    async createStudent(req, dto, photo) {
        return this.studentService.CreateStudent(req.tenantId, dto, photo);
    }
    async updateStudent(req, id, dto, photo) {
        return this.studentService.UpdateStudent(req.tenantId, id, dto, photo);
    }
    async deleteStudent(req, id) {
        return this.studentService.DeleteStudent(req.tenantId, id);
    }
    async getStudents(req, page = 1, limit = 10, classId, status, search) {
        return this.studentService.GetStudent(req.tenantId, page, limit, classId, status, search);
    }
    async getStudentById(req, id) {
        return this.studentService.GetStudentById(req.tenantId, id);
    }
    async searchStudents(req, name, page = 1, limit = 10) {
        return this.studentService.GetStudentWithName(req.tenantId, name, page, limit);
    }
    async getPhoto(fileName, res) {
        try {
            const photoBuffer = await this.studentService.getPhotoFile(fileName);
            const fileExtension = path.extname(fileName).toLowerCase();
            let contentType = 'image/jpeg';
            if (fileExtension === '.png')
                contentType = 'image/png';
            if (fileExtension === '.webp')
                contentType = 'image/webp';
            res.set({
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000',
            });
            res.send(photoBuffer);
        }
        catch (error) {
            res.status(404).send('Photo not found');
        }
    }
    async getPendingFees(req, id) {
        return this.feeService.getPendingFees(req.tenantId, id);
    }
};
exports.StudentController = StudentController;
__decorate([
    (0, common_1.Get)('all-locals'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StudentController.prototype, "getLocalsFromStudentController", null);
__decorate([
    (0, common_1.Get)('count'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StudentController.prototype, "getCountStudent", null);
__decorate([
    (0, common_1.Get)('counts-by-gender'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StudentController.prototype, "getCountsByGender", null);
__decorate([
    (0, common_1.Post)('create'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('photo', {
        limits: {
            fileSize: 5 * 1024 * 1024, // 5MB
        },
        fileFilter: (req, file, cb) => {
            const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
            if (allowedMimes.includes(file.mimetype)) {
                cb(null, true);
            }
            else {
                cb(new common_1.HttpException('Invalid file type', common_1.HttpStatus.BAD_REQUEST), false);
            }
        },
    })),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, CreateStudentDto_1.CreateStudentDto, Object]),
    __metadata("design:returntype", Promise)
], StudentController.prototype, "createStudent", null);
__decorate([
    (0, common_1.Put)('update/:id'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('photo', {
        limits: {
            fileSize: 5 * 1024 * 1024, // 5MB
        },
        fileFilter: (req, file, cb) => {
            const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
            if (allowedMimes.includes(file.mimetype)) {
                cb(null, true);
            }
            else {
                cb(new common_1.HttpException('Invalid file type', common_1.HttpStatus.BAD_REQUEST), false);
            }
        },
    })),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, UpdateStudentDto_1.UpdateStudentDto, Object]),
    __metadata("design:returntype", Promise)
], StudentController.prototype, "updateStudent", null);
__decorate([
    (0, common_1.Delete)('delete/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], StudentController.prototype, "deleteStudent", null);
__decorate([
    (0, common_1.Get)('list'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('classId')),
    __param(4, (0, common_1.Query)('status')),
    __param(5, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number, Number, String, String]),
    __metadata("design:returntype", Promise)
], StudentController.prototype, "getStudents", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], StudentController.prototype, "getStudentById", null);
__decorate([
    (0, common_1.Get)('search'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('name')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Number, Number]),
    __metadata("design:returntype", Promise)
], StudentController.prototype, "searchStudents", null);
__decorate([
    (0, common_1.Get)('photo/:fileName'),
    __param(0, (0, common_1.Param)('fileName')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], StudentController.prototype, "getPhoto", null);
__decorate([
    (0, common_1.Get)(':id/pending-fees'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], StudentController.prototype, "getPendingFees", null);
exports.StudentController = StudentController = __decorate([
    (0, common_1.Controller)('student'),
    __metadata("design:paramtypes", [student_service_1.StudentService, typeof (_a = typeof local_service_1.LocalService !== "undefined" && local_service_1.LocalService) === "function" ? _a : Object, typeof (_b = typeof fee_service_1.FeeService !== "undefined" && fee_service_1.FeeService) === "function" ? _b : Object])
], StudentController);
