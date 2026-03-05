import { Request, Response, Router } from "express";
import asyncHandler from "../middleware/AsyncHandler";
import RetailerBank from "../models/RetailerBank";
import Retailer from "../models/Retailer";
import CONFIG from "../config";
const router = Router();

router.post(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const {
      name,
      account,
      ifc,
      branch,
      card_number,
      expiry_date,
      card_address,
      address,
      card_name
    } = req.body;
    const { id } = req.params;

    const retailer = await Retailer.findOne({
      where: {
        id: Number(id),
      },
    });

    if (!retailer) {
      res.json({
        success: false,
        msg: "Retailer not found",
      });
      return;
    }
    const exist = await RetailerBank.findOne({
      where: {
        retailer: {
          id: Number(id),
        },
      },
    });

    if (exist) {
      throw new Error("Details Already Exist");
    }

    const bank = new RetailerBank();

    bank.decryptedAccount = account;
    bank.decryptedBankName = name;
    bank.decryptedIfc = ifc;
    bank.decryptedBranch = branch;
    bank.retailer = retailer;
    
    // Only set card fields if they are provided
    if (card_number) bank.decryptedCardNumber = card_number;
    if (expiry_date) bank.decryptedExpiryDate = expiry_date;
    if (card_address) bank.decryptedCardAddress = card_address;
    
    bank.address = address;
    bank.card_name = card_name;
    await bank.save();

    res.json({
      success: true,
      msg: "Bank Details Added Successfully",
    });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const retailer = await Retailer.findOne({
      where: {
        id: Number(id),
      },
    });

    if (!retailer) {
      throw new Error("Retailer not found");
    }

    const bankDetails = await RetailerBank.findOne({
      where: {
        retailer: {
          id: Number(id),
        },
      },
    });

    if (!bankDetails) {
      throw new Error("No bank details found for this retailer");
    }

    res.json({
      success: true,
      msg: "Bank details retrieved successfully",
      data: {
        bankName: bankDetails.decryptedBankName,
        account: bankDetails.decryptedAccount,
        ifc: bankDetails.decryptedIfc,
        branch: bankDetails.decryptedBranch,
        retailerId: id,
        card: bankDetails.decryptedCardNumber,
        exp: bankDetails.decryptedExpiryDate,
        card_address: bankDetails.decryptedCardAddress,
        address: bankDetails.address,
        card_name: bankDetails.card_name,
      },
    });
  })
);

router.patch(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const {
      name,
      account,
      ifc,
      branch,
      card_number,
      expiry_date,
      card_address,
      address,
      card_name,
    } = req.body;
    const { id } = req.params;

    if (isNaN(Number(id))) {
      throw new Error("Invalid retailer ID");
    }

    const retailer = await Retailer.findOne({
      where: {
        id: Number(id),
      },
    });

    if (!retailer) {
      res.status(404).json({
        success: false,
        msg: "Retailer not found",
      });
      return;
    }

    // Find existing bank details
    let bank = await RetailerBank.findOne({
      where: {
        retailer: {
          id: Number(id),
        },
      },
    });

    if (bank) {
      bank.decryptedBankName = name || bank.decryptedBankName;
      bank.decryptedAccount = account || bank.decryptedAccount;
      bank.decryptedIfc = ifc || bank.decryptedIfc;
      bank.decryptedBranch = branch || bank.decryptedBranch;
      
      // Only update card fields if they are provided
      if (card_number !== undefined) bank.decryptedCardNumber = card_number;
      if (expiry_date !== undefined) bank.decryptedExpiryDate = expiry_date;
      if (card_address !== undefined) bank.decryptedCardAddress = card_address;
      
      bank.address = address || bank.address;
      bank.card_name = card_name || bank.card_name;
      await bank.save();
    }

    res.json({
      success: true,
      msg: "Bank Details Updated Successfully",
    });
  })
);

export default router;
