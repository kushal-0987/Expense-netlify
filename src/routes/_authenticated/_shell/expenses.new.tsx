import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { useGroup } from "@/hooks/use-group";
import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState } from "@/components/app/EmptyState";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/_shell/expenses/new")({
  head: () => ({ meta: [{ title: "Add expense — Family Expense Tracker" }, { name: "description", content: "Record a new shared expense and split it." }] }),
  component: NewExpense,
});

function NewExpense() {
  const { can } = useGroup();
  if (!can.addExpense) {
    return (
      <div className="card-surface">
        <EmptyState icon={Lock} title="Only admins can add expenses here" body="Ask an admin of this group to add it, or to allow members to add expenses in Settings." action={<Button asChild variant="outline"><Link to="/expenses">Back to expenses</Link></Button>} />
      </div>
    );
  }
  return (
    <div>
      <PageHeader title="Add expense" description="Record what was spent and who it should be shared with." />
      <ExpenseForm />
    </div>
  );
}
