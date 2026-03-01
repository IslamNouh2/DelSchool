"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateStudentAttendanceDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_student_attendance_dto_1 = require("./create-student-attendance.dto");
class UpdateStudentAttendanceDto extends (0, mapped_types_1.PartialType)(create_student_attendance_dto_1.SaveStudentAttendanceDto) {
}
exports.UpdateStudentAttendanceDto = UpdateStudentAttendanceDto;
