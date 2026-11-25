import {
  Utensils,
  ShoppingBasket,
  Home,
  Zap,
  Wifi,
  Bus,
  Fuel,
  Clapperboard,
  ShoppingBag,
  HeartPulse,
  GraduationCap,
  Sofa,
  Shapes,
  type LucideIcon,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

export type Category = Database["public"]["Enums"]["expense_category"];

export const CATEGORIES: { value: Category; label: string; icon: LucideIcon; color: string }[] = [
  { value: "food", label: "Food", icon: Utensils, color: "var(--cat-food)" },
  { value: "groceries", label: "Groceries", icon: ShoppingBasket, color: "var(--cat-groceries)" },
  { value: "rent", label: "Rent", icon: Home, color: "var(--cat-rent)" },
  { value: "electricity", label: "Electricity", icon: Zap, color: "var(--cat-electricity)" },
  { value: "internet", label: "Internet", icon: Wifi, color: "var(--cat-internet)" },
  { value: "transportation", label: "Transportation", icon: Bus, color: "var(--cat-transportation)" },
  { value: "fuel", label: "Fuel", icon: Fuel, color: "var(--cat-fuel)" },
  { value: "entertainment", label: "Entertainment", icon: Clapperboard, color: "var(--cat-entertainment)" },
  { value: "shopping", label: "Shopping", icon: ShoppingBag, color: "var(--cat-shopping)" },
  { value: "medical", label: "Medical", icon: HeartPulse, color: "var(--cat-medical)" },
  { value: "education", label: "Education", icon: GraduationCap, color: "var(--cat-education)" },
  { value: "household", label: "Household", icon: Sofa, color: "var(--cat-household)" },
  { value: "other", label: "Other", icon: Shapes, color: "var(--cat-other)" },
];

export function getCategory(value: string) {
  return CATEGORIES.find((c) => c.value === value) ?? CATEGORIES[CATEGORIES.length - 1];
}
