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

const PAGE_WIDTH = 595;
const PAGE_HEIGHT_WITH_PRICE = 520;
const PAGE_HEIGHT_WITHOUT_PRICE = 430;
const IMAGE_HEIGHT_WITH_PRICE = 396;
const IMAGE_HEIGHT_WITHOUT_PRICE = 306;

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

  return (
    <Document>
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
            size={[
              PAGE_WIDTH,
              showPrice ? PAGE_HEIGHT_WITH_PRICE : PAGE_HEIGHT_WITHOUT_PRICE,
            ]}
            style={styles.page}
            wrap={false}
          >
            <View style={styles.header}>
              <View>
                <Text style={styles.kicker}>Stock Catalog</Text>
                <Text style={styles.title}>{productCode}</Text>
              </View>
              <Text style={styles.pageCount}>
                {index + 1} / {printableStock.length}
              </Text>
            </View>

            <View style={styles.body}>
              <View
                style={[
                  styles.imagePanel,
                  {
                    height: showPrice
                      ? IMAGE_HEIGHT_WITH_PRICE
                      : IMAGE_HEIGHT_WITHOUT_PRICE,
                  },
                ]}
              >
                {image ? (
                  <Image alt={productCode} src={image} style={styles.image} />
                ) : (
                  <View style={styles.emptyImage}>
                    <Text style={styles.emptyImageText}>No image available</Text>
                  </View>
                )}
              </View>

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
            </View>
          </Page>
        );
      })}
    </Document>
  );
};

export default StockCatalogPdf;

const styles = StyleSheet.create({
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
    flexDirection: "row",
    gap: 14,
  },
  imagePanel: {
    width: "54%",
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
    flex: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 10,
  },
  detailsTable: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 6,
    overflow: "hidden",
  },
  detailRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    minHeight: 30,
  },
  detailLabel: {
    width: "42%",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontSize: 9,
    color: "#374151",
    fontWeight: "bold",
  },
  detailValue: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontSize: 9,
    color: "#111827",
  },
});
