import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
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

const LABELS_PER_PAGE = 1;

const chunkItems = <T,>(items: T[], size: number) => {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
};

const formatMeshColor = (meshColor?: string) => {
  if (!meshColor) return { prefix: "COLOR", name: "UNKNOWN" };

  const match = meshColor.match(/^([A-Z0-9]+)\((.+)\)$/);

  if (!match) {
    return { prefix: "COLOR", name: meshColor };
  }

  return {
    prefix: match[1],
    name: match[2],
  };
};

function LabelTile({ item }: { item: any }) {
  const { prefix, name } = formatMeshColor(item.meshColor || item.color);
  const sizeText = `${PDF_DISPLAY_SIZE_UNIT} ${formatEuSizeSummary([item], {
    alwaysShowCount: true,
  })}`;
  const beader = String(item.beader ?? "").trim();
  const barcodeUrl = build2dBarcodeUrl(item.barcode, 260);
  const purchaseOrderNo = getStatusLabelPurchaseOrderNo(item);
  const purchaseOrderFontSize = getResponsiveStatusLabelFontSize(
    purchaseOrderNo,
    {
      availableWidth: 68,
      maxFontSize: 8.5,
      minFontSize: 4.2,
    },
  );

  return (
    <View style={styles.label}>
      <View style={styles.header}>
        <Text style={styles.headerText}>{item.styleNo}</Text>
      </View>

      <View style={styles.row}>
        <View style={styles.box}>
          <Text style={styles.sizeText}>{sizeText}</Text>
        </View>

        <View style={[styles.box, styles.colorBox]}>
          <Text style={styles.colorPrefix}>{prefix}</Text>
          <Text style={styles.colorName}>{name}</Text>
        </View>
      </View>

      <View style={styles.poBlock}>
        <View style={styles.poValueBox}>
          <Text
            wrap={false}
            style={[styles.poText, { fontSize: purchaseOrderFontSize }]}
          >
            {purchaseOrderNo}
          </Text>
        </View>
        <View style={styles.beaderBox}>
          <Text style={styles.beaderLabel}>BEADER</Text>
          <Text style={styles.beaderText}>{beader || "-"}</Text>
        </View>
      </View>

      {barcodeUrl && (
        <View style={styles.barcodeBlock}>
          {/* <Text style={styles.scanText}>2D SCAN</Text> */}
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={barcodeUrl} style={styles.barcode} />
        </View>
      )}

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
  );
}

export default function LabelSheetPdf({ items }: { items: any[] }) {
  const pages = chunkItems(items, LABELS_PER_PAGE);

  return (
    <Document>
      {pages.map((pageItems, pageIndex) => (
        <Page key={pageIndex} size={[125, 130]} style={styles.page}>
          {pageItems.map((item, itemIndex) => (
            <LabelTile
              key={`${item.barcode ?? itemIndex}-${itemIndex}`}
              item={item}
            />
          ))}
        </Page>
      ))}
    </Document>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#FFFFFF",
    padding: 0,
  },
  label: {
    width: 125,
    height: 130,
    border: "1px solid #000000",
  },
  header: {
    paddingVertical: 3,
    alignItems: "center",
  },
  headerText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  box: {
    width: "48%",
    minHeight: 26,
    border: "1px solid #000000",
    paddingVertical: 3,
    paddingHorizontal: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  sizeText: {
    fontSize: 9,
    fontWeight: "bold",
    textAlign: "center",
  },
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
  poBlock: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 6,
    marginBottom: 3,
    marginTop: 2,
    paddingVertical: 2,
    paddingHorizontal: 2,
    alignItems: "stretch",
  },
  poValueBox: {
    width: "62%",
    justifyContent: "center",
    alignItems: "center",
  },
  beaderBox: {
    width: "34%",
    justifyContent: "center",
    alignItems: "center",
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
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    paddingVertical: 3,
    fontSize: 6,
  },
});
