import net from "net";
import mysql from "mysql2/promise";
import CONFIG from "../config";

const HANDSHAKE_TIMEOUT_MS = 3000;
const MYSQL_CONNECT_TIMEOUT_MS = 5000;

function parseDbUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  const host = url.hostname || "localhost";
  const port = Number(url.port || 3306);
  const database = url.pathname.replace(/^\//, "") || "(none)";
  const username = decodeURIComponent(url.username || "");
  const safeUrl = `${url.protocol}//${username || "(no-user)"}:***@${host}:${port}/${database}`;

  return { url, host, port, database, username, safeUrl };
}

function getMysqlUrlWithTimeout(url: URL) {
  const withTimeout = new URL(url.toString());
  withTimeout.searchParams.set("connectTimeout", String(MYSQL_CONNECT_TIMEOUT_MS));
  return withTimeout.toString();
}

function probeHandshake(host: string, port: number) {
  return new Promise<{ connected: boolean; receivedHandshake: boolean; details: string }>(
    (resolve) => {
      const socket = net.createConnection({ host, port });
      const timeout = setTimeout(() => {
        socket.destroy();
        resolve({
          connected: true,
          receivedHandshake: false,
          details: `Connected, but no MySQL handshake bytes arrived within ${HANDSHAKE_TIMEOUT_MS}ms.`,
        });
      }, HANDSHAKE_TIMEOUT_MS);

      socket.once("connect", () => {
        // MySQL should send the initial protocol handshake immediately after TCP connect.
      });

      socket.once("data", (buffer) => {
        clearTimeout(timeout);
        const firstBytes = buffer.subarray(0, 16).toString("hex");
        socket.destroy();
        resolve({
          connected: true,
          receivedHandshake: true,
          details: `Received handshake bytes: ${firstBytes}`,
        });
      });

      socket.once("error", (error: NodeJS.ErrnoException) => {
        clearTimeout(timeout);
        resolve({
          connected: false,
          receivedHandshake: false,
          details: `${error.code || "ERROR"}: ${error.message}`,
        });
      });
    },
  );
}

async function probeMysql(url: URL) {
  const connection = await mysql.createConnection(getMysqlUrlWithTimeout(url));

  try {
    const [rows] = await connection.query(
      "SELECT DATABASE() AS dbName, VERSION() AS version, @@hostname AS hostName",
    );
    return rows;
  } finally {
    await connection.end();
  }
}

async function main() {
  const parsed = parseDbUrl(CONFIG.DB_URL);

  console.log("DB target");
  console.log(`- url: ${parsed.safeUrl}`);
  console.log(`- host: ${parsed.host}`);
  console.log(`- port: ${parsed.port}`);
  console.log(`- database: ${parsed.database}`);

  console.log("\nTCP / handshake probe");
  const handshake = await probeHandshake(parsed.host, parsed.port);
  console.log(`- tcp connected: ${handshake.connected ? "yes" : "no"}`);
  console.log(`- mysql handshake: ${handshake.receivedHandshake ? "yes" : "no"}`);
  console.log(`- details: ${handshake.details}`);

  console.log("\nmysql2 probe");
  try {
    const rows = await probeMysql(parsed.url);
    console.log("- result: connected");
    console.log(rows);
  } catch (error: any) {
    console.log("- result: failed");
    console.log({
      code: error?.code,
      errno: error?.errno,
      syscall: error?.syscall,
      address: error?.address,
      port: error?.port,
      fatal: error?.fatal,
      message: error?.message,
    });
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
