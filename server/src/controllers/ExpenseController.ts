import { Request, Response, Router } from "express";
import asyncHandler from "../middleware/AsyncHandler";
import Expense from "../models/Expense";
import db from "../db";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const {
      page,
      query,
      expenseName,
      expenseType,
      isPaid,
      fromDate,
      toDate,
    }: {
      page?: string;
      query?: string;
      expenseName?: string;
      expenseType?: string;
      isPaid?: string;
      fromDate?: string;
      toDate?: string;
    } = req.query;

    let actualFromDate = fromDate;
    let actualToDate = toDate;

    if (!actualFromDate || actualFromDate === "undefined") {
      const past30Days = new Date();
      past30Days.setDate(past30Days.getDate() - 30);
      actualFromDate = past30Days.toISOString().split("T")[0];
    }

    if (!actualToDate || actualToDate === "undefined") {
      const today = new Date();
      actualToDate = today.toISOString().split("T")[0];
    }

    const skip = (page ? Number(page) - 1 : 0) * 100;
    const likeQuery = query ? `%${query.toLowerCase()}%` : undefined;

    let whereConditions = [];
    const params: any[] = [];

    if (expenseName) {
      whereConditions.push("expenseName = ?");
      params.push(expenseName);
    }

    if (expenseType && expenseType.toLowerCase() !== "all") {
      whereConditions.push("LOWER(expenseType) LIKE LOWER(?)");
      params.push(`%${expenseType.toLowerCase()}%`);
    }

    if (isPaid && isPaid.toLowerCase() !== "all") {
      whereConditions.push("isPaid = ?");
      params.push(isPaid === "true" || isPaid === "1" ? 1 : 0);
    }

    const fromDateStr = actualFromDate.split("T")[0];
    const toDateStr = actualToDate.split("T")[0];

    whereConditions.push("createdAt >= ? AND createdAt <= ?");
    params.push(`${fromDateStr} 00:00:00`, `${toDateStr} 23:59:59`);

    if (likeQuery) {
      whereConditions.push(
        "(LOWER(payer) LIKE LOWER(?) OR LOWER(expenseType) LIKE LOWER(?) OR LOWER(invoice) LIKE LOWER(?))"
      );
      params.push(likeQuery, likeQuery, likeQuery);
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    let expensesQuery = `
      SELECT *
      FROM expenses
      ${whereClause}
      order by id desc
      LIMIT 100 OFFSET ?
    `;

    const expenses = await db.query(expensesQuery, [...params, skip]);

    const countQuery = `
      SELECT COUNT(*) as totalCount
      FROM expenses
      ${whereClause}
    `;

    const totalCountResult = await db.query(countQuery, params);

    const totalAmountQuery = `
      SELECT currency, SUM(amount) as totalAmount
      FROM expenses
      ${whereClause}
      GROUP BY currency
    `;

    const totalAmount = await db.query(totalAmountQuery, params);

    const total = await db.query(
      "select id from expenses where expenseName =  ? ",
      [expenseName]
    );

    res.json({
      expenses,
      totalCount: totalCountResult[0].totalCount,
      totalAmount,
      length: total.length,
    });
  })
);

router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const {
      payer,
      expenseType,
      amount,
      currency,
      expenseName,
      otherType,
      invoice,
    } = req.body;

    const expense = new Expense();
    expense.payer = payer;
    expense.expenseType = expenseType;
    expense.amount = amount;
    expense.currency = currency;
    expense.expenseName = expenseName;
    expense.invoice = invoice;

    if (expenseType == "others") {
      expense.otherType = otherType;
    }
    await expense.save();

    res.json({
      success: true,
      message: "Expense added successfully",
    });
  })
);

router.put(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { payer, expenseType, amount, currency, expenseName } = req.body;

    const expense = await Expense.findOneOrFail({
      where: {
        id: Number(id),
      },
    });
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    expense.payer = payer;
    expense.expenseType = expenseType;
    expense.amount = amount;
    expense.currency = currency;
    expense.expenseName = expenseName;

    await expense.save();

    res.json({
      success: true,
      message: "Expense updated successfully",
    });
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const expense = await Expense.findOneOrFail({
      where: {
        id: Number(id),
      },
    });
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    await expense.remove();

    res.json({
      success: true,
      message: "Expense deleted successfully",
    });
  })
);

router.patch(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const expense = await Expense.findOneOrFail({
      where: {
        id: Number(id),
      },
    });
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    expense.isPaid = !expense.isPaid;

    await expense.save();

    res.json({
      success: true,
      message: "Payment status changed successfully",
    });
  })
);

router.patch(
  "/invoice/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const { invoice } = req.body;

    const expense = await Expense.findOneOrFail({
      where: {
        id: Number(id),
      },
    });
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    expense.invoice = invoice;

    await expense.save();

    res.json({
      success: true,
      message: "Payment status changed successfully",
    });
  })
);

router.get(
  "/download",
  asyncHandler(async (req: Request, res: Response) => {
    const {
      query,
      expenseName,
      expenseType,
      isPaid,
      fromDate,
      toDate,
    }: {
      query?: string;
      expenseName?: string;
      expenseType?: string;
      isPaid?: string;
      fromDate?: string;
      toDate?: string;
    } = req.query;

    let actualFromDate =
      fromDate ||
      new Date(new Date().setDate(new Date().getDate() - 30))
        .toISOString()
        .split("T")[0];
    let actualToDate = toDate || new Date().toISOString().split("T")[0];

    const likeQuery = query ? `%${query.toLowerCase()}%` : undefined;

    let whereConditions = [];
    const params: any[] = [];

    if (expenseName) {
      whereConditions.push("expenseName = ?");
      params.push(expenseName);
    }

    if (expenseType && expenseType.toLowerCase() !== "all") {
      whereConditions.push("LOWER(expenseType) LIKE LOWER(?)");
      params.push(`%${expenseType.toLowerCase()}%`);
    }

    if (isPaid && isPaid.toLowerCase() !== "all") {
      whereConditions.push("isPaid = ?");
      params.push(isPaid === "true" || isPaid === "1" ? 1 : 0);
    }

    const fromDateStr = actualFromDate.split("T")[0];
    const toDateStr = actualToDate.split("T")[0];

    whereConditions.push("createdAt >= ? AND createdAt <= ?");
    params.push(`${fromDateStr} 00:00:00`, `${toDateStr} 23:59:59`);

    if (likeQuery) {
      whereConditions.push(
        "(LOWER(payer) LIKE LOWER(?) OR LOWER(expenseType) LIKE LOWER(?))"
      );
      params.push(likeQuery, likeQuery);
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    const expensesQuery = `
      SELECT *
      FROM expenses
      ${whereClause}
    `;

    const totalAmountQuery = `
      SELECT currency, SUM(amount) as totalAmount
      FROM expenses
      ${whereClause}
      GROUP BY currency
    `;

    const expenses = await db.query(expensesQuery, params);
    const totalAmount = await db.query(totalAmountQuery, params);

    res.json({
      expenses,
      totalCount: expenses.length,
      totalAmount,
    });
  })
);

export default router;
