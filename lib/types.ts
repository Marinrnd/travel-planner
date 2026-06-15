export type ItineraryItem = {
  id: string;
  time: string;
  title: string;
  location: string;
  note?: string;
};

export type ItineraryDay = {
  id: string;
  label: string;
  items: ItineraryItem[];
};

export type BudgetCategory =
  | "Flights"
  | "Stay"
  | "Food"
  | "Activities"
  | "Transport"
  | "Other";

export type Expense = {
  id: string;
  label: string;
  category: BudgetCategory;
  amount: number;
};

export type PackingItem = {
  id: string;
  label: string;
  packed: boolean;
};

export type TripState = {
  tripName: string;
  destination: string;
  startDate: string;
  endDate: string;
  budgetLimit: number;
  days: ItineraryDay[];
  expenses: Expense[];
  packing: PackingItem[];
  notes: string;
};
