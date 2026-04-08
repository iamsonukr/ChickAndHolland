import fs from "fs";
import path from "path";
import db from "../db";

type CatalogTableName = "categories" | "subcategories";
type TableState = "healthy" | "missing" | "broken";

const TABLES: CatalogTableName[] = ["categories", "subcategories"];
const shouldApply = process.argv.includes("--apply");

function getMysqlErrno(error: any) {
  return Number(error?.errno ?? error?.driverError?.errno) || 0;
}

function getMysqlMessage(error: any) {
  return error?.sqlMessage ?? error?.driverError?.sqlMessage ?? error?.message;
}

function resolveDumpPath() {
  const candidates = [
    path.resolve(process.cwd(), "..", "chicnewDB.sql"),
    path.resolve(process.cwd(), "chicnewDB.sql"),
  ];

  const dumpPath = candidates.find((candidate) => fs.existsSync(candidate));

  if (!dumpPath) {
    throw new Error(
      "Could not find `chicnewDB.sql`. Expected it in the repo root next to the `server` folder.",
    );
  }

  return dumpPath;
}

function extractStatement(
  dumpContents: string,
  tableName: CatalogTableName,
  statementType: "create" | "insert",
) {
  const pattern =
    statementType === "create"
      ? new RegExp(`CREATE TABLE \\\`${tableName}\\\` \\([\\s\\S]*?;`, "m")
      : new RegExp(`INSERT INTO \\\`${tableName}\\\` VALUES [\\s\\S]*?;`, "m");

  const match = dumpContents.match(pattern);

  if (!match) {
    throw new Error(
      `Could not find the ${statementType.toUpperCase()} statement for \`${tableName}\` inside chicnewDB.sql.`,
    );
  }

  return match[0];
}

async function inspectTable(tableName: CatalogTableName): Promise<{
  tableName: CatalogTableName;
  state: TableState;
  details?: string;
}> {
  try {
    await db.query(`SELECT 1 FROM \`${tableName}\` LIMIT 1`);

    return {
      tableName,
      state: "healthy",
    };
  } catch (error) {
    const mysqlErrno = getMysqlErrno(error);
    const details = getMysqlMessage(error);

    if (mysqlErrno === 1932) {
      return {
        tableName,
        state: "broken",
        details,
      };
    }

    if (mysqlErrno === 1146) {
      return {
        tableName,
        state: "missing",
        details,
      };
    }

    throw error;
  }
}

async function printStatus() {
  const dbNameRows = await db.query("SELECT DATABASE() AS dbName");
  console.log(`Database: ${dbNameRows?.[0]?.dbName ?? "unknown"}`);

  const statuses = await Promise.all(TABLES.map((tableName) => inspectTable(tableName)));

  for (const status of statuses) {
    const suffix = status.details ? ` (${status.details})` : "";
    console.log(`- ${status.tableName}: ${status.state}${suffix}`);
  }

  return statuses;
}

async function repairCatalogTables() {
  const dumpPath = resolveDumpPath();
  const dumpContents = fs.readFileSync(dumpPath, "utf8");

  const createCategories = extractStatement(dumpContents, "categories", "create");
  const insertCategories = extractStatement(dumpContents, "categories", "insert");
  const createSubcategories = extractStatement(dumpContents, "subcategories", "create");
  const insertSubcategories = extractStatement(dumpContents, "subcategories", "insert");

  await db.query("SET FOREIGN_KEY_CHECKS = 0");

  try {
    await db.query("DROP TABLE IF EXISTS `subcategories`");
    await db.query("DROP TABLE IF EXISTS `categories`");

    await db.query(createCategories);
    await db.query(insertCategories);
    await db.query(createSubcategories);
    await db.query(insertSubcategories);
  } finally {
    await db.query("SET FOREIGN_KEY_CHECKS = 1");
  }
}

async function main() {
  await db.initialize();

  try {
    const statuses = await printStatus();
    const needsRepair = statuses.some(
      (status) => status.state === "missing" || status.state === "broken",
    );

    if (!needsRepair) {
      console.log("Catalog tables are healthy. No action needed.");
      return;
    }

    if (!shouldApply) {
      console.log("");
      console.log("Dry run only. Re-run with --apply to rebuild `categories` and `subcategories` from `chicnewDB.sql`.");
      process.exitCode = 1;
      return;
    }

    console.log("");
    console.log("Rebuilding catalog tables from chicnewDB.sql...");
    await repairCatalogTables();

    console.log("");
    console.log("Post-repair status:");
    const repairedStatuses = await printStatus();
    const stillBroken = repairedStatuses.some((status) => status.state !== "healthy");

    if (stillBroken) {
      throw new Error("Catalog table repair finished, but one or more tables are still not healthy.");
    }

    console.log("Catalog tables repaired successfully.");
  } finally {
    if (db.isInitialized) {
      await db.destroy();
    }
  }
}

main().catch((error) => {
  console.error("Catalog repair failed.");
  console.error(getMysqlMessage(error) ?? error);
  process.exit(1);
});
