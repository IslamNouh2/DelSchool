"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const auth_module_1 = require("./auth/auth.module");
const cookieParser = __importStar(require("cookie-parser"));
const subject_module_1 = require("./subject/subject.module");
const parameter_module_1 = require("./parameter/parameter.module");
const local_module_1 = require("./local/local.module");
const subject_local_module_1 = require("./subject-local/subject-local.module");
const class_module_1 = require("./class/class.module");
const student_module_1 = require("./student/student.module");
const employer_module_1 = require("./teacher/employer.module");
const teacher_subject_module_1 = require("./teacher-subject/teacher-subject.module");
const teacher_class_module_1 = require("./teacher-class/teacher-class.module");
const timetable_module_1 = require("./timetable/timetable.module");
const time_slot_module_1 = require("./time-slot/time-slot.module");
const attendance_module_1 = require("./attendance/attendance.module");
const exams_module_1 = require("./exams/exams.module");
const compte_module_1 = require("./compte/compte.module");
const socket_module_1 = require("./socket/socket.module");
const school_year_module_1 = require("./school-year/school-year.module");
const transition_module_1 = require("./transition/transition.module");
const payroll_module_1 = require("./payroll/payroll.module");
const prisma_module_1 = require("prisma/prisma.module");
const fee_module_1 = require("./fee/fee.module");
const payment_module_1 = require("./payment/payment.module");
const expense_module_1 = require("./expense/expense.module");
const finance_module_1 = require("./finance/finance.module");
const event_module_1 = require("./event/event.module");
const sync_module_1 = require("./sync/sync.module");
const core_module_1 = require("./core/core.module");
const throttler_1 = require("@nestjs/throttler");
const schedule_1 = require("@nestjs/schedule");
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(cookieParser()).forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            schedule_1.ScheduleModule.forRoot(),
            throttler_1.ThrottlerModule.forRoot([{
                    ttl: 60000,
                    limit: 10,
                }]),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            subject_module_1.SubjectModule,
            parameter_module_1.ParameterModule,
            local_module_1.LocalModule,
            subject_local_module_1.SubjectLocalModule,
            class_module_1.ClassModule,
            student_module_1.StudentModule,
            employer_module_1.EmployerModule,
            teacher_subject_module_1.TeacherSubjectModule,
            teacher_class_module_1.TeacherClassModule,
            timetable_module_1.TimetableModule,
            time_slot_module_1.TimeSlotModule,
            attendance_module_1.AttendanceModule,
            exams_module_1.ExamsModule,
            compte_module_1.CompteModule,
            socket_module_1.SocketModule,
            school_year_module_1.SchoolYearModule,
            transition_module_1.TransitionModule,
            fee_module_1.FeeModule,
            payment_module_1.PaymentModule,
            payroll_module_1.PayrollModule,
            expense_module_1.ExpenseModule,
            finance_module_1.FinanceModule,
            event_module_1.EventModule,
            sync_module_1.SyncModule,
            core_module_1.CoreModule,
        ],
    })
], AppModule);
