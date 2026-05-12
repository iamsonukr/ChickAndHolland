import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import CONFIG from "../config";
import db from "../db";
import { TABLE_NAMES } from "../constants";
import {
  DEFAULT_ORDER_STAGE,
  ORDER_STAGE_FLOW,
  getCanonicalStage,
  getStageIndex,
  normalizeStageKey,
  normalizeStageLabel,
} from "./stageFlow";

export {
  DEFAULT_ORDER_STAGE as DEFAULT_SCAN_STAGE,
  ORDER_STAGE_FLOW as SCAN_STAGE_FLOW,
  getCanonicalStage as getScanStageLabel,
  getStageDateField,
  getStageIndex as getScanStageIndex,
  isShippingStage,
  normalizeStageKey,
} from "./stageFlow";

export type ScanFlowType = "RETAILER" | "STOCK" | "STORE";

export type ScannerIdentity = {
  scannerId: number;
  scannerType: string;
  scannerRoleName: string | null;
};

export type ScanStageAccessContext = {
  currentStage?: string | null;
  targetStage?: string | null;
  flowStages?: string[];
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

const normalizeRoleKey = (value?: string | null) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-");

const SCANNER_ROLE_STAGE_RULES: Record<string, string[]> = {
  "pattern-master": ["Pattern"],
  "khaka-master": ["Khaka"],
  "issue-beading-master": ["Issue Beading"],
  "beading-master": ["Beading"],
  "zarkan-master": ["Zarkan"],
  "stitching-master": ["Stitching"],
  "balance-pending-master": ["Balance Pending"],
  "ready-to-delivery-master": ["Ready To Delivery"],
  "shipping-master": ["Shipped"],
};

export const getScannerRoleAllowedStages = (scannerRoleName?: string | null) => {
  const normalizedRole = normalizeRoleKey(scannerRoleName);
  return [...(SCANNER_ROLE_STAGE_RULES[normalizedRole] || [])];
};

export const getScannerRolePrimaryStage = (scannerRoleName?: string | null) =>
  getScannerRoleAllowedStages(scannerRoleName)[0] || null;

export const getScannerRoleTargetStage = (
  scannerRoleName?: string | null,
  flowStages: string[] = ORDER_STAGE_FLOW,
) => {
  const primaryStage = getScannerRolePrimaryStage(scannerRoleName);
  return getCanonicalStage(primaryStage, flowStages) || primaryStage;
};

const getScannerRoleName = async (
  scannerId: number,
  scannerType: string,
): Promise<string | null> => {
  if (scannerType === "USER") {
    const [user] = (await db.query(
      `
        SELECT r.roleName
        FROM ${TABLE_NAMES.USERS} u
        LEFT JOIN ${TABLE_NAMES.USER_ROLES} r ON u.roleId = r.id
        WHERE u.id = ?
        LIMIT 1
      `,
      [scannerId],
    )) as Array<{ roleName?: string | null }>;

    return user?.roleName ? String(user.roleName).trim() : null;
  }

  if (scannerType === "EMPLOYEE") {
    const [employee] = (await db.query(
      `
        SELECT r.name AS roleName
        FROM ${TABLE_NAMES.EMPLOYEES} e
        LEFT JOIN ${TABLE_NAMES.ROLES} r ON e.roleId = r.id
        WHERE e.id = ?
        LIMIT 1
      `,
      [scannerId],
    )) as Array<{ roleName?: string | null }>;

    return employee?.roleName ? String(employee.roleName).trim() : null;
  }
  return null;
};

const normalizeScannerIdentity = async (
  decodedToken: any,
): Promise<ScannerIdentity | null> => {
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
    scannerRoleName: await getScannerRoleName(
      scannerId,
      scannerType.toUpperCase(),
    ),
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
    const scannerIdentity = await normalizeScannerIdentity(decodedToken);

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

type StageAccessResolver = (
  req: Request,
) =>
  | Promise<ScanStageAccessContext | string | null | undefined>
  | ScanStageAccessContext
  | string
  | null
  | undefined;

export const requireScannerRoleStageAccess =
  (resolveStageAccess: StageAccessResolver) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const scanner = (req as any).scannerIdentity as
        | ScannerIdentity
        | undefined;

      if (!scanner) {
        return res.status(401).json({
          success: false,
          code: "SCANNER_AUTH_REQUIRED",
          message: "Scanner login required. Please login and scan again.",
        });
      }

      const resolvedAccess = await resolveStageAccess(req);
      const accessContext: ScanStageAccessContext =
        resolvedAccess &&
        typeof resolvedAccess === "object" &&
        !Array.isArray(resolvedAccess)
          ? (resolvedAccess as ScanStageAccessContext)
          : {
              targetStage:
                typeof resolvedAccess === "string" ? resolvedAccess : null,
            };

      const flowStages = Array.isArray(accessContext?.flowStages)
        ? accessContext.flowStages
            .map((stage: string) => normalizeStageLabel(stage))
            .filter(Boolean)
        : [];

      const stageFlow = flowStages.length ? flowStages : ORDER_STAGE_FLOW;
      const rawTargetStage = normalizeStageLabel(accessContext?.targetStage);
      const targetStage =
        getCanonicalStage(rawTargetStage, stageFlow) || rawTargetStage;

      if (!targetStage) {
        return next();
      }

      const allowedStages = getScannerRoleAllowedStages(scanner.scannerRoleName);

      if (!allowedStages?.length) {
        return res.status(403).json({
          success: false,
          code: "SCANNER_STAGE_FORBIDDEN",
          message: `Your role ${scanner.scannerRoleName || "is not mapped"} is not allowed to move QR scan stages.`,
          scannerRole: scanner.scannerRoleName,
          allowedStages: [],
          currentStage: accessContext?.currentStage ?? null,
          nextStage: targetStage,
        });
      }

      const isAllowed = allowedStages.some(
        (allowedStage) =>
          normalizeStageKey(allowedStage) === normalizeStageKey(targetStage),
      );

      if (!isAllowed) {
        return res.status(403).json({
          success: false,
          code: "SCANNER_STAGE_FORBIDDEN",
          message: `Your role ${scanner.scannerRoleName} can only scan ${allowedStages.join(", ")} stage items. This scan is trying to mark ${targetStage}.`,
          scannerRole: scanner.scannerRoleName,
          allowedStages,
          currentStage: accessContext?.currentStage ?? null,
          nextStage: targetStage,
        });
      }

      const targetStageIndex = getStageIndex(targetStage, stageFlow);

      if (targetStageIndex === -1) {
        return res.status(403).json({
          success: false,
          code: "SCANNER_STAGE_FORBIDDEN",
          message: `${targetStage} is not available in this scan flow.`,
          scannerRole: scanner.scannerRoleName,
          allowedStages,
          currentStage: accessContext?.currentStage ?? null,
          nextStage: targetStage,
        });
      }

      const rawCurrentStage =
        normalizeStageLabel(accessContext?.currentStage) || DEFAULT_ORDER_STAGE;
      const currentStage =
        getCanonicalStage(rawCurrentStage, stageFlow) || rawCurrentStage;
      const currentStageIndex = getStageIndex(currentStage, stageFlow);

      if (currentStageIndex === -1) {
        return res.status(409).json({
          success: false,
          code: "SCANNER_STAGE_UNKNOWN_CURRENT",
          message: `Current stage ${currentStage} is not available in this scan flow.`,
          scannerRole: scanner.scannerRoleName,
          allowedStages,
          currentStage,
          nextStage: targetStage,
        });
      }

      if (targetStageIndex <= currentStageIndex) {
        const isSameStage = targetStageIndex === currentStageIndex;

        return res.status(409).json({
          success: false,
          code: isSameStage
            ? "SCANNER_STAGE_ALREADY_DONE"
            : "SCANNER_STAGE_REGRESSION",
          message: isSameStage
            ? `This item is already at ${targetStage}.`
            : `This item is already at ${currentStage}. You can only scan forward stages.`,
          scannerRole: scanner.scannerRoleName,
          allowedStages,
          currentStage,
          nextStage: targetStage,
        });
      }

      return next();
    } catch (error) {
      next(error);
    }
  };
