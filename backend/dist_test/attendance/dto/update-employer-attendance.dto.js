"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateEmployerAttendanceDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_employer_attendance_dto_1 = require("./create-employer-attendance.dto");
class UpdateEmployerAttendanceDto extends (0, mapped_types_1.PartialType)(create_employer_attendance_dto_1.CreateEmployerAttendanceDto) {
}
exports.UpdateEmployerAttendanceDto = UpdateEmployerAttendanceDto;
