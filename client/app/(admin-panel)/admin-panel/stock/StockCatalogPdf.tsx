import React from "react";
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

type StockCatalogPdfProps = {
  stock: any[];
  colours: any[];
  showPrice: boolean;
};

const COVER_LOGO_SRC = "/logo-1-transparent.png";
const COVER_WORDMARK_SRC = "/brand-logo.png";

const normalizeImages = (images: unknown) => {
  if (Array.isArray(images)) return images.filter(Boolean);
  return images ? [images] : [];
};

const getFirstStockImage = (item: any) => {
  if (item?.catalogImage) return item.catalogImage;

  const images = [
    ...normalizeImages(item?.images),
    ...normalizeImages(item?.product?.images),
  ];

  return images.find((image: any) => image?.name)?.name || item?.image || "";
};

const getColourName = (colours: any[] = [], colourValue?: string | null) => {
  if (!colourValue) return "-";
  return (
    colours.find((colour: any) => colour.hexcode === colourValue)?.name ||
    colourValue
  );
};

const getColourLabel = (
  colours: any[] = [],
  colourValue?: string | null,
  defaultColourValue?: string | null,
) => {
  const resolvedName = getColourName(colours, colourValue);

  if (
    colourValue &&
    defaultColourValue &&
    colourValue === defaultColourValue &&
    resolvedName !== "No Color"
  ) {
    return `SAS(${resolvedName})`;
  }

  return resolvedName;
};

const getLiningLabel = (item: any) => {
  const lining = item?.lining || "-";

  if (
    item?.product?.lining &&
    item.product.lining === item.lining &&
    lining !== "No Lining"
  ) {
    return `SAS(${lining})`;
  }

  return lining;
};

const formatPrice = (value: unknown, item: any) => {
  const price = Number(value);
  if (!Number.isFinite(price)) return "-";

  const currency =
    item?.currencyCode ||
    (String(item?.currencySymbol ?? "").trim() || "EUR");

  return `${currency} ${price.toFixed(2)}`;
};

const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value || "-"}</Text>
  </View>
);

const StockCatalogPdf = ({
  stock,
  colours,
  showPrice,
}: StockCatalogPdfProps) => {
  const printableStock = Array.isArray(stock)
    ? stock.filter((item) => item?.product)
    : [];
  const downloadYear = new Date().getFullYear();

  return (
    <Document>
      <Page
        size="A4"
        style={styles.titlePage}
        wrap={false}
      >
        <View style={styles.titlePageContent}>
          <Image src={COVER_LOGO_SRC} style={styles.coverLogo} />
          <Image src={COVER_WORDMARK_SRC} style={styles.coverWordmark} />
          <Text style={styles.stocklistTitle}>STOCK LIST</Text>
          <Text style={styles.yearTitle}>{downloadYear}</Text>
        </View>
      </Page>

      {printableStock.map((item, index) => {
        const productCode =
          item?.product?.productCode || item?.productCode || item?.styleNo || "-";
        const image = getFirstStockImage(item);
        const originalPrice = Number(item?.price ?? 0);
        const discountedPrice = Number(item?.discountedPrice ?? originalPrice);
        const hasDiscount =
          originalPrice > 0 && discountedPrice > 0 && discountedPrice < originalPrice;

        return (
          <Page
            key={item?.id ?? index}
            size="A4"
            style={styles.page}
            wrap={false}
          >
            <View style={styles.header}>
              <View>
                <Text style={styles.kicker}>Stock Catalog</Text>
                <Text style={styles.title}>{productCode}</Text>
              </View>
              <Text style={styles.pageCount}>
                {index + 2} / {printableStock.length + 1}
              </Text>
            </View>

            <View style={styles.body}>
              <View style={styles.detailsPanel}>
                <Text style={styles.sectionTitle}>Product Details</Text>

                <View style={styles.detailsTable}>
                  <DetailRow label="Stock ID" value={String(item?.id ?? "-")} />
                  <DetailRow label="Style No" value={productCode} />
                  <DetailRow
                    label="Quantity"
                    value={String(item?.quantity ?? "-")}
                  />
                  <DetailRow
                    label="Size"
                    value={`${item?.size ?? "-"} (${item?.size_country ?? "-"})`}
                  />
                  <DetailRow
                    label="Source"
                    value={item?.sourceLocation || "-"}
                  />
                  <DetailRow
                    label="Mesh"
                    value={getColourLabel(
                      colours,
                      item?.mesh_color,
                      item?.product?.mesh_color,
                    )}
                  />
                  <DetailRow
                    label="Beading"
                    value={getColourLabel(
                      colours,
                      item?.beading_color,
                      item?.product?.beading_color,
                    )}
                  />
                  <DetailRow label="Lining" value={getLiningLabel(item)} />
                  <DetailRow
                    label="Lining Color"
                    value={getColourLabel(
                      colours,
                      item?.lining_color,
                      item?.product?.lining_color,
                    )}
                  />

                  {showPrice && (
                    <>
                      <DetailRow
                        label="Price"
                        value={formatPrice(item?.price, item)}
                      />
                      <DetailRow
                        label="Discount"
                        value={`${Number(item?.discount ?? 0)}%`}
                      />
                      <DetailRow
                        label="Final Price"
                        value={
                          hasDiscount
                            ? formatPrice(item?.discountedPrice, item)
                            : formatPrice(item?.price, item)
                        }
                      />
                    </>
                  )}
                </View>
              </View>

              <View style={styles.imagePanel}>
                {image ? (
                  <Image alt={productCode} src={image} style={styles.image} />
                ) : (
                  <View style={styles.emptyImage}>
                    <Text style={styles.emptyImageText}>No image available</Text>
                  </View>
                )}
              </View>
            </View>
          </Page>
        );
      })}
    </Document>
  );
};

export default StockCatalogPdf;

const styles = StyleSheet.create({
  titlePage: {
    backgroundColor: "#F1E6DF",
    color: "#8A5C4A",
    fontFamily: "Times-Roman",
    padding: 36,
    position: "relative",
  },
  titlePageContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#B98C79",
    padding: 34,
  },
  coverLogo: {
    width: 170,
    height: 170,
    objectFit: "contain",
    marginBottom: 24,
  },
  coverWordmark: {
    width: 345,
    height: 45,
    objectFit: "contain",
    marginBottom: 30,
  },
  stocklistTitle: {
    fontSize: 40,
    fontWeight: "normal",
    letterSpacing: 3,
    marginBottom: 30,
    textAlign: "center",
    color: "#8A5C4A",
  },
  yearTitle: {
    fontSize: 30,
    fontWeight: "normal",
    textAlign: "center",
    color: "#8A5C4A",
  },
  page: {
    padding: 22,
    backgroundColor: "#FFFFFF",
    color: "#111827",
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingBottom: 10,
    marginBottom: 12,
  },
  kicker: {
    fontSize: 9,
    color: "#6B7280",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  pageCount: {
    fontSize: 10,
    color: "#6B7280",
  },
  body: {
    flex: 1,
    flexDirection: "column",
    gap: 12,
  },
  imagePanel: {
    flex: 1,
    width: "100%",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: "#F9FAFB",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
  emptyImage: {
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyImageText: {
    fontSize: 12,
    color: "#6B7280",
  },
  detailsPanel: {
    width: "100%",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 8,
  },
  detailsTable: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderLeftWidth: 1,
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
  },
  detailRow: {
    width: "50%",
    flexDirection: "row",
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderBottomColor: "#E5E7EB",
    borderRightColor: "#E5E7EB",
    minHeight: 24,
  },
  detailLabel: {
    width: "44%",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 6,
    paddingVertical: 6,
    fontSize: 8,
    color: "#374151",
    fontWeight: "bold",
  },
  detailValue: {
    flex: 1,
    paddingHorizontal: 6,
    paddingVertical: 6,
    fontSize: 8,
    color: "#111827",
  },
});
