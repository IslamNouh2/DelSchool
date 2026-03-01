"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassController = void 0;
const common_1 = require("@nestjs/common");
const class_service_1 = require("./class.service");
const CreateClass_dto_1 = require("./DTO/CreateClass.dto");
const UpdateClass_dto_1 = require("./DTO/UpdateClass.dto");
const jwt_auth_guard_1 = require("src/auth/guards/jwt-auth.guard");
const roles_guard_1 = require("src/auth/guards/roles.guard");
const roles_decorator_1 = require("src/auth/decorators/roles.decorator");
const register_dto_1 = require("src/auth/dto/register.dto");
let ClassController = class ClassController {
    classService;
    constructor(classService) {
        this.classService = classService;
    }
    async getClasses(req, page = '1', limit = '10', sort, search) {
        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);
        const validSortFields = ['dateCreate', 'code', 'ClassName'];
        const orderByField = validSortFields.includes(sort) ? sort : 'dateCreate';
        return this.classService.GetClasses(req.tenantId, pageNumber, limitNumber, orderByField, search);
    }
    async CreateClass(req, dto) {
        const res = await this.classService.CreateClass(req.tenantId, dto);
        return res;
    }
    async DeleteLocal(req, id) {
        const Delete = await this.classService.DeleteLocal(req.tenantId, id);
        return { message: 'Class deleted successfully' };
    }
    async UpdateLocals(req, id, dto) {
        const classS = await this.classService.UpdateLocal(req.tenantId, id, dto);
        return classS;
    }
};
exports.ClassController = ClassController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('sort')),
    __param(4, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], ClassController.prototype, "getClasses", null);
__decorate([
    (0, common_1.Post)('create'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, CreateClass_dto_1.CreateClassDto]),
    __metadata("design:returntype", Promise)
], ClassController.prototype, "CreateClass", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], ClassController.prototype, "DeleteLocal", null);
__decorate([
    (0, common_1.Put)('/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, UpdateClass_dto_1.UpdateClassDto]),
    __metadata("design:returntype", Promise)
], ClassController.prototype, "UpdateLocals", null);
exports.ClassController = ClassController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(register_dto_1.Role.ADMIN),
    (0, common_1.Controller)('class'),
    __metadata("design:paramtypes", [class_service_1.ClassService])
], ClassController);
