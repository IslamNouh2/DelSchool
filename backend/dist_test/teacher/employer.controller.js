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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployerController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const employer_service_1 = require("./employer.service");
const path = __importStar(require("path"));
const CreateEmployer_dto_1 = require("./dto/CreateEmployer.dto");
const UpdateEmployer_dto_1 = require("./dto/UpdateEmployer.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const common_2 = require("@nestjs/common");
let EmployerController = class EmployerController {
    employerService;
    constructor(employerService) {
        this.employerService = employerService;
    }
    async searchEmployers(req, page = 1, limit = 10, name, type) {
        return this.employerService.SearchEmployerByName(req.tenantId, page, limit, name, type);
    }
    async getEmployer(req, page = 1, limit = 10, type, search) {
        return this.employerService.GetEmployer(req.tenantId, page, limit, type, search);
    }
    async createStudent(req, dto, photo) {
        return this.employerService.CreateEmployer(req.tenantId, dto, photo);
    }
    async updateEmployer(req, id, dto, photo) {
        return this.employerService.UpdateEmployer(req.tenantId, id, dto, photo);
    }
    async deleteEmployer(req, id, res) {
        try {
            await this.employerService.deleteEmployer(req.tenantId, id);
            return res.status(200).json({ message: "Employer deleted successfully" });
        }
        catch (error) {
            console.error("❌ Delete error:", error);
            return res.status(500).json({ message: "Failed to delete employer", error: error.message });
        }
    }
    async getEmployerById(req, id) {
        return this.employerService.GetEmployerById(req.tenantId, id);
    }
    async searchStudents(req, page, limit, name) {
        return this.employerService.GetEmployerWithName(req.tenantId, name || '', page, limit);
    }
    async assignClass(req, employerId, classId) {
        return this.employerService.assignClassToTeacher(req.tenantId, employerId, classId);
    }
    async getTeacherClass(req, employerId) {
        return this.employerService.getTeacherClass(req.tenantId, employerId);
    }
    // New endpoint to serve photo files
    async getPhoto(fileName, res) {
        try {
            const photoBuffer = await this.employerService.getPhotoFile(fileName);
            const fileExtension = path.extname(fileName).toLowerCase();
            // Set appropriate content type
            let contentType = 'image/jpeg';
            if (fileExtension === '.png')
                contentType = 'image/png';
            if (fileExtension === '.webp')
                contentType = 'image/webp';
            res.set({
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
            });
            res.send(photoBuffer);
        }
        catch (error) {
            res.status(404).send('Photo not found');
        }
    }
    async getCountTeacher(req) {
        return this.employerService.GetCountTeacher(req.tenantId);
    }
    async getCountStaff(req) {
        return this.employerService.GetCountStaff(req.tenantId);
    }
};
exports.EmployerController = EmployerController;
__decorate([
    (0, common_1.Get)('search-by-name'),
    __param(0, (0, common_2.Req)()),
    __param(1, (0, common_1.Query)("page")),
    __param(2, (0, common_1.Query)("limit")),
    __param(3, (0, common_1.Query)("name")),
    __param(4, (0, common_1.Query)("type")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number, String, String]),
    __metadata("design:returntype", Promise)
], EmployerController.prototype, "searchEmployers", null);
__decorate([
    (0, common_1.Get)('list'),
    __param(0, (0, common_2.Req)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('type')),
    __param(4, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number, String, String]),
    __metadata("design:returntype", Promise)
], EmployerController.prototype, "getEmployer", null);
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
    __param(0, (0, common_2.Req)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, CreateEmployer_dto_1.CreateEmployerDto, Object]),
    __metadata("design:returntype", Promise)
], EmployerController.prototype, "createStudent", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('photo')),
    __param(0, (0, common_2.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, UpdateEmployer_dto_1.UpdateEmployerDto, Object]),
    __metadata("design:returntype", Promise)
], EmployerController.prototype, "updateEmployer", null);
__decorate([
    (0, common_1.Delete)(":id"),
    __param(0, (0, common_2.Req)()),
    __param(1, (0, common_1.Param)("id", common_1.ParseIntPipe)),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Object]),
    __metadata("design:returntype", Promise)
], EmployerController.prototype, "deleteEmployer", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_2.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], EmployerController.prototype, "getEmployerById", null);
__decorate([
    (0, common_1.Get)(''),
    __param(0, (0, common_2.Req)()),
    __param(1, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(10), common_1.ParseIntPipe)),
    __param(3, (0, common_1.Query)('name')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number, String]),
    __metadata("design:returntype", Promise)
], EmployerController.prototype, "searchStudents", null);
__decorate([
    (0, common_1.Post)('assign-class'),
    __param(0, (0, common_2.Req)()),
    __param(1, (0, common_1.Body)('employerId', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)('classId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number]),
    __metadata("design:returntype", Promise)
], EmployerController.prototype, "assignClass", null);
__decorate([
    (0, common_1.Get)('teacher-class/:employerId'),
    __param(0, (0, common_2.Req)()),
    __param(1, (0, common_1.Param)('employerId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], EmployerController.prototype, "getTeacherClass", null);
__decorate([
    (0, common_1.Get)('photo/:fileName'),
    __param(0, (0, common_1.Param)('fileName')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EmployerController.prototype, "getPhoto", null);
__decorate([
    (0, common_1.Get)('count/teacher'),
    __param(0, (0, common_2.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmployerController.prototype, "getCountTeacher", null);
__decorate([
    (0, common_1.Get)('count/staff'),
    __param(0, (0, common_2.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmployerController.prototype, "getCountStaff", null);
exports.EmployerController = EmployerController = __decorate([
    (0, common_2.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('employer'),
    __metadata("design:paramtypes", [employer_service_1.EmployerService])
], EmployerController);
