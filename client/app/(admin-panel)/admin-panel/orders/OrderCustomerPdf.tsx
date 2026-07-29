import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { generateRandomColour } from "@/lib/utils";
import { getCustomSizeEntries } from "@/lib/sizeConversion";
import { formatDateOnlyDisplay } from "@/lib/dateOnly";
import { getCompactStyleNoBannerFontSize } from "@/lib/pdfTextSizing";

const parseMaybeArray = (value: unknown): any[] => {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const OrderCustomerPdf = ({ orderData }: { orderData: any }) => {
  return (
    <Document>
      {orderData?.styles?.map((oData: any, i: number) => {
        const productImageUrl = oData.convertedFirstProductImage;
        const customSizeEntries = getCustomSizeEntries(oData);
        const customSizesQuantity = parseMaybeArray(oData.customSizesQuantity);

        return (
          <Page
            size="A4"
            style={styles.page}
            orientation="landscape"
            key={i}
            wrap
          >
            <View style={styles.topBanner}>
              <Text
                style={[
                  styles.bannerStyleNo,
                  { fontSize: getCompactStyleNoBannerFontSize(oData.styleNo) },
                ]}
              >
                {oData.styleNo}
              </Text>
              <Text style={styles.bannerPurchaseOrderNo}>
                {orderData.purchaeOrderNo || orderData.purchaseOrderNo}
              </Text>
              <View>
                <Text style={styles.bannerText}>
                  Order Received date:{" "}
                  {formatDateOnlyDisplay(orderData.orderReceivedDate)}
                </Text>
                <Text style={styles.bannerText}>
                  Order Shipping date:{" "}
                  {formatDateOnlyDisplay(orderData.orderCancellationDate)}
                </Text>
              </View>
            </View>
            <View style={styles.styleDetails}>
              <View
                style={{
                  flexDirection: "column",
                  width: "70%",
                }}
              >
                <View style={{ flexDirection: "column" }}>
                  <View style={{ flexDirection: "row" }}>
                    <View
                      style={{
                        width: "20%",
                        backgroundColor: "#FF5698",
                        justifyContent: "center",
                        alignItems: "center",
                        padding: "4px",
                      }}
                    >
                      <Text>Color</Text>
                    </View>
                    <View
                      style={{
                        width: "25%",
                        backgroundColor: "#FF5698",
                        justifyContent: "center",
                        alignItems: "center",
                        padding: "4px",
                      }}
                    >
                      <Text>Size ({oData.sizeCountry})</Text>
                    </View>
                    <View
                      style={{
                        width: "55%",
                        backgroundColor: "#FF5698",
                        justifyContent: "center",
                        alignItems: "center",
                        padding: "4px",
                      }}
                    >
                      <Text>Quantity</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: "row" }}>
                    <View
                      style={{
                        width: "20%",
                        backgroundColor: "pink",
                        justifyContent: "center",
                        alignItems: "center",
                        padding: "4px",
                        flexDirection: "column",
                      }}
                    >
                      {oData.colorType == "Custom" ? (
                        <View style={{ width: "100%" }}>
                          {oData.customColor.map((c: string) => {
                            return (
                              <Text key={c} style={{ width: "100%" }}>
                                {c}
                              </Text>
                            );
                          })}
                        </View>
                      ) : (
                        <Text>{oData.colorType}</Text>
                      )}
                    </View>
                    <View
                      style={{
                        width: "25%",
                        backgroundColor: "pink",
                        justifyContent: "center",
                        alignItems: "center",
                        padding: "4px",
                      }}
                    >
                      <View>
                        {customSizeEntries.length ? (
                          customSizeEntries.map((size) => (
                            <Text key={size}>{`\u2022 ${size}`}</Text>
                          ))
                        ) : oData.size !== "Custom" ? (
                          <Text>{oData.size}</Text>
                        ) : (
                          customSizesQuantity.map((sQ: any, sizeIndex: number) => {
                            return (
                              <Text key={`${sQ.size}-${sizeIndex}`}>
                                {sQ.size} - {sQ.quantity}{" "}
                              </Text>
                            );
                          })
                        )}
                      </View>
                    </View>
                    <View
                      style={{
                        width: "55%",
                        backgroundColor: "pink",
                        justifyContent: "center",
                        alignItems: "center",
                        padding: "4px",
                      }}
                    >
                      {/*<Text>{oData.quantity}</Text>*/}

                      {oData.size != "Custom" ? (
                        <Text>{oData.quantity}</Text>
                      ) : (
                        <Text>
                          {customSizesQuantity.reduce(
                            (
                              sum: number,
                              sQ: { size: string; quantity: number },
                            ) => sum + Number(sQ.quantity),
                            0,
                          )}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
                {oData.photoUrls && (
                  <View style={{ flexDirection: "column", marginTop: 10 }}>
                    <Text>Custom Lining</Text>
                    <View
                      style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        justifyContent: "flex-start",
                      }}
                    >
                      {oData.photoUrls?.map((url: string, i: number) => {
                        return (
                          <View
                            key={i}
                            style={{ margin: 2, width: "calc(32% - 4px)" }}
                          >
                            <Image
                              src={url}
                              style={{
                                width: "100%",
                                height: 200,
                                objectFit: "cover",
                              }}
                            />
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}

                <View
                  style={{
                    flexDirection: "column",
                    marginTop: 10,
                    gap: 4,
                    marginRight: 2,
                  }}
                >
                  {oData.comments &&
                    oData?.comments?.map((comment: any, i: number) => {
                      const color = generateRandomColour();
                      return (
                        <View
                          key={i}
                          style={{
                            backgroundColor: color.background,
                            padding: 4,
                          }}
                        >
                          <Text
                            style={{
                              color: color.text,
                            }}
                          >
                            {comment}
                          </Text>
                        </View>
                      );
                    })}
                  {/* BARCODE SECTION */}
                  {oData.barcode && (
                    <View style={{ marginTop: 10, alignItems: "center" }}>
                      <Text style={{ fontSize: 14, marginBottom: 4 }}>
                        Barcode
                      </Text>

                      <Image
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${oData.barcode}`}
                        style={{ width: 80, height: 80 }}
                      />

                      <Text style={{ fontSize: 12, marginTop: 4 }}>
                        {oData.barcode}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={{ width: "30%" }}>
                {productImageUrl ? (
                  <Image
                    src={productImageUrl}
                    style={{
                      width: "100%",
                      height: "360px",
                    }}
                  />
                ) : (
                  <View
                    style={{
                      width: "100%",
                      height: "360px",
                      border: "1px solid #999",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 12,
                    }}
                  >
                    <Text style={{ color: "#666", fontSize: 11 }}>
                      Product image unavailable
                    </Text>
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

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    paddingHorizontal: 30,
    paddingVertical: 10,
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
  bannerStyleNo: {
    color: "black",
    fontSize: 18,
    fontWeight: "bold",
    width: "32%",
  },
  bannerPurchaseOrderNo: {
    color: "black",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    width: "28%",
  },
  styleDetails: {
    flexDirection: "row",
    marginTop: 20,
  },
});

export default OrderCustomerPdf;
