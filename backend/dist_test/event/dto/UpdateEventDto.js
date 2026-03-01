"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateEventDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const CreateEventDto_1 = require("./CreateEventDto");
class UpdateEventDto extends (0, mapped_types_1.PartialType)(CreateEventDto_1.CreateEventDto) {
}
exports.UpdateEventDto = UpdateEventDto;
