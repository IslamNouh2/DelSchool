
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 6.4.1
 * Query Engine version: a9055b89e58b4b5bfb59600785423b1db3d0e75d
 */
Prisma.prismaVersion = {
  client: "6.4.1",
  engine: "a9055b89e58b4b5bfb59600785423b1db3d0e75d"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  email: 'email',
  username: 'username',
  password: 'password',
  role: 'role',
  deletedAt: 'deletedAt'
};

exports.Prisma.AuditLogScalarFieldEnum = {
  id: 'id',
  action: 'action',
  entity: 'entity',
  entityId: 'entityId',
  userId: 'userId',
  details: 'details',
  createdAt: 'createdAt'
};

exports.Prisma.RefreshTokenScalarFieldEnum = {
  id: 'id',
  token: 'token',
  userId: 'userId',
  expiresAt: 'expiresAt',
  createdAt: 'createdAt',
  revoked: 'revoked',
  deviceId: 'deviceId'
};

exports.Prisma.TokenRevocationScalarFieldEnum = {
  id: 'id',
  jti: 'jti',
  expiresAt: 'expiresAt',
  createdAt: 'createdAt'
};

exports.Prisma.StudentScalarFieldEnum = {
  studentId: 'studentId',
  firstName: 'firstName',
  lastName: 'lastName',
  dateOfBirth: 'dateOfBirth',
  gender: 'gender',
  address: 'address',
  parentId: 'parentId',
  code: 'code',
  health: 'health',
  dateCreate: 'dateCreate',
  dateModif: 'dateModif',
  lieuOfBirth: 'lieuOfBirth',
  bloodType: 'bloodType',
  etatCivil: 'etatCivil',
  cid: 'cid',
  nationality: 'nationality',
  observation: 'observation',
  numNumerisation: 'numNumerisation',
  dateInscription: 'dateInscription',
  okBlock: 'okBlock',
  photoFileName: 'photoFileName'
};

exports.Prisma.ParentScalarFieldEnum = {
  parentId: 'parentId',
  father: 'father',
  mother: 'mother',
  fatherJob: 'fatherJob',
  motherJob: 'motherJob',
  fatherNumber: 'fatherNumber',
  motherNumber: 'motherNumber'
};

exports.Prisma.LocalScalarFieldEnum = {
  localId: 'localId',
  name: 'name',
  code: 'code',
  dateCreate: 'dateCreate',
  dateModif: 'dateModif',
  NumClass: 'NumClass',
  size: 'size'
};

exports.Prisma.ClassesScalarFieldEnum = {
  classId: 'classId',
  ClassName: 'ClassName',
  code: 'code',
  dateCreate: 'dateCreate',
  dateModif: 'dateModif',
  NumStudent: 'NumStudent',
  localId: 'localId',
  okBlock: 'okBlock',
  cloture: 'cloture'
};

exports.Prisma.SubjectScalarFieldEnum = {
  subjectId: 'subjectId',
  subjectName: 'subjectName',
  totalGrads: 'totalGrads',
  parentId: 'parentId',
  BG: 'BG',
  BD: 'BD',
  level: 'level',
  dateCreate: 'dateCreate',
  dateModif: 'dateModif',
  okBlock: 'okBlock'
};

exports.Prisma.ParameterScalarFieldEnum = {
  paramId: 'paramId',
  paramName: 'paramName',
  okActive: 'okActive'
};

exports.Prisma.Subject_localScalarFieldEnum = {
  subjectLocalId: 'subjectLocalId',
  subjectId: 'subjectId',
  localId: 'localId',
  cloture: 'cloture',
  dateCreate: 'dateCreate',
  dateModif: 'dateModif'
};

exports.Prisma.StudentClassScalarFieldEnum = {
  id: 'id',
  studentId: 'studentId',
  classId: 'classId',
  isCurrent: 'isCurrent',
  cloture: 'cloture',
  schoolYearId: 'schoolYearId'
};

exports.Prisma.SchoolYearScalarFieldEnum = {
  id: 'id',
  year: 'year',
  startDate: 'startDate',
  endDate: 'endDate',
  isCurrent: 'isCurrent'
};

exports.Prisma.EmployerScalarFieldEnum = {
  employerId: 'employerId',
  firstName: 'firstName',
  lastName: 'lastName',
  dateOfBirth: 'dateOfBirth',
  lieuOfBirth: 'lieuOfBirth',
  gender: 'gender',
  address: 'address',
  fatherName: 'fatherName',
  motherName: 'motherName',
  code: 'code',
  health: 'health',
  dateCreate: 'dateCreate',
  dateModif: 'dateModif',
  bloodType: 'bloodType',
  etatCivil: 'etatCivil',
  cid: 'cid',
  nationality: 'nationality',
  observation: 'observation',
  numNumerisation: 'numNumerisation',
  dateInscription: 'dateInscription',
  okBlock: 'okBlock',
  type: 'type',
  photoFileName: 'photoFileName',
  phone: 'phone',
  weeklyWorkload: 'weeklyWorkload',
  salary: 'salary'
};

exports.Prisma.TeaherClassScalarFieldEnum = {
  id: 'id',
  employerId: 'employerId',
  classId: 'classId',
  isCurrent: 'isCurrent'
};

exports.Prisma.TeacherSubjectScalarFieldEnum = {
  id: 'id',
  employerId: 'employerId',
  subjectId: 'subjectId',
  isCurrent: 'isCurrent'
};

exports.Prisma.TimeSlotScalarFieldEnum = {
  id: 'id',
  label: 'label',
  startTime: 'startTime',
  endTime: 'endTime',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TimetableScalarFieldEnum = {
  id: 'id',
  day: 'day',
  classId: 'classId',
  subjectId: 'subjectId',
  timeSlotId: 'timeSlotId',
  employerId: 'employerId',
  academicYear: 'academicYear'
};

exports.Prisma.StudentAttendanceScalarFieldEnum = {
  id: 'id',
  studentId: 'studentId',
  classId: 'classId',
  date: 'date',
  status: 'status',
  academicYear: 'academicYear'
};

exports.Prisma.EmployerAttendanceScalarFieldEnum = {
  id: 'id',
  employerId: 'employerId',
  date: 'date',
  checkInTime: 'checkInTime',
  checkOutTime: 'checkOutTime',
  status: 'status',
  remarks: 'remarks',
  academicYear: 'academicYear'
};

exports.Prisma.ExamScalarFieldEnum = {
  id: 'id',
  examName: 'examName',
  dateStart: 'dateStart',
  dateEnd: 'dateEnd',
  dateCreate: 'dateCreate',
  dateModif: 'dateModif',
  publish: 'publish'
};

exports.Prisma.GradsScalarFieldEnum = {
  id: 'id',
  grads: 'grads',
  dateCreate: 'dateCreate',
  dateModif: 'dateModif',
  examId: 'examId',
  studentClassId: 'studentClassId',
  subjectId: 'subjectId'
};

exports.Prisma.CompteScalarFieldEnum = {
  id: 'id',
  name: 'name',
  parentId: 'parentId',
  BG: 'BG',
  BD: 'BD',
  level: 'level',
  dateCreate: 'dateCreate',
  dateModif: 'dateModif',
  isPosted: 'isPosted',
  employerId: 'employerId',
  studentId: 'studentId',
  code: 'code',
  nameAr: 'nameAr',
  selectionCode: 'selectionCode',
  isFeeCash: 'isFeeCash',
  showInParent: 'showInParent',
  nature: 'nature',
  category: 'category'
};

exports.Prisma.FeeScalarFieldEnum = {
  id: 'id',
  title: 'title',
  amount: 'amount',
  dueDate: 'dueDate',
  classId: 'classId',
  studentId: 'studentId',
  description: 'description',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  compteId: 'compteId',
  dateEndConsommation: 'dateEndConsommation',
  dateStartConsommation: 'dateStartConsommation'
};

exports.Prisma.PayrollScalarFieldEnum = {
  id: 'id',
  employerId: 'employerId',
  period_start: 'period_start',
  period_end: 'period_end',
  baseSalary: 'baseSalary',
  allowances: 'allowances',
  deductions: 'deductions',
  netSalary: 'netSalary',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  compteId: 'compteId'
};

exports.Prisma.ExpenseScalarFieldEnum = {
  id: 'id',
  title: 'title',
  category: 'category',
  amount: 'amount',
  expenseDate: 'expenseDate',
  description: 'description',
  isPaid: 'isPaid',
  dateStartConsommation: 'dateStartConsommation',
  dateEndConsommation: 'dateEndConsommation',
  isAmortization: 'isAmortization',
  compteId: 'compteId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PaymentScalarFieldEnum = {
  id: 'id',
  feeId: 'feeId',
  amount: 'amount',
  date: 'date',
  method: 'method',
  status: 'status',
  transactionId: 'transactionId',
  description: 'description',
  studentId: 'studentId',
  employerId: 'employerId',
  compteId: 'compteId',
  compteSourceId: 'compteSourceId',
  compteDestId: 'compteDestId',
  expenseId: 'expenseId'
};

exports.Prisma.JournalScalarFieldEnum = {
  id: 'id',
  code: 'code',
  name: 'name',
  type: 'type',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  createdBy: 'createdBy'
};

exports.Prisma.JournalEntryScalarFieldEnum = {
  id: 'id',
  journalId: 'journalId',
  entryNumber: 'entryNumber',
  date: 'date',
  referenceType: 'referenceType',
  referenceId: 'referenceId',
  description: 'description',
  totalDebit: 'totalDebit',
  totalCredit: 'totalCredit',
  status: 'status',
  createdAt: 'createdAt',
  postedAt: 'postedAt',
  createdBy: 'createdBy',
  postedBy: 'postedBy'
};

exports.Prisma.JournalLineScalarFieldEnum = {
  id: 'id',
  entryId: 'entryId',
  compteId: 'compteId',
  lineNumber: 'lineNumber',
  debit: 'debit',
  credit: 'credit',
  description: 'description'
};

exports.Prisma.FiscalYearScalarFieldEnum = {
  id: 'id',
  year: 'year',
  startDate: 'startDate',
  endDate: 'endDate',
  isClosed: 'isClosed',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.Role = exports.$Enums.Role = {
  ADMIN: 'ADMIN',
  TEACHER: 'TEACHER',
  STUDENT: 'STUDENT'
};

exports.AttendanceStatus = exports.$Enums.AttendanceStatus = {
  PRESENT: 'PRESENT',
  ABSENT: 'ABSENT',
  LATE: 'LATE',
  EXCUSED: 'EXCUSED'
};

exports.AccountNature = exports.$Enums.AccountNature = {
  ASSET: 'ASSET',
  LIABILITY: 'LIABILITY',
  EQUITY: 'EQUITY',
  INCOME: 'INCOME',
  EXPENSE: 'EXPENSE'
};

exports.CompteCategory = exports.$Enums.CompteCategory = {
  GENERAL: 'GENERAL',
  CAISSE: 'CAISSE',
  BANQUE: 'BANQUE',
  RECETTE: 'RECETTE',
  DEPENSE: 'DEPENSE'
};

exports.PayrollStatus = exports.$Enums.PayrollStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  PAID: 'PAID'
};

exports.PaymentMethod = exports.$Enums.PaymentMethod = {
  CASH: 'CASH',
  CARD: 'CARD',
  BANK_TRANSFER: 'BANK_TRANSFER',
  ONLINE: 'ONLINE'
};

exports.PaymentStatus = exports.$Enums.PaymentStatus = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
};

exports.JournalType = exports.$Enums.JournalType = {
  CASH: 'CASH',
  BANK: 'BANK',
  PAYROLL: 'PAYROLL',
  GENERAL: 'GENERAL'
};

exports.JournalEntryStatus = exports.$Enums.JournalEntryStatus = {
  DRAFT: 'DRAFT',
  POSTED: 'POSTED',
  REVERSED: 'REVERSED',
  CANCELLED: 'CANCELLED'
};

exports.Prisma.ModelName = {
  User: 'User',
  AuditLog: 'AuditLog',
  RefreshToken: 'RefreshToken',
  TokenRevocation: 'TokenRevocation',
  Student: 'Student',
  Parent: 'Parent',
  Local: 'Local',
  classes: 'classes',
  subject: 'subject',
  parameter: 'parameter',
  subject_local: 'subject_local',
  StudentClass: 'StudentClass',
  SchoolYear: 'SchoolYear',
  Employer: 'Employer',
  TeaherClass: 'TeaherClass',
  TeacherSubject: 'TeacherSubject',
  TimeSlot: 'TimeSlot',
  Timetable: 'Timetable',
  StudentAttendance: 'StudentAttendance',
  EmployerAttendance: 'EmployerAttendance',
  Exam: 'Exam',
  Grads: 'Grads',
  Compte: 'Compte',
  Fee: 'Fee',
  Payroll: 'Payroll',
  Expense: 'Expense',
  Payment: 'Payment',
  Journal: 'Journal',
  JournalEntry: 'JournalEntry',
  JournalLine: 'JournalLine',
  FiscalYear: 'FiscalYear'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
