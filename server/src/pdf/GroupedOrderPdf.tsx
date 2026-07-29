import { build2dBarcodeUrl, normalizeBarcodeValue } from "../lib/barcodes";
import { Document, Image, Page, Text, View } from "@react-pdf/renderer";
import {
  formatEuSizeSummary,
  formatEuSizeText,
  PDF_DISPLAY_SIZE_UNIT,
} from "../lib/sizeConversion";
import { formatDateOnlyDisplay } from "../lib/dateOnly";
import { styles } from "./PDFStyle";
import {
  getQrBoxSizeFontSize,
  getStyleNoBannerFontSize,
  getStyleNoCardFontSize,
} from "../lib/pdfTextSizing";

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
    item.beader ?? "",
    item.lining ?? "",
    item.liningColor ?? "",
    item.comments ?? "",
    item.image ?? "",
    PDF_DISPLAY_SIZE_UNIT,
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
      groupItems,
      pageIndex,
      totalPages: pages.length,
      variants,
    }));
  });
};

const getGroupQuantity = (items: any[]) =>
  items.reduce((total, item) => {
    const quantity = Number(item.quantity);
    return total + (Number.isFinite(quantity) ? quantity : 0);
  }, 0);

const getVariantSizeText = (item: any) => formatEuSizeText(item);

const getSizeSummary = (items: any[]) =>
  formatEuSizeSummary(items, { alwaysShowCount: true });

const parseCommentItems = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.flatMap(parseCommentItems);
  }

  const text = String(value ?? "").trim();
  if (!text) return [];

  const items: string[] = [];
  let current = "";

  for (let index = 0; index < text.length; index += 1) {
    if (text[index] !== ",") {
      current += text[index];
      continue;
    }

    if (text[index + 1] === ",") {
      current += ",";
      index += 1;
      continue;
    }

    const trimmed = current.trim();
    if (trimmed) items.push(trimmed);
    current = "";
  }

  const trimmed = current.trim();
  if (trimmed) items.push(trimmed);

  return items;
};

const getCommentItems = (variants: any[], fallback?: string) => {
  const uniqueComments = Array.from(
    new Set(
      variants
        .flatMap((item) => parseCommentItems(item.comments))
        .filter(Boolean),
    ),
  );

  return uniqueComments.length ? uniqueComments : parseCommentItems(fallback);
};

const getDynamicFontSize = (text: string): number => {
  const length = text?.length ?? 0;
  if (length <= 10) return 26;
  if (length <= 15) return 24;
  if (length <= 20) return 22;
  if (length <= 28) return 20;
  if (length <= 36) return 18;
  return 7;
};

const getReferenceImages = (variants: any[]) =>
  Array.from(new Set(variants.flatMap((item) => normalizeImages(item.refImg))));

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
      {groupedPages.map(({ baseItem, groupItems, pageIndex, totalPages, variants }, index) => {
        const referenceImages = getReferenceImages(groupItems);
        const sizeCountry = PDF_DISPLAY_SIZE_UNIT;

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
                <Text
                  style={[
                    styles.bannerTexts,
                    { fontSize: getStyleNoBannerFontSize(baseItem?.styleNo) },
                  ]}
                >
                  {baseItem?.styleNo}
                  {/* {totalPages > 1 ? ` (${pageIndex + 1}/${totalPages})` : ""} */}
                </Text>
                <Text
                  style={[
                    styles.bannerTextPurchaseOrderNo,
                    { fontSize: getDynamicFontSize(orderData.purchaseOrderNo) },
                  ]}
                >
                  {orderData.purchaseOrderNo}
                </Text>
                <View>
                  <Text style={styles.bannerText}>
                    Order Received Date:{" "}
                    {formatDateOnlyDisplay(orderData.orderReceivedDate)}
                  </Text>
                  {showShippingDate && orderData.orderCancellationDate && (
                    <Text style={styles.bannerText}>
                      Order Shipping Date:{" "}
                      {formatDateOnlyDisplay(orderData.orderCancellationDate)}
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
                            <Text style={styles.dataText}>{getGroupQuantity(variants)}</Text>
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
                        {getCommentItems(variants, baseItem?.comments).length > 0 ? (
                          getCommentItems(variants, baseItem?.comments).map((comment, commentIndex) => (
                            <View key={`${comment}-${commentIndex}`} style={styles.commentsBulletRow}>
                              <Text style={styles.commentsBullet}>•</Text>
                              <Text style={styles.commentsBulletText}>{comment}</Text>
                            </View>
                          ))
                        ) : (
                          <Text style={styles.commentsText}>-</Text>
                        )}
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

              <View style={styles.pageVariantOverlay} wrap={false}>
                <View style={styles.variantOverlay}>
                  {/* <Text style={styles.variantOverlayTitle}>Size 1/ 2D Barcode Details</Text> */}
                  <View style={styles.variantGrid}>
                    {variants.map((variant: any, variantIndex: number) => {
                      const normalizedBarcode = normalizeBarcodeValue(variant.barcode);
                      const variantSizeText = getVariantSizeText(variant);

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
                          <View style={styles.variantCardTop}>
                            <Text
                              style={[
                                styles.variantTitle,
                                { fontSize: getStyleNoCardFontSize(variant.styleNo) },
                              ]}
                            >
                              {variant.styleNo}
                            </Text>
                            <View style={styles.variantInfoGroup}>
                              <View style={styles.variantInfoRow}>
                                <Text
                                  style={[
                                    styles.variantInfoLabel,
                                    { fontSize: getQrBoxSizeFontSize(variantSizeText) },
                                  ]}
                                >
                                  Size: {variantSizeText}
                                </Text>
                                {/* <Text style={styles.variantInfoValue}>{getVariantSizeText(variant)}</Text> */}
                              </View>
                              <View style={[styles.variantInfoRow, styles.variantInfoRowBorder]}>
                                <Text style={styles.variantInfoLabel}>QTY:</Text>
                                <Text style={styles.variantInfoValue}>{variant.quantity ?? "-"}</Text>
                              </View>

                              <View style={[styles.variantInfoRow, styles.variantInfoRowBorder]}>
                                <Text style={styles.variantInfoLabel}>Color:</Text>
                              </View>
                              <View style={[styles.colorValuesRow, styles.variantInfoRowBorder]}>
                                {variant.color ? (
                                  <Text style={styles.colorDetail}>{variant.color}</Text>
                                ) : null}
                                {variant.meshColor ? (
                                  <Text style={styles.colorDetail}>{variant.meshColor}</Text>
                                ) : null}
                                {!variant.color && !variant.meshColor ? (
                                  <Text style={styles.colorDetail}>-</Text>
                                ) : null}
                              </View>
                              <View style={[styles.variantInfoRow, styles.variantInfoRowBorder]}>
                                <Text style={styles.variantInfoValue}>{variant.beader || "-"}</Text>
                              </View>
                            </View>
                          </View>

                          <View style={styles.variantBarcodeSection}>
                            {normalizedBarcode ? (
                              <>
                                <Image
                                  src={build2dBarcodeUrl(normalizedBarcode, 80)}
                                  style={styles.variantBarcode}
                                />
                                <Text style={styles.variantCodeText}>
                                  {normalizedBarcode?.split("-")[0]}
                                  {"\n"}-{normalizedBarcode?.split("-")[1]}
                                </Text>
                              </>
                            ) : (
                              <Text style={styles.variantCodeText}>
                                Barcode unavailable
                              </Text>
                            )}
                          </View>
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

export default GroupedOrderPdf;
