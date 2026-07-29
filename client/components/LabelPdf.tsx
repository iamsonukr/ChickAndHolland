import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import { build2dBarcodeUrl } from "@/lib/barcodes";
import {
  formatEuSizeSummary,
  PDF_DISPLAY_SIZE_UNIT,
} from "@/lib/sizeConversion";
import {
  getResponsiveStatusLabelFontSize,
  getStatusLabelPurchaseOrderNo,
} from "@/lib/statusLabelText";

/* ======================================================
   FORMAT MESH COLOR
   "SAS(Aquamarine Jewel)"
   =>
   SAS
   Aquamarine Jewel
====================================================== */
const formatMeshColor = (meshColor?: string) => {
  if (!meshColor) return { prefix: "COLOR", code: "", name: "UNKNOWN" };

  const splitColorValue = (value: string) => {
    const hyphenIndex = value.indexOf("-");
    if (hyphenIndex <= 0) {
      return { code: "", name: value.trim() };
    }

    return {
      code: value.slice(0, hyphenIndex).trim(),
      name: `- ${value.slice(hyphenIndex + 1).trim()}`,
    };
  };

  const match = meshColor.match(/^([A-Z0-9]+)\((.+)\)$/);

  if (match) {
    const colorValue = splitColorValue(match[2]);

    return {
      prefix: match[1], // SAS
      code: colorValue.code,
      name: colorValue.name, // Aquamarine Jewel
    };
  }

  const hyphenIndex = meshColor.indexOf("-");
  if (hyphenIndex > 0) {
    const prefix = meshColor.slice(0, hyphenIndex).trim();
    const name = meshColor.slice(hyphenIndex + 1).trim();

    return {
      prefix,
      code: "",
      name: `- ${name}`,
    };
  }

  return {
    prefix: "COLOR",
    code: "",
    name: meshColor,
  };
};

/* ======================================================
   PDF LABEL
====================================================== */
export default function LabelPdf({ item }: { item: any }) {
  const { prefix, code, name } = formatMeshColor(item.meshColor || item.color);
  const sizeText = `${PDF_DISPLAY_SIZE_UNIT} ${formatEuSizeSummary([item], { alwaysShowCount: true })}`;
  const beader = String(item.beader ?? "").trim();
  const barcodeUrl = build2dBarcodeUrl(item.barcode, 260);
  const purchaseOrderNo = getStatusLabelPurchaseOrderNo(item);
  const purchaseOrderFontSize = getResponsiveStatusLabelFontSize(
    purchaseOrderNo,
    {
      availableWidth: 108,
      maxFontSize: 13.5,
      minFontSize: 5,
      averageCharWidth: 0.72,
    },
  );
  const colorFontSize = getResponsiveStatusLabelFontSize(name, {
    availableWidth: 52,
    maxFontSize: 8,
    minFontSize: 3.2,
    averageCharWidth: 0.62,
  });
  const sizeFontSize = getResponsiveStatusLabelFontSize(sizeText, {
    availableWidth: 52,
    maxFontSize: 12,
    minFontSize: 3.2,
    averageCharWidth: 0.58,
  });

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
              <Text
                style={[styles.sizeText, { fontSize: sizeFontSize }]}
              >
                {sizeText}
              </Text>
            </View>

            {/* COLOR (MESH COLOR – CLEAN) */}
            <View style={[styles.box, styles.colorBox]}>
              <Text wrap={false} style={styles.colorPrefix}>
                {prefix}
              </Text>
              {code && (
                <Text wrap={false} style={styles.colorCode}>
                  {code}
                </Text>
              )}
              <Text
                wrap={false}
                style={[styles.colorName, { fontSize: colorFontSize }]}
              >
                {name}
              </Text>
            </View>
          </View>

          {/* ================= PO ================= */}
          <View style={styles.poBlock}>
            <View style={styles.poValueBox}>
              <Text
                wrap={false}
                style={[styles.poText, { fontSize: purchaseOrderFontSize }]}
              >
                {purchaseOrderNo}
              </Text>
            </View>
          </View>

          {/* ================= BARCODE ================= */}
          {item.barcode && (
            <View style={styles.barcodeBlock}>
              {/* <Text style={styles.scanText}>2D SCAN</Text> */}
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image src={barcodeUrl} style={styles.barcode} />
            </View>
          )}

          {/* ================= FOOTER ================= */}
          <View style={styles.footer}>
            <Text style={styles.footerBrand}>Chic&Holland</Text>
            <Text style={styles.footerBeader}>{beader || "-"}</Text>
            <Text style={styles.footerDate}>
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
    minHeight: 26, // ← keeps enough room for larger QR
    border: "1px solid #000000",
    paddingVertical: 3,
    paddingHorizontal: 3,
    alignItems: "center",
    justifyContent: "center",
  },

  /* SIZE */
  sizeText: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 1,
    width: "100%",
    textDecoration: "none", // ← prevents accidental strikethrough
  },

  /* COLOR */
  colorBox: {
    marginTop: -1,
    justifyContent: "center",
  },

  colorPrefix: {
    fontSize: 7,
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 1.2,
    marginBottom: 1,
    maxLines: 1,
    width: "100%",
  },

  colorCode: {
    fontSize: 7,
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 1.2,
    marginBottom: 1,
    maxLines: 1,
    width: "100%",
  },

  colorName: {
    fontSize: 8,
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 1,
    maxLines: 1,
    width: "100%",
  },

  /* PO */
  poBlock: {
    marginHorizontal: 6,
    marginBottom: 3,
    marginTop: -2,
    // border: "1px solid #000000",
    alignItems: "center",
  },
  poValueBox: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 3,
    paddingHorizontal: 2,
  },
  poText: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 1,
    maxLines: 1,
    width: "100%",
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
    alignItems: "center",
    paddingHorizontal: 4,
    paddingVertical: 3,
    fontSize: 6,
  },
  footerBrand: {
    width: "30%",
    fontSize: 4.8,
    maxLines: 1,
  },
  footerBeader: {
    width: "40%",
    fontSize: 5.2,
    fontWeight: "bold",
    textAlign: "center",
    maxLines: 1,
  },
  footerDate: {
    width: "30%",
    textAlign: "right",
  },
});
