import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import CONFIG from "../config";
import db from "../db";

export type ScanFlowType = "RETAILER" | "STOCK" | "STORE";

type ScannerIdentity = {
  scannerId: number;
  scannerType: string;
};

type ReserveScanResult =
  | {
      success: true;
      scanId: number;
      scanner: ScannerIdentity;
    }
  | {
      success: false;
      code: "DUPLICATE_SCAN" | "SCANNER_AUTH_REQUIRED";
      message: string;
    };

const SCAN_GUARD_TABLE = "barcode_scan_history";

let ensureScanGuardTablePromise: Promise<void> | null = null;

const getAuthorizationHeader = (req: Request) =>
  (req.headers.authorization || req.headers.Authorization) as
    | string
    | undefined;

const getDuplicateScanMessage = () =>
  "This barcode was already scanned by your login. Ask the next department/user to scan it.";

const normalizeScannerIdentity = (decodedToken: any): ScannerIdentity | null => {
  const scannerId = Number(decodedToken?.id);
  const scannerType = String(
    decodedToken?.type || decodedToken?.role || "",
  ).trim();

  if (!scannerType || Number.isNaN(scannerId)) {
    return null;
  }

  return {
    scannerId,
    scannerType: scannerType.toUpperCase(),
  };
};

async function ensureScanGuardTable() {
  if (!ensureScanGuardTablePromise) {
    ensureScanGuardTablePromise = (async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS ${SCAN_GUARD_TABLE} (
          id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
          barcode VARCHAR(255) NOT NULL,
          flowType VARCHAR(50) NOT NULL,
          scannerType VARCHAR(50) NOT NULL,
          scannerId INT NOT NULL,
          createdAt datetime(6) DEFAULT CURRENT_TIMESTAMP(6),
          UNIQUE KEY unique_barcode_scanner_flow (barcode, flowType, scannerType, scannerId),
          KEY idx_barcode_scan_lookup (barcode, flowType)
        )
      `);
    })().catch((error) => {
      ensureScanGuardTablePromise = null;
      throw error;
    });
  }

  await ensureScanGuardTablePromise;
}

export const requireScannerIdentity = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authorization = getAuthorizationHeader(req);

  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      code: "SCANNER_AUTH_REQUIRED",
      message: "Scanner login required. Please login and scan again.",
    });
  }

  try {
    const token = authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, CONFIG.JWT_SECRET);
    const scannerIdentity = normalizeScannerIdentity(decodedToken);

    if (!scannerIdentity) {
      return res.status(401).json({
        success: false,
        code: "SCANNER_AUTH_REQUIRED",
        message: "Scanner login required. Please login and scan again.",
      });
    }

    (req as any).scannerIdentity = scannerIdentity;
    next();
  } catch {
    return res.status(401).json({
      success: false,
      code: "SCANNER_AUTH_REQUIRED",
      message: "Scanner session expired. Please login again.",
    });
  }
};

export async function reserveUniqueBarcodeScan(
  req: Request,
  flowType: ScanFlowType,
  barcode: string,
): Promise<ReserveScanResult> {
  await ensureScanGuardTable();
  const normalizedBarcode = String(barcode ?? "").trim();

  const scanner = (req as any).scannerIdentity as ScannerIdentity | undefined;

  if (!scanner) {
    return {
      success: false,
      code: "SCANNER_AUTH_REQUIRED",
      message: "Scanner identity missing.",
    };
  }

  try {
    const result = await db.query(
      `
        INSERT INTO ${SCAN_GUARD_TABLE} (
          barcode,
          flowType,
          scannerType,
          scannerId,
          createdAt
        )
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP(6))
      `,
      [normalizedBarcode, flowType, scanner.scannerType, scanner.scannerId],
    );

    return {
      success: true,
      scanId: Number(result?.insertId),
      scanner,
    };
  } catch (error: any) {
    if (error?.code === "ER_DUP_ENTRY" || error?.errno === 1062) {
      return {
        success: false,
        code: "DUPLICATE_SCAN",
        message: getDuplicateScanMessage(),
      };
    }

    throw error;
  }
}

export async function releaseReservedBarcodeScan(scanId?: number | null) {
  if (!scanId) {
    return;
  }

  await ensureScanGuardTable();
  await db.query(`DELETE FROM ${SCAN_GUARD_TABLE} WHERE id = ?`, [scanId]);
}
