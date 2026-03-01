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
exports.TimeSlotController = void 0;
const common_1 = require("@nestjs/common");
const time_slot_service_1 = require("./time-slot.service");
const UpdateTimeSlotDto_1 = require("./dto/UpdateTimeSlotDto");
const CreateTimeSlotDto_1 = require("./dto/CreateTimeSlotDto");
const tenant_id_decorator_1 = require("../auth/decorators/tenant-id.decorator");
let TimeSlotController = class TimeSlotController {
    service;
    constructor(service) {
        this.service = service;
    }
    create(tenantId, dto) {
        return this.service.create(tenantId, dto);
    }
    findAll(tenantId) {
        return this.service.findAll(tenantId);
    }
    update(tenantId, id, dto) {
        return this.service.update(tenantId, +id, dto);
    }
    remove(tenantId, id) {
        return this.service.remove(tenantId, +id);
    }
};
exports.TimeSlotController = TimeSlotController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CreateTimeSlotDto_1.CreateTimeSlotDto]),
    __metadata("design:returntype", void 0)
], TimeSlotController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TimeSlotController.prototype, "findAll", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, UpdateTimeSlotDto_1.UpdateTimeSlotDto]),
    __metadata("design:returntype", void 0)
], TimeSlotController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], TimeSlotController.prototype, "remove", null);
exports.TimeSlotController = TimeSlotController = __decorate([
    (0, common_1.Controller)('time-slots'),
    __metadata("design:paramtypes", [time_slot_service_1.TimeSlotService])
], TimeSlotController);
