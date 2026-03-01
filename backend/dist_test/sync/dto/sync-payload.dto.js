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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BulkSyncDto = exports.SyncOperationDto = exports.SyncOperationType = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
var SyncOperationType;
(function (SyncOperationType) {
    SyncOperationType["CREATE"] = "CREATE";
    SyncOperationType["UPDATE"] = "UPDATE";
    SyncOperationType["DELETE"] = "DELETE";
})(SyncOperationType || (exports.SyncOperationType = SyncOperationType = {}));
class SyncOperationDto {
    operationId;
    type;
    entity; // e.g., 'Student', 'Fee', 'Employer', etc.
    data;
    version;
}
exports.SyncOperationDto = SyncOperationDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SyncOperationDto.prototype, "operationId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(SyncOperationType),
    __metadata("design:type", String)
], SyncOperationDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SyncOperationDto.prototype, "entity", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], SyncOperationDto.prototype, "data", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], SyncOperationDto.prototype, "version", void 0);
class BulkSyncDto {
    operations;
}
exports.BulkSyncDto = BulkSyncDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => SyncOperationDto),
    __metadata("design:type", Array)
], BulkSyncDto.prototype, "operations", void 0);
