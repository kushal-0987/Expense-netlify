# Family Expense Tracker

## Project Overview
A modern web application for families to track shared household expenses, calculate splits, manage balances, and settle up payments via eSewa.

## Project Rules
- Theme lives in `src/styles.css` tokens (`:root` + `.dark`); a pre-paint script from `src/hooks/use-theme.ts` sets the `dark` class — keep components on semantic tokens so both themes work.
- Page-level enter animations must not leave a persistent `transform`/`filter` (use `backwards` fill) — it would break `position: fixed` children.
- eSewa QR pictures live at `<group_id>/<member_id>/<file>` and payment details are updated via member payment info.
