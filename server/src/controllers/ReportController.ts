import { Request, Response, Router } from "express";
import db from "../db";
import asyncHandler from "../middleware/AsyncHandler";
import { PRC_NAMES } from "../constants";

const router = Router();

router.use((req, res, next) => {
  const { startDate, endDate } = req.query as {
    startDate: string;
    endDate: string;
  };
  if (!startDate || !endDate) {
    return res.status(400).json({
      msg: `startDate and endDate are required`,
    });
  }
  next();
});

/**
 * The whole reports uses stored procedures to get the data
 * here we just call the procedure names with the parameters
 * for getting the data and sending it as the response
 */

router.get(
  "/sales",
  asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query as {
      startDate: string;
      endDate: string;
    };

    const [sales] = await db.query(`CALL ${PRC_NAMES.SALES_REPORT}(?, ?)`, [
      startDate,
      endDate,
    ]);
    res.json(sales);
  })
);

router.get(
  "/expenses",
  asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query as {
      startDate: string;
      endDate: string;
    };
    const [expenses] = await db.query(
      `CALL ${PRC_NAMES.EXPENSE_REPORT}(?, ?)`,
      [startDate, endDate]
    );
    res.json(expenses);
  })
);

router.get(
  "/users",
  asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query as {
      startDate: string;
      endDate: string;
    };
    const [users] = await db.query(`CALL ${PRC_NAMES.USER_REPORT}(? , ?)`, [
      startDate,
      endDate,
    ]);
    res.json(users);
  })
);

router.get(
  "/inventory",
  asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query as {
      startDate: string;
      endDate: string;
    };
    const [inventory] = await db.query(
      `CALL ${PRC_NAMES.INVENTORY_REPORT}(?,?)`,
      [startDate, endDate]
    );
    res.json(inventory);
  })
);

router.get(
  "/manufacturer",
  asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query as {
      startDate: string;
      endDate: string;
    };
    const [manufacturers] = await db.query(
      `CALL ${PRC_NAMES.MANUFACTURER_REPORT}(? ,?)`,
      [startDate, endDate]
    );
    res.json(manufacturers);
  })
);

router.get(
  "/sales/returns",
  asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query as {
      startDate: string;
      endDate: string;
    };
    const [returns] = await db.query(
      `CALL ${PRC_NAMES.SALES_RETURN_REPORT}(? , ?)`,
      [startDate, endDate]
    );
    res.json(returns);
  })
);

router.get(
  "/products/top",
  asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query as {
      startDate: string;
      endDate: string;
    };
    const [products] = await db.query(
      `CALL ${PRC_NAMES.TOP_PRODUCTS_REPORT}(?,?)`,
      [startDate, endDate]
    );
    res.json(products);
  })
);

export default router;
