import { ContentLayout } from "@/components/custom/admin-panel/contentLayout";
import AddExpenseForm from "../AddExpense";
import { getExpenses, getExpensesDownload } from "@/lib/data";
import CustomSearchBar from "@/components/custom/admin-panel/customSearchBar";
import CustomPagination from "@/components/custom/admin-panel/customPagination";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import TableActions from "../TableActions";
import ChangePaymentStatus from "../ChangePaymentStatus";
import CustomFilters from "../CustomFilters";
import ExpensesDownloader from "../Downloads";
import EditInvoice from "../EditInvoice";
import dayjs from "dayjs";

const Expenses = async (
  props: {
    searchParams: Promise<Record<string, string>>;
  }
) => {
  const searchParams = await props.searchParams;
  const currentPage = searchParams["cPage"] ? Number(searchParams["cPage"]) : 1;
  const query = searchParams["q"] ? searchParams["q"] : "";
  const expenseType = searchParams["expenseType"]
    ? searchParams["expenseType"]
    : "";
  const isPaid = searchParams["isPaid"] ? searchParams["isPaid"] : "";
  const fromDate = searchParams["fromDate"]
    ? new Date(searchParams["fromDate"])
    : new Date(new Date().setDate(new Date().getDate() - 30));
  const toDate = searchParams["toDate"]
    ? new Date(searchParams["toDate"])
    : new Date();

  const expenses = await getExpenses({
    page: currentPage,
    query,
    expenseName: "Ozil Expenses",
    expenseType,
    isPaid,
    fromDate: fromDate.toISOString(),
    toDate: toDate.toISOString(),
  });

  const Downloads = await getExpensesDownload({
    query,
    expenseName: "Ozil Expenses",
    expenseType,
    isPaid,
    fromDate: fromDate.toISOString(),
    toDate: toDate.toISOString(),
  });

  return (
    <ContentLayout title="Manage Expenses">
      <div className="flex flex-col gap-8">
        <div className="flex flex-row items-center justify-between">
          <h1 className="text-xl md:text-2xl">Expenses</h1>
          <AddExpenseForm
            expenseName="Ozil Expenses"
            expenseLength={expenses?.length}
          />
        </div>
        <div className="w-12/12 flex justify-end">
          <ExpensesDownloader
            expenses={Downloads}
            name="Ozil"
            date={`${dayjs(fromDate).format("MMMM D, YYYY")} to ${dayjs(toDate).format("MMMM D, YYYY")}`}
          />
        </div>
        <div className="space-y-2">
          <CustomSearchBar query={query} />

          <CustomFilters />

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Invoice</TableHead>

                <TableHead>Recipient</TableHead>
                <TableHead>Expense Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses?.expenses?.map((expense: any) => {
                return (
                  <TableRow key={expense.id}>
                    <TableCell>
                      {dayjs(expense.createdAt).format("MMMM D, YYYY")}
                    </TableCell>
                    <TableCell>
                      <EditInvoice invoice={expense.invoice} id={expense.id} />
                    </TableCell>

                    <TableCell>{expense.payer}</TableCell>
                    <TableCell>
                      {" "}
                      {expense.expenseType.toUpperCase()}
                      {expense.otherType && ` - ${expense.otherType}`}{" "}
                    </TableCell>
                    <TableCell>{expense.amount.toString()}</TableCell>
                    <TableCell>{expense.currency.toUpperCase()}</TableCell>
                    <ChangePaymentStatus data={expense} />
                    <TableActions data={expense} />
                  </TableRow>
                );
              })}
            </TableBody>
            <TableCaption className="space-x-2 border py-3 shadow-md">
              <b>Expense Summary:</b>
              {expenses?.totalAmount.map((tA: any, i: any) => {
                return (
                  <p key={tA.id} className="inline">
                    {tA.currency.toUpperCase()} - {tA.totalAmount}{" "}
                    {i < expenses.totalAmount.length - 1 ? "," : ""}
                  </p>
                );
              })}
            </TableCaption>
          </Table>

          <CustomPagination
            currentPage={currentPage}
            totalLength={expenses?.totalCount}
            resetOtherFields={false}
          />
        </div>
      </div>
    </ContentLayout>
  );
};

export default Expenses;
