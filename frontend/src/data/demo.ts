import type { ExpenseItem, FinancialInput } from '@shared/finance'

export const DEFAULT_EXPENSES: ExpenseItem[] = [
  { id: 'housing', name: 'Rent / Housing', amount: 0, type: 'need' },
  { id: 'food', name: 'Food', amount: 0, type: 'need' },
  { id: 'transport', name: 'Transportation', amount: 0, type: 'need' },
  { id: 'utilities', name: 'Utilities', amount: 0, type: 'need' },
  { id: 'entertainment', name: 'Entertainment', amount: 0, type: 'want' },
  { id: 'shopping', name: 'Shopping', amount: 0, type: 'want' },
  { id: 'education', name: 'Education', amount: 0, type: 'need' },
  { id: 'healthcare', name: 'Healthcare', amount: 0, type: 'need' },
  { id: 'other', name: 'Other expenses', amount: 0, type: 'want' },
]

export const GOALS = [
  'Build an emergency fund',
  'Buy a laptop',
  'Higher education',
  'Vacation',
  'Buy a vehicle',
  'House down payment',
  'General savings',
]

const inOneYear = () => {
  const d = new Date()
  d.setFullYear(d.getFullYear() + 1)
  return d.toISOString().slice(0, 10)
}

export function emptyInput(): FinancialInput {
  return {
    income: 0,
    otherIncome: 0,
    currency: 'INR',
    expenses: DEFAULT_EXPENSES.map((e) => ({ ...e })),
    financialGoal: GOALS[0],
    targetAmount: 0,
    targetDate: '',
    currentSavings: 0,
    riskPreference: 'balanced',
    notes: '',
  }
}

const DEMO_AMOUNTS: Record<string, number> = {
  housing: 15000,
  food: 7000,
  transport: 4000,
  utilities: 3000,
  entertainment: 3000,
  shopping: 4000,
  education: 0,
  healthcare: 2000,
  other: 2000,
}

export function demoInput(): FinancialInput {
  return {
    income: 50000,
    otherIncome: 5000,
    currency: 'INR',
    expenses: DEFAULT_EXPENSES.map((e) => ({ ...e, amount: DEMO_AMOUNTS[e.id] ?? 0 })),
    financialGoal: 'Build an emergency fund',
    targetAmount: 150000,
    targetDate: inOneYear(),
    currentSavings: 40000,
    riskPreference: 'balanced',
    notes: 'I get a small freelance income each month and want a 6-month safety net.',
  }
}

export const EXAMPLE_QUESTIONS = [
  'How can I save ₹5,000 more every month?',
  'Where am I spending too much?',
  'Can I afford my current expenses?',
  'How long will it take me to reach my savings goal?',
]
