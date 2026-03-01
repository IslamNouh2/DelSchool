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
exports.FeeController = void 0;
const common_1 = require("@nestjs/common");
const fee_service_1 = require("./fee.service");
const create_fee_dto_1 = require("./dto/create-fee.dto");
const subscribe_student_dto_1 = require("./dto/subscribe-student.dto");
let FeeController = class FeeController {
    feeService;
    constructor(feeService) {
        this.feeService = feeService;
    }
    createTemplate(req, dto) {
        return this.feeService.createTemplate(req.tenantId, dto);
    }
    findAllTemplates(req) {
        return this.feeService.findAllTemplates(req.tenantId);
    }
    subscribeStudent(req, dto) {
        return this.feeService.subscribeStudent(req.tenantId, dto);
    }
    subscribeAll(req, body) {
        return this.feeService.subscribeAll(req.tenantId, body.templateId, body.dueDate);
    }
    createManualFee(req, dto) {
        return this.feeService.createManualFee(req.tenantId, dto);
    }
    getStudentFees(req, id) {
        return this.feeService.getStudentFees(req.tenantId, id);
    }
    deleteFee(req, id) {
        return this.feeService.deleteFee(req.tenantId, id);
    }
};
exports.FeeController = FeeController;
__decorate([
    (0, common_1.Post)('templates'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_fee_dto_1.CreateFeeDto]),
    __metadata("design:returntype", void 0)
], FeeController.prototype, "createTemplate", null);
__decorate([
    (0, common_1.Get)('templates'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FeeController.prototype, "findAllTemplates", null);
__decorate([
    (0, common_1.Post)('subscribe'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, subscribe_student_dto_1.SubscribeStudentDto]),
    __metadata("design:returntype", void 0)
], FeeController.prototype, "subscribeStudent", null);
__decorate([
    (0, common_1.Post)('subscribe-all'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], FeeController.prototype, "subscribeAll", null);
__decorate([
    (0, common_1.Post)('manual'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_fee_dto_1.CreateFeeDto]),
    __metadata("design:returntype", void 0)
], FeeController.prototype, "createManualFee", null);
__decorate([
    (0, common_1.Get)('student/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], FeeController.prototype, "getStudentFees", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], FeeController.prototype, "deleteFee", null);
exports.FeeController = FeeController = __decorate([
    (0, common_1.Controller)('fees'),
    __metadata("design:paramtypes", [fee_service_1.FeeService])
], FeeController);
