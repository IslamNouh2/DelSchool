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
exports.ParameterController = void 0;
const common_1 = require("@nestjs/common");
const parameter_service_1 = require("./parameter.service");
const create_parameter_dto_1 = require("./dto/create-parameter.dto");
const update_parameter_dto_1 = require("./dto/update-parameter.dto");
const jwt_auth_guard_1 = require("src/auth/guards/jwt-auth.guard");
const roles_guard_1 = require("src/auth/guards/roles.guard");
const roles_decorator_1 = require("src/auth/decorators/roles.decorator");
const register_dto_1 = require("src/auth/dto/register.dto");
let ParameterController = class ParameterController {
    parameterService;
    constructor(parameterService) {
        this.parameterService = parameterService;
    }
    create(createParameterDto) {
        return this.parameterService.create(createParameterDto);
    }
    findAll() {
        return this.parameterService.findAll();
    }
    findOne(paramName) {
        return this.parameterService.findOne(paramName);
    }
    update(paramName, updateParameterDto) {
        return this.parameterService.update(paramName, updateParameterDto);
    }
    remove(paramName) {
        return this.parameterService.remove(paramName);
    }
    getOkSubSubjectStatus() {
        return this.parameterService.getOkSubSubjectStatus();
    }
};
exports.ParameterController = ParameterController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_parameter_dto_1.CreateParameterDto]),
    __metadata("design:returntype", void 0)
], ParameterController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ParameterController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':paramName'),
    __param(0, (0, common_1.Param)('paramName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ParameterController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':paramName'),
    __param(0, (0, common_1.Param)('paramName')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_parameter_dto_1.UpdateParameterDto]),
    __metadata("design:returntype", void 0)
], ParameterController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':paramName'),
    __param(0, (0, common_1.Param)('paramName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ParameterController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)('ok-sub-subject/status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ParameterController.prototype, "getOkSubSubjectStatus", null);
exports.ParameterController = ParameterController = __decorate([
    (0, common_1.Controller)('parameter'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(register_dto_1.Role.ADMIN),
    __metadata("design:paramtypes", [parameter_service_1.ParameterService])
], ParameterController);
