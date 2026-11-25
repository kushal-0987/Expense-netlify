import { createFileRoute, Link } from "@tanstack/react-router";
import { FileQuestion, Lock } from "lucide-react";
import { useGroup } from "@/hooks/use-group";
import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState } from "@/components/app/EmptyState";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/_shell/expenses/$expenseId/edit")({
  head: () => ({ meta: [{ title: "Edit expense — Family Expense Tracker" }, { name: "description", content: "Change an expense and its split." }] }),
  component: EditExpense,
});

function EditExpense() {
  const { expenseId } = Route.useParams();
  const { expenseById, can } = useGroup();
  const expense = expenseById(expenseId);
  const back = <Button asChild variant="outline"><Link to="/expenses">Back to expenses</Link></Button>;
  if (!expense) return <div className="card-surface"><EmptyState icon={FileQuestion} title="Expense not found" body="It may have been deleted, or it belongs to another group." action={back} /></div>;
  if (!can.editExpense(expense)) return <div className="card-surface"><EmptyState icon={Lock} title="You can't edit this expense" body="Only admins, or the person who added or paid it, can make changes." action={back} /></div>;
  return (
    <div>
      <PageHeader title="Edit expense" description={expense.title} />
      <ExpenseForm key={expense.id} expense={expense} />
    </div>
  );
}
