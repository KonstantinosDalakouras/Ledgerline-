import type { Budgets, FinanceState, Transaction, TxType } from "../types";
import { currentMonthKey, lastNMonthKeys, parseISO, round2, todayISO, uid } from "./format";

/** Deterministic PRNG so the demo ledger looks the same on every first load. */
function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T,>(rng: () => number, arr: T[]): T => arr[Math.floor(rng() * arr.length)];
const between = (rng: () => number, min: number, max: number) => round2(min + rng() * (max - min));

const GROCERY_NOTES = [
  "Whole Harvest Market",
  "Corner grocer run",
  "Weekly grocery haul",
  "Farmers market",
  "Pantry restock",
  "Midweek top-up",
];
const DINING_NOTES = [
  "Ramen night",
  "Coffee & croissant",
  "Pizza with friends",
  "Team lunch",
  "Taco Tuesday",
  "Sunday brunch",
  "Late-night pho",
];
const TRANSPORT_NOTES = ["Metro card top-up", "Gas refill", "Ride share", "Bike tune-up", "Parking"];
const SHOPPING_NOTES = ["New running shoes", "Bookstore haul", "Home goods", "Winter jacket", "Kitchen gadget"];
const FUN_NOTES = ["Cinema tickets", "Concert ticket", "Game on Steam", "Museum pass"];
const FREELANCE_NOTES = ["Freelance sprint — Atlas App", "Design consult — Ferra", "Web build — Hartley & Co"];

export function buildDemoState(): FinanceState {
  const rng = mulberry32(20260214);
  const nowKey = currentMonthKey();
  const todayDay = parseISO(todayISO()).getDate();
  const months = lastNMonthKeys(nowKey, 5);
  const transactions: Transaction[] = [];

  const tx = (key: string, day: number, type: TxType, categoryId: string, amount: number, note: string) => {
    const maxDay = key === nowKey ? todayDay : 28;
    if (day > maxDay) return; // don't fabricate future entries in the current month
    const d = String(Math.min(day, maxDay)).padStart(2, "0");
    transactions.push({ id: uid(), type, categoryId, amount: round2(amount), note, date: `${key}-${d}` });
  };

  months.forEach((key, mi) => {
    // steady income & fixed costs
    tx(key, 1, "income", "salary", 5150, "Monthly salary — Northwind Studio");
    tx(key, 2, "expense", "housing", 1480, "Rent — Maple St. apartment");
    tx(key, 5, "expense", "utilities", 59.99, "Fiber internet — Beamline");
    tx(key, 8, "expense", "utilities", between(rng, 62, 118), "Electricity bill");
    tx(key, 9, "expense", "utilities", between(rng, 28, 46), "Water & sewage");
    tx(key, 12, "expense", "utilities", 45, "Mobile plan");
    tx(key, 3, "expense", "subscriptions", 11.99, "Spotify Premium");
    tx(key, 6, "expense", "subscriptions", 2.99, "iCloud storage");
    tx(key, 15, "expense", "subscriptions", 17.99, "Netflix");
    tx(key, 4, "expense", "health", 42, "Gym membership");
    tx(key, 18, "income", "investments", between(rng, 70, 170), "ETF dividend payout");

    // side income, most months
    if (rng() < 0.72) tx(key, 10 + Math.floor(rng() * 14), "income", "freelance", between(rng, 380, 1450), pick(rng, FREELANCE_NOTES));

    // everyday spending
    const nGrocery = 5 + Math.floor(rng() * 3);
    for (let i = 0; i < nGrocery; i++) tx(key, 2 + Math.floor(rng() * 26), "expense", "groceries", between(rng, 24, 96), pick(rng, GROCERY_NOTES));

    const nDining = 4 + Math.floor(rng() * 4);
    for (let i = 0; i < nDining; i++) tx(key, 2 + Math.floor(rng() * 26), "expense", "dining", between(rng, 12, 68), pick(rng, DINING_NOTES));

    const nTransport = 3 + Math.floor(rng() * 3);
    for (let i = 0; i < nTransport; i++) tx(key, 2 + Math.floor(rng() * 26), "expense", "transport", between(rng, 9, 54), pick(rng, TRANSPORT_NOTES));

    const nShopping = 1 + Math.floor(rng() * 3);
    for (let i = 0; i < nShopping; i++) tx(key, 3 + Math.floor(rng() * 24), "expense", "shopping", between(rng, 18, 140), pick(rng, SHOPPING_NOTES));

    const nFun = 1 + Math.floor(rng() * 3);
    for (let i = 0; i < nFun; i++) tx(key, 3 + Math.floor(rng() * 24), "expense", "entertainment", between(rng, 14, 60), pick(rng, FUN_NOTES));

    if (rng() < 0.6) tx(key, 6 + Math.floor(rng() * 20), "expense", "health", between(rng, 18, 85), pick(rng, ["Pharmacy run", "Yoga class pack", "Dental check-up"]));

    // a trip every few months
    if (mi % 3 === 1) {
      tx(key, 9 + Math.floor(rng() * 10), "expense", "travel", between(rng, 80, 260), pick(rng, ["Weekend train tickets", "Airbnb — lakeside", "Car rental"]));
      if (rng() < 0.7) tx(key, 12 + Math.floor(rng() * 12), "expense", "travel", between(rng, 40, 160), "Trip meals & tickets");
    }
  });

  const budgets: Budgets = {
    housing: 1650,
    groceries: 420,
    dining: 230,
    transport: 170,
    subscriptions: 95,
    utilities: 260,
    shopping: 200,
    entertainment: 130,
    health: 100,
    // travel intentionally left without a budget to show the "set a goal" state
  };

  return { transactions, budgets };
}
