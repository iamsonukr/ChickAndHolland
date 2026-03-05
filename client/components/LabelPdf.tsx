import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

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
                EU {item.size}/{item.quantity}
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
            <Text style={styles.poText}>
              {item.purchaseOrderNo}
            </Text>
          </View>

          {/* ================= BARCODE ================= */}
          {item.barcode && (
            <View style={styles.barcodeBlock}>
              <Text style={styles.scanText}>SCAN</Text>
              <Image
                src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(
                  item.barcode
                )}&scale=2&height=14&includetext=false`}
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
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    paddingVertical: 6,
  },

  box: {
    width: "48%",
    border: "1px solid #000000",
    paddingVertical: 4,
    paddingHorizontal: 3,
    alignItems: "center",
    justifyContent: "center",
  },

  /* SIZE */
  sizeText: {
    fontSize: 9,
    fontWeight: "bold",
    textAlign: "center",
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
    marginHorizontal: 6,
    marginBottom: 6,
    border: "1px solid #000000",
    paddingVertical: 4,
    paddingHorizontal: 2,
    alignItems: "center",
  },
  poText: {
    fontSize: 8,
    fontWeight: "bold",
    textAlign: "center",
  },

  /* BARCODE */
  barcodeBlock: {
    alignItems: "center",
    marginBottom: 6,
  },
  scanText: {
    fontSize: 6,
    marginBottom: 2,
    fontWeight: "bold",
  },
  barcode: {
    width: 120,
    height: 32,
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
