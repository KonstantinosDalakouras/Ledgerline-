import {
  Briefcase,
  Bus,
  Coins,
  HeartPulse,
  Home,
  Laptop,
  Plane,
  RefreshCw,
  ShoppingBag,
  ShoppingCart,
  Ticket,
  TrendingUp,
  Utensils,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { TxType } from "../types";

export interface Category {
  id: string;
  label: string;
  type: TxType;
  color: string;
  icon: LucideIcon;
}

export const CATEGORIES: Category[] = [
  // income
  { id: "salary", label: "Salary", type: "income", color: "#2fbf7f", icon: Briefcase },
  { id: "freelance", label: "Freelance", type: "income", color: "#56c9dd", icon: Laptop },
  { id: "investments", label: "Investments", type: "income", color: "#ffc25e", icon: TrendingUp },
  { id: "other-income", label: "Other income", type: "income", color: "#8ba392", icon: Coins },
  // expense
  { id: "housing", label: "Housing", type: "expense", color: "#ffc25e", icon: Home },
  { id: "groceries", label: "Groceries", type: "expense", color: "#57e39b", icon: ShoppingCart },
  { id: "dining", label: "Dining out", type: "expense", color: "#ff7a6c", icon: Utensils },
  { id: "transport", label: "Transport", type: "expense", color: "#56c9dd", icon: Bus },
  { id: "subscriptions", label: "Subscriptions", type: "expense", color: "#9bb0ff", icon: RefreshCw },
  { id: "utilities", label: "Utilities", type: "expense", color: "#b8e35c", icon: Zap },
  { id: "shopping", label: "Shopping", type: "expense", color: "#f58fb0", icon: ShoppingBag },
  { id: "entertainment", label: "Entertainment", type: "expense", color: "#ff9e66", icon: Ticket },
  { id: "health", label: "Health", type: "expense", color: "#ead9a0", icon: HeartPulse },
  { id: "travel", label: "Travel", type: "expense", color: "#8fd3ff", icon: Plane },
];

const byId = new Map(CATEGORIES.map((c) => [c.id, c]));

const FALLBACK: Category = {
  id: "other",
  label: "Other",
  type: "expense",
  color: "#8ba392",
  icon: Coins,
};

export const getCategory = (id: string): Category => byId.get(id) ?? FALLBACK;

export const incomeCategories = CATEGORIES.filter((c) => c.type === "income");
export const expenseCategories = CATEGORIES.filter((c) => c.type === "expense");

export function CategoryIcon({
  id,
  size = 16,
  className,
  strokeWidth = 1.8,
}: {
  id: string;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  const Icon = getCategory(id).icon;
  return <Icon size={size} className={className} strokeWidth={strokeWidth} aria-hidden />;
}
