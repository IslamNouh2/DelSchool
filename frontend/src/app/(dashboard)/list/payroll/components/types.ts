export interface Payroll {
  id: number;
  employerId: number;
  period_start: string;
  period_end: string;
  baseSalary: string;
  allowances: string;
  deductions: string;
  netSalary: string;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "PAID";
  compteId?: number;
  compte?: {
    id: number;
    name: string;
    code: string;
  };
  employer: {
    firstName: string;
    lastName: string;
    code: string;
    photoFileName?: string;
  };
}
