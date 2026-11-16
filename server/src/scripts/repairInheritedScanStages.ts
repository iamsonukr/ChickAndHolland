import db from "../db";

// Preview by default. Apply only migration baselines proven by their audit note.
const apply = process.argv.includes("--apply");
const notePattern = /^QR repair: inherited (.+?) from grouped barcode (.+?)\. This is a migration baseline, not a new scan\./;

async function main() {
  await db.initialize();
  try {
    if (apply) {
      await db.query("CREATE TABLE IF NOT EXISTS store_style_progress_inherited_archive LIKE store_style_progress");
    }
    await db.transaction(async manager => {
      const notes = await manager.query(
        "SELECT barcode, comment, createdAt FROM barcode_comments WHERE orderType = 'STORE' AND comment LIKE 'QR repair: inherited %'",
      );
      let matched = 0;
      for (const note of notes) {
        const match = String(note.comment).match(notePattern);
        if (!match || match[2] === note.barcode) continue;
        const [first] = await manager.query(
          "SELECT * FROM store_style_progress WHERE barcode = ? ORDER BY id ASC LIMIT 1 FOR UPDATE", [note.barcode],
        );
        if (!first || first.status !== match[1] || Number(first.qty) !== 1) continue;
        const [source] = await manager.query(
          "SELECT id FROM store_style_progress WHERE barcode = ? AND status = ? AND createdAt = ? LIMIT 1",
          [match[2], first.status, first.createdAt],
        );
        const atMigration = Math.abs(new Date(first.createdAt).getTime() - new Date(note.createdAt).getTime()) < 1000;
        if (!source && !atMigration) {
          console.log("Skipped ambiguous baseline", note.barcode);
          continue;
        }
        console.log(apply ? "Removing inherited baseline" : "Would remove inherited baseline", { barcode: note.barcode, progressId: first.id, status: first.status });
        matched++;
        if (!apply) continue;
        // Archive the exact row before removing it. Later genuine scans remain.
        await manager.query("INSERT IGNORE INTO store_style_progress_inherited_archive SELECT * FROM store_style_progress WHERE id = ?", [first.id]);
        await manager.query("DELETE FROM store_style_progress WHERE id = ? AND barcode = ?", [first.id, note.barcode]);
        const [latest] = await manager.query("SELECT status FROM store_style_progress WHERE barcode = ? ORDER BY id DESC LIMIT 1", [note.barcode]);
        await manager.query("UPDATE orderStyles SET currentStatus = ? WHERE barcode = ?", [latest?.status ?? null, note.barcode]);
      }
      console.log({ mode: apply ? "apply" : "preview", matched });
    });
  } finally {
    await db.destroy();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
