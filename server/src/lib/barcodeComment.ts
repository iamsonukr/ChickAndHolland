// Historical QR migrations wrote audit metadata into the editable comment field.
// Keep the stored note for repair scripts, but do not expose it as a user comment.
const inheritedQrNote = /^QR repair: inherited [^\r\n]+? from grouped barcode [^\r\n]+?\. This is a migration baseline, not a new scan\.(?:[ \t]*\r?\n|[ \t]*)/;

export function getUserBarcodeComment(value: unknown): string {
  let comment = String(value ?? "");
  while (inheritedQrNote.test(comment)) {
    comment = comment.replace(inheritedQrNote, "");
  }
  return comment;
}
