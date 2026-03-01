"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateTimeSlotDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const CreateTimeSlotDto_1 = require("./CreateTimeSlotDto");
class UpdateTimeSlotDto extends (0, mapped_types_1.PartialType)(CreateTimeSlotDto_1.CreateTimeSlotDto) {
}
exports.UpdateTimeSlotDto = UpdateTimeSlotDto;
