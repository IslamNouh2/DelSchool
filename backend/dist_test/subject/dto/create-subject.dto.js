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
exports.CreateSubjectDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateSubjectDto {
    subjectName;
    totalGrads;
    parentId;
    okBlock;
    translations;
}
exports.CreateSubjectDto = CreateSubjectDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Mathematics' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateSubjectDto.prototype, "subjectName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 20 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateSubjectDto.prototype, "totalGrads", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: -1, required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateSubjectDto.prototype, "parentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateSubjectDto.prototype, "okBlock", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: { en: 'Math', ar: 'رياضيات', fr: 'Maths' }, required: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateSubjectDto.prototype, "translations", void 0);
