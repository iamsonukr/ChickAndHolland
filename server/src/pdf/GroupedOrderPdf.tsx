import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import dayjs from "dayjs";

const fresh = "Fresh Order";

const chunkItems = <T,>(items: T[], size: number) => {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
};

const normalizeImages = (images: unknown) => {
  if (!Array.isArray(images)) return [];
  return images.filter(Boolean) as string[];
};

const buildGroupKey = (item: any) =>
  JSON.stringify([
    item.styleNo ?? "",
    item.color ?? "",
    item.meshColor ?? "",
    item.beadingColor ?? "",
    item.lining ?? "",
    item.liningColor ?? "",
    item.comments ?? "",
    item.image ?? "",
    item.size_country ?? "",
    normalizeImages(item.refImg).join("|"),
  ]);

const buildGroupedPages = (details: any[] = []) => {
  const groupedDetails = new Map<string, any[]>();

  details.forEach((item) => {
    const groupKey = buildGroupKey(item);
    const existingItems = groupedDetails.get(groupKey) ?? [];
    existingItems.push(item);
    groupedDetails.set(groupKey, existingItems);
  });

  return Array.from(groupedDetails.values()).flatMap((groupItems) => {
    const pages = chunkItems(groupItems, 4);

    return pages.map((variants, pageIndex) => ({
      baseItem: groupItems[0],
      pageIndex,
      totalPages: pages.length,
      variants,
    }));
  });
};

const getPageQuantity = (variants: any[]) =>
  variants.reduce((total, item) => {
    const quantity = Number(item.quantity);
    return total + (Number.isFinite(quantity) ? quantity : 0);
  }, 0);

const getVariantSizeText = (item: any) => {
  if (item.admin_us_size) {
    return `US ${item.admin_us_size} (${item.size_country} ${item.size})`;
  }

  return item.size ?? "-";
};

const getSizeSummary = (variants: any[]) =>
  variants.map((item) => getVariantSizeText(item)).join(", ");

const getCommentsSummary = (variants: any[], fallback?: string) => {
  const uniqueComments = Array.from(
    new Set(
      variants
        .map((item) => String(item.comments ?? "").trim())
        .filter(Boolean),
    ),
  );

  return uniqueComments.join("\n") || fallback || "-";
};

const getReferenceImages = (variants: any[]) =>
  Array.from(new Set(variants.flatMap((item) => normalizeImages(item.refImg))));

const normalizeBarcodeValue = (barcode?: string | null) => {
  const normalizedBarcode = String(barcode ?? "").trim();

  if (!normalizedBarcode) return "";
  if (["N/A", "NA", "NULL", "UNDEFINED"].includes(normalizedBarcode.toUpperCase())) {
    return "";
  }

  return normalizedBarcode;
};

const getVariantBarcodeUrl = (barcode?: string | null) => {
  const normalizedBarcode = normalizeBarcodeValue(barcode);

  if (!normalizedBarcode) return "";

  return `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(
    normalizedBarcode,
  )}&scale=2&height=8&includetext=false`;
};

const GroupedOrderPdf = ({
  orderData,
  showShippingDate = false,
}: {
  orderData: any;
  showShippingDate?: boolean;
}) => {
  const groupedPages = buildGroupedPages(orderData?.details ?? []);

  return (
    <Document>
      {groupedPages.map(({ baseItem, pageIndex, totalPages, variants }, index) => {
        const referenceImages = getReferenceImages(variants);
        const sizeCountry =
          baseItem?.size_country ?? orderData?.details?.[0]?.size_country ?? "-";

        return (
          <Page
            key={`${baseItem?.styleNo ?? "style"}-${index}`}
            size="A4"
            style={styles.page}
            orientation="landscape"
            wrap={false}
          >
            <View style={styles.fullPageContainer} wrap={false}>
              <View style={styles.topBanner}>
                <Text style={styles.bannerTexts}>
                  {baseItem?.styleNo}
                  {totalPages > 1 ? ` (${pageIndex + 1}/${totalPages})` : ""}
                </Text>
                <Text style={styles.bannerTextPurchaseOrderNo}>
                  {orderData.purchaseOrderNo}
                </Text>
                <View>
                  <Text style={styles.bannerText}>
                    Order Received Date:{" "}
                    {dayjs(orderData.orderReceivedDate).format("DD MMM YYYY")}
                  </Text>
                  {showShippingDate && orderData.orderCancellationDate && (
                    <Text style={styles.bannerText}>
                      Order Shipping Date:{" "}
                      {dayjs(orderData.orderCancellationDate).format("DD MMM YYYY")}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.contentContainer} wrap={false}>
                <View style={styles.topContentRow} wrap={false}>
                  <View style={styles.detailsSection}>
                    <View style={styles.tableContainer}>
                      <View style={styles.tableTitleRow}>
                        <Text style={styles.tableTitle}>Product Specifications</Text>
                        <Text style={styles.orderTypeText}>
                          {orderData.orderType === "Fresh" ? fresh : orderData.orderType}
                        </Text>
                      </View>

                      <View style={styles.tableRow}>
                        <View style={styles.leftSection}>
                          <View style={styles.tableHeaderCell}>
                            <Text style={styles.headerText}>Color</Text>
                          </View>
                          <View style={styles.tableDataCell}>
                            <Text style={styles.dataText}>{baseItem?.color}</Text>
                          </View>
                        </View>
                        <View style={styles.rightSection}>
                          <View style={styles.tableHeaderCell}>
                            <Text style={styles.headerText}>Mesh Color</Text>
                          </View>
                          <View style={styles.tableDataCell}>
                            <Text style={styles.dataText}>{baseItem?.meshColor}</Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.tableRow}>
                        <View style={styles.leftSection}>
                          <View style={styles.tableHeaderCell}>
                            <Text style={styles.headerText}>Quantity</Text>
                          </View>
                          <View style={styles.tableDataCell}>
                            <Text style={styles.dataText}>{getPageQuantity(variants)}</Text>
                          </View>
                        </View>
                        <View style={styles.rightSection}>
                          <View style={styles.tableHeaderCell}>
                            <Text style={styles.headerText}>Beading Color</Text>
                          </View>
                          <View style={styles.tableDataCell}>
                            <Text style={styles.dataText}>{baseItem?.beadingColor}</Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.mergedContainer}>
                        <View style={styles.leftMergedContainer}>
                          <View style={styles.sizeHeaderCell}>
                            <Text style={styles.headerText}>Size ({sizeCountry})</Text>
                          </View>
                          <View style={styles.sizeDataCell}>
                            <Text style={styles.dataText} wrap>
                              {getSizeSummary(variants)}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.rightStackedContainer}>
                          <View style={styles.stackedRowTop}>
                            <View style={styles.stackedHeaderCell}>
                              <Text style={styles.headerText}>Lining Color</Text>
                            </View>
                            <View style={styles.stackedDataCell}>
                              <Text style={styles.dataText}>{baseItem?.liningColor}</Text>
                            </View>
                          </View>

                          <View style={styles.stackedRowBottom}>
                            <View style={styles.stackedHeaderCell}>
                              <Text style={styles.headerText}>Lining</Text>
                            </View>
                            <View style={styles.stackedDataCell}>
                              <Text style={styles.dataText}>{baseItem?.lining}</Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    </View>

                    <View style={styles.customizationContainer}>
                      <Text style={styles.sectionTitle}>Customization Details</Text>
                      <View style={styles.commentsBox}>
                        <Text style={styles.commentsText}>
                          {getCommentsSummary(variants, baseItem?.comments)}
                        </Text>
                      </View>
                    </View>

                    {referenceImages.length > 0 && (
                      <View style={styles.extraImagesContainer}>
                        <View style={styles.extraImagesGrid}>
                          {referenceImages.map((imgSrc, imgIndex) => (
                            <Image
                              key={`${imgSrc}-${imgIndex}`}
                              src={imgSrc}
                              style={styles.additionalImage}
                            />
                          ))}
                        </View>
                      </View>
                    )}
                  </View>

                  <View style={styles.rightPanel}>
                    <View style={styles.mainImageFrame}>
                      {baseItem?.image ? (
                        <Image src={baseItem.image} style={styles.mainImage} />
                      ) : (
                        <View style={styles.mainImagePlaceholder}>
                          <Text style={styles.mainImagePlaceholderText}>
                            Product image unavailable
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </View>

{/* bar code details starts */}
              <View style={styles.pageVariantOverlay} wrap={false}>
                <View style={styles.variantOverlay}>
                  <Text style={styles.variantOverlayTitle}>Size / Barcode Details</Text>
                  <View style={styles.variantGrid}>
                    {variants.map((variant: any, variantIndex: number) => {
                      const normalizedBarcode = normalizeBarcodeValue(variant.barcode);

                      return (
                        <View
                          key={`${normalizedBarcode || variantIndex}-${variantIndex}`}
                          style={[
                            styles.variantCard,
                            variantIndex < variants.length - 1
                              ? styles.variantCardSpaced
                              : styles.variantCardLast,
                          ]}
                        >
                          <Text style={styles.variantTitle}>{variant.styleNo}</Text>
                          <Text style={styles.variantValue} wrap>
                            {getVariantSizeText(variant)}
                          </Text>
                          <Text style={styles.variantMeta}>Qty: {variant.quantity}</Text>

                          {normalizedBarcode ? (
                            <>
                              <Image
                                src={getVariantBarcodeUrl(normalizedBarcode)}
                                style={styles.variantBarcode}
                              />
                              <Text style={styles.variantCodeText}>
                                {normalizedBarcode}
                              </Text>
                            </>
                          ) : (
                            <Text style={styles.variantCodeText}>
                              Barcode unavailable
                            </Text>
                          )}
                        </View>
                      );
                    })}
                  </View>
                </View>
              </View>
            </View>
          </Page>
        );
      })}
    </Document>
  );
};

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  fullPageContainer: {
    flex: 1,
    flexDirection: "column",
    position: "relative",
  },
  topBanner: {
    backgroundColor: "#FF5698",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
  },
  bannerText: {
    color: "black",
    fontSize: 18,
    fontWeight: "bold",
  },
  bannerTexts: {
    color: "black",
    fontSize: 25,
    fontWeight: "bold",
  },
  bannerTextPurchaseOrderNo: {
    color: "black",
    fontSize: 30,
    fontWeight: "bold",
  },
  contentContainer: {
    flex: 1,
    marginTop: 10,
    flexDirection: "column",
  },
  topContentRow: {
    flex: 1,
    flexDirection: "row",
  },
  detailsSection: {
    width: "62%",
    flexDirection: "column",
    paddingTop: 10,
    paddingBottom: 10,
    paddingRight: 8,
  },
  tableContainer: {
    border: "1px solid #000",
    borderRadius: 4,
    width: "100%",
    marginBottom: 15,
  },
  tableTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#FFD1E6",
    borderBottom: "1px solid #000",
    alignItems: "center",
  },
  tableTitle: {
    fontSize: 14,
    fontWeight: "bold",
    padding: 4,
    textAlign: "left",
    flex: 1,
  },
  orderTypeText: {
    fontSize: 14,
    fontWeight: "bold",
    padding: 4,
    color: "#0000FF",
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1px solid #ccc",
  },
  mergedContainer: {
    flexDirection: "row",
    borderBottom: "1px solid #ccc",
  },
  leftMergedContainer: {
    width: "40%",
    flexDirection: "row",
  },
  rightStackedContainer: {
    width: "60%",
    flexDirection: "column",
  },
  stackedRowTop: {
    flexDirection: "row",
    borderBottom: "1px solid #ccc",
  },
  stackedRowBottom: {
    flexDirection: "row",
  },
  leftSection: {
    width: "40%",
    flexDirection: "row",
  },
  rightSection: {
    width: "60%",
    flexDirection: "row",
  },
  tableHeaderCell: {
    width: "40%",
    padding: 4,
    backgroundColor: "#FF5698",
    justifyContent: "center",
    borderRight: "1px solid #ccc",
  },
  tableDataCell: {
    width: "60%",
    padding: 4,
    backgroundColor: "#FFE6F2",
    justifyContent: "center",
    borderRight: "1px solid #ccc",
  },
  sizeHeaderCell: {
    width: "40%",
    padding: 4,
    backgroundColor: "#FF5698",
    justifyContent: "center",
    borderRight: "1px solid #ccc",
  },
  sizeDataCell: {
    width: "60%",
    padding: 4,
    backgroundColor: "#FFE6F2",
    justifyContent: "center",
    borderRight: "1px solid #ccc",
  },
  stackedHeaderCell: {
    width: "40%",
    padding: 4,
    backgroundColor: "#FF5698",
    justifyContent: "center",
    borderRight: "1px solid #ccc",
  },
  stackedDataCell: {
    width: "60%",
    padding: 4,
    backgroundColor: "#FFE6F2",
    justifyContent: "center",
    borderRight: "1px solid #ccc",
  },
  headerText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#ffffff",
  },
  dataText: {
    fontSize: 13,
    width: "100%",
  },
  customizationContainer: {
    flexDirection: "column",
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    textDecoration: "underline",
    marginBottom: 8,
    color: "#FF5698",
  },
  commentsBox: {
    border: "1px solid #ccc",
    borderRadius: 4,
    padding: 8,
    backgroundColor: "#f9f9f9",
    minHeight: 60,
  },
  commentsText: {
    fontSize: 12,
    lineHeight: 1.4,
  },
  extraImagesContainer: {
    flexDirection: "column",
    marginTop: 10,
  },
  extraImagesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  additionalImage: {
    width: "48%",
    height: 120,
    objectFit: "contain",
    borderRadius: 4,
    border: "1px solid #ccc",
    marginBottom: 8,
    marginRight: "2%",
  },
  rightPanel: {
    width: "38%",
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 8,
    flexDirection: "column",
  },
  mainImageFrame: {
    flex: 1,
    border: "1px solid #999",
    borderRadius: 4,
    padding: 6,
    justifyContent: "center",
    overflow: "hidden",
  },
  mainImagePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
  },
  mainImagePlaceholderText: {
    fontSize: 11,
    color: "#666",
    textAlign: "center",
  },
  mainImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    borderRadius: 4,
  },

  // ── Variant / Barcode overlay ──────────────────────────────────────────────
  pageVariantOverlay: {
    position: "absolute",
    right: 0,
    bottom: 0,
    // Widened to 42% so 4 cards have breathing room
    width: "42%",
    paddingLeft: 8,
    paddingBottom: 10,
  },
  variantOverlay: {
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 8,
    backgroundColor: "rgba(255,255,255,0.97)",
    borderRadius: 4,
    border: "1px solid #999",
  },
  variantOverlayTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#FF5698",
    marginBottom: 6,
    textAlign: "center",
  },
  variantGrid: {
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "stretch",
    // gap replaces the fragile %-margin trick
    gap: 4,
  },
  variantCard: {
    // flex:1 distributes width evenly across however many cards exist (up to 4)
    flex: 1,
    border: "1px solid #000",
    borderRadius: 4,
    paddingVertical: 5,
    paddingHorizontal: 4,
    minHeight: 100,
    backgroundColor: "#ffffff",
    justifyContent: "flex-start",
    alignItems: "center",
    overflow: "hidden",
  },
  variantCardSpaced: {
    // spacing now handled by gap on the grid, keep empty for API compat
    marginRight: 0,
  },
  variantCardLast: {
    marginRight: 0,
  },
  variantTitle: {
    fontSize: 9,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 3,
  },
  variantValue: {
    fontSize: 8,
    textAlign: "center",
    marginBottom: 3,
    lineHeight: 1.3,
  },
  variantMeta: {
    fontSize: 8,
    textAlign: "center",
    marginBottom: 2,
  },
  variantBarcode: {
    // percentage width keeps it inside the card regardless of card size
    width: "95%",
    height: 22,
    alignSelf: "center",
    marginTop: 5,
    marginBottom: 3,
  },
  variantCodeText: {
    fontSize: 6,
    textAlign: "center",
    // prevent long barcodes from stretching the card
    maxWidth: "100%",
    overflow: "hidden",
  },
});

export default GroupedOrderPdf;