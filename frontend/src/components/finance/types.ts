export type FinancialStatus = 'PAID' | 'PARTIAL' | 'OVERDUE' | 'UPCOMING';

export interface StudentFinancial {
    totalDue: number;
    totalPaid: number;
    balance: number;
    status: FinancialStatus;
    subscriptions: string[];
}

export interface StudentWithFinance {
    studentId: number;
    firstName: string;
    lastName: string;
    code: string;
    gender: string;
    photoUrl: string | null;
    studentClasses: Array<{
        Class: {
            ClassName: string;
        };
    }>;
    financial: StudentFinancial;
}

export interface FeeTemplate {
    id: number;
    title: string;
    amount: number;
    dueDate: string;
    description: string | null;
    compteId: number | null;
    dateStartConsommation: string | null;
    dateEndConsommation: string | null;
}

export interface TransactionHistory {
    type: 'FEE' | 'PAYMENT';
    date: string;
    amount: number;
    title?: string;
    method?: string;
    id: number;
}
