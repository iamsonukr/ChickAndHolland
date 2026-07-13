import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import { build2dBarcodeUrl } from "@/lib/barcodes";
import { formatEuSizeSummary, PDF_DISPLAY_SIZE_UNIT } from "@/lib/sizeConversion";

/* ======================================================
   FORMAT MESH COLOR
   "SAS(Aquamarine Jewel)"
   =>
   SAS
   Aquamarine Jewel
====================================================== */
const formatMeshColor = (meshColor?: string) => {
  if (!meshColor) return { prefix: "COLOR", name: "UNKNOWN" };

  const match = meshColor.match(/^([A-Z0-9]+)\((.+)\)$/);

  if (!match) {
    return { prefix: "COLOR", name: meshColor };
  }

  return {
    prefix: match[1], // SAS
    name: match[2],   // Aquamarine Jewel
  };
};

/* ======================================================
   PDF LABEL
====================================================== */
export default function LabelPdf({ item }: { item: any }) {
  const { prefix, name } = formatMeshColor(item.meshColor || item.color);
  const sizeText = `${PDF_DISPLAY_SIZE_UNIT} ${formatEuSizeSummary([item], { alwaysShowCount: true })}`;
  const beader = String(item.beader ?? "").trim();
  const barcodeUrl = build2dBarcodeUrl(item.barcode, 260);

  return (
    <Document>
      <Page size={[125, 130]} style={styles.page}>
        <View style={styles.container}>

          {/* ================= HEADER ================= */}
          <View style={styles.header}>
            <Text style={styles.headerText}>{item.styleNo}</Text>
          </View>

          {/* ================= SIZE + COLOR ================= */}
          <View style={styles.row}>

            {/* SIZE */}
            <View style={styles.box}>
              <Text style={styles.sizeText}>
                {sizeText}
              </Text>
            </View>

            {/* COLOR (MESH COLOR – CLEAN) */}
            <View style={[styles.box, styles.colorBox]}>
              <Text style={styles.colorPrefix}>{prefix}</Text>
              <Text style={styles.colorName}>{name}</Text>
            </View>

          </View>

          {/* ================= PO ================= */}
          <View style={styles.poBlock}>
            <View style={styles.poValueBox}>
              <Text style={styles.poText}>{item.purchaseOrderNo}</Text>
            </View>
            <View style={styles.beaderBox}>
              <Text style={styles.beaderLabel}>BEADER</Text>
              <Text style={styles.beaderText}>{beader || "-"}</Text>
            </View>
          </View>

          {/* ================= BARCODE ================= */}
          {item.barcode && (
            <View style={styles.barcodeBlock}>
              {/* <Text style={styles.scanText}>2D SCAN</Text> */}
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image
                src={barcodeUrl}
                style={styles.barcode}
              />
            </View>
          )}

          {/* ================= FOOTER ================= */}
          <View style={styles.footer}>
            <Text>Chic&Holland</Text>
            <Text>
              {new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "2-digit",
                year: "numeric",
              })}
            </Text>
          </View>

        </View>
      </Page>
    </Document>
  );
}

/* ======================================================
   STYLES (BALANCED FOR PRINT)
====================================================== */
const styles = StyleSheet.create({
  page: {
    backgroundColor: "#FFFFFF",
    padding: 0,
  },

  container: {
    height: "100%",
    border: "1px solid #000000",
  },

  /* HEADER */
  header: {
    paddingVertical: 3,
    alignItems: "center",
  },
  headerText: {
    fontSize: 10,
    fontWeight: "bold",
  },

  /* ROW */
/* ROW */
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    paddingVertical: 4,
  },

  box: {
    width: "48%",
    minHeight: 26,           // ← keeps enough room for larger QR
    border: "1px solid #000000",
    paddingVertical: 3,
    paddingHorizontal: 3,
    alignItems: "center",
    justifyContent: "center",
  },

  /* SIZE */
  sizeText: {
    fontSize: 9,
    fontWeight: "bold",
    textAlign: "center",
    textDecoration: "none",  // ← prevents accidental strikethrough
  },

  /* COLOR */
  colorBox: {
    justifyContent: "center",
  },

  colorPrefix: {
    fontSize: 7,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 2,
  },

  colorName: {
    fontSize: 6,
    fontWeight: "normal",
    textAlign: "center",
    lineHeight: 1.2,
  },

  /* PO */
  poBlock: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 6,
    marginBottom: 3,
    marginTop: 2,
    // border: "1px solid #000000",
    alignItems: "stretch",
  },
  poValueBox: {
    width: "62%",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 3,
    paddingHorizontal: 2,
  },
  beaderBox: {
    width: "34%",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  poText: {
    fontSize: 8.5,
    fontWeight: "bold",
    textAlign: "center",
  },
  beaderLabel: {
    fontSize: 4.8,
    fontWeight: "bold",
    textAlign: "center",
  },
  beaderText: {
    fontSize: 5.8,
    fontWeight: "bold",
    textAlign: "center",
  },

  /* BARCODE */
  barcodeBlock: {
    alignItems: "center",
    marginBottom: 3,
  },
  scanText: {
    fontSize: 6,
    marginBottom: 2,
    fontWeight: "bold",
  },
  barcode: {
    width: 68,
    height: 68,
  },

  /* FOOTER */
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    paddingVertical: 3,
    fontSize: 6,
  },
});
