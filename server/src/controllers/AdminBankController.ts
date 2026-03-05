import { Request, Response, Router } from "express";
import asyncHandler from "../middleware/AsyncHandler";
import AdminBank from "../models/AdminBank"; 
import CONFIG from "../config";
import { MoreThan } from "typeorm";
import db from "../db";
import Retailer from "../models/Retailer";
const router = Router();

router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
const { bankName, accountNumber, accountHolder, ifscCode, swiftCode, address, currencyId } = req.body;

    if (!currencyId) {
      return res.status(400).json({
        success: false,
        msg: "Currency is required",
      });
    }

    const bank = new AdminBank();
    bank.decryptedBankName = bankName;
    bank.decryptedAccountNumber = accountNumber;
    bank.decryptedAccountHolder = accountHolder;
    bank.decryptedIfscCode = ifscCode;
    bank.decryptedSwiftCode = swiftCode || null;

    bank.address = address;
    bank.currencyId = Number(currencyId); // 👈 Save currency here

    await bank.save();

    res.json({
      success: true,
      msg: "Admin Bank Details Added Successfully",
    });
  })
);


router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const bankDetails = await AdminBank.find({
        relations: ["currency"], // if relation exists
        order: { id: "DESC" },
      });

      const data = bankDetails.map((item) => ({
        id: item.id,
        bankName: item.decryptedBankName,
        accountHolder: item.decryptedAccountHolder,
        accountNumber: item.decryptedAccountNumber,
        ifscCode: item.decryptedIfscCode,
        swiftCode: item.decryptedSwiftCode,

        isActive: item.is_active,
        address: item.address,
        currencyId: item.currencyId || null,
        currency: item.currency
          ? {
              code: item.currency.code,
              symbol: item.currency.symbol,
            }
          : null,
      }));

      return res.json({
        success: true,
        msg: "Bank details retrieved successfully",
        data,
      });

    } catch (error) {
      console.error("Admin Bank Fetch Error:", error);
      return res.status(500).json({
        success: false,
        msg: "Failed to fetch bank details",
      });
    }
  })
);


router.get(
  "/retailer/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const retailerId = Number(req.params.id);

    if (!retailerId) {
      return res.status(400).json({
        success: false,
        msg: "Retailer ID is required",
      });
    }

    // Find retailer with associated customer
    const retailer = await Retailer.findOne({
      where: { id: retailerId },
      relations: ["customer"],
    });

    if (!retailer || !retailer.customer) {
      return res.status(404).json({
        success: false,
        msg: "Retailer or Customer not found",
      });
    }

   const currencyId = retailer.customer.currencyId
  ? Number(retailer.customer.currencyId)
  : undefined;

// Get only active bank accounts matching the currency
const bankDetails = await AdminBank.find({
  where: {
    is_active: 1,
    ...(currencyId !== undefined ? { currencyId } : {}),
  },
});

    const bank = bankDetails.map((item) => ({
      id: item.id,
      bankName: item.decryptedBankName,
      accountHolder: item.decryptedAccountHolder,
      accountNumber: item.decryptedAccountNumber,
      ifscCode: item.decryptedIfscCode,
      swiftCode: item.decryptedSwiftCode,

      isActive: item.is_active,
      address: item.address,
    }));

    res.json({
      success: true,
      msg: "Bank details retrieved successfully",
      data: bank,
    });
  })
);


router.patch(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
   const { bankName, accountNumber, accountHolder, ifscCode, swiftCode, address, currencyId } = req.body;

    const { id } = req.params;
    let bank = await AdminBank.findOne({
      where: {
        id: Number(id),
      },
    });

    if (!bank) {
      throw new Error("No admin bank details found to update");
    }

    bank.decryptedBankName = bankName || bank.decryptedBankName;
    bank.decryptedAccountNumber = accountNumber || bank.decryptedAccountNumber;
    bank.decryptedAccountHolder = accountHolder || bank.decryptedAccountHolder;
    bank.decryptedIfscCode = ifscCode || bank.decryptedIfscCode;
    bank.decryptedSwiftCode = swiftCode || bank.decryptedSwiftCode;

    bank.address = address || bank.address;
    bank.currencyId = currencyId ? Number(currencyId) : bank.currencyId; // 👈 ADD IT HERE

    await bank.save();

    res.json({
      success: true,
      msg: "Admin Bank Details Updated Successfully",
    });
  })
);

router.patch(
  "/active/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    let bank = await AdminBank.findOne({
      where: {
        id: Number(id),
      },
    });

    if (!bank) {
      throw new Error("No admin bank details found to update");
    }

    if (bank.is_active == 1) {
      return res.json({
        success: true,
        msg: "Admin Bank Details Updated Successfully",
      });
    }

    bank.is_active = 1;

    await bank.save();

    res.json({
      success: true,
      msg: "Admin Bank Details Updated Successfully",
    });
  })
);

router.patch(
  "/deactive/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    let bank = await AdminBank.findOne({
      where: {
        id: Number(id),
      },
    });

    if (!bank) {
      throw new Error("No admin bank details found to update");
    }

    bank.is_active = 0;

    await bank.save();

    res.json({
      success: true,
      msg: "Admin Bank Details Updated Successfully",
    });
  })
);

router.delete(
  "/delete/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    let bank = await AdminBank.delete(id);

    res.json({
      success: true,
      msg: "Admin Bank Details Deleted Successfully",
    });
  })
);

export default router;
