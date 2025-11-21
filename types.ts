export interface Member {
  id: string;
  name: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  payerId: string;
  date: string;
  involvedMemberIds?: string[]; // List of member IDs who share this expense. If undefined/empty, implies all.
}

export interface Trip {
  id: string;
  name: string;
  coverImage: string; // URL
  startDate: string;
  members: Member[];
  expenses: Expense[];
}

export interface Debt {
  from: string; // Member Name
  to: string;   // Member Name
  amount: number;
}

// For Gemini Parsing
export interface ParsedExpense {
  description: string;
  amount: number;
  payerName: string; // AI guesses the name
}