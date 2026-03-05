import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import dayjs from "dayjs";
import { generateRandomColour } from "@/lib/utils";

const OrderCustomerPdf = ({ orderData }: { orderData: any }) => {
  return (
    <Document>
      {orderData?.styles?.map((oData: any, i: number) => {
        const productImageUrl = oData.convertedFirstProductImage;

        return (
          <Page
            size="A4"
            style={styles.page}
            orientation="landscape"
            key={i}
            wrap
          >
            <View style={styles.topBanner}>
              <Text style={styles.bannerText}>{oData.styleNo}</Text>
              <Text style={styles.bannerText}>
                {orderData.purchaeOrderNo || orderData.purchaseOrderNo}
              </Text>
              <View>
                <Text style={styles.bannerText}>
                  Order Received date:{" "}
                  {dayjs(orderData.orderReceivedDate).format("DD MMM YYYY")}
                </Text>
                <Text style={styles.bannerText}>
                  Order Shipping date:{" "}
                  {dayjs(orderData.orderCancellationDate).format("DD MMM YYYY")}
                </Text>
              </View>
            </View>
            <View style={styles.styleDetails}>
              <View
                style={{
                  flexDirection: "column",
                  width: productImageUrl ? "70%" : "100%",
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
                        {oData.size !== "Custom" ? (
                          <Text>{oData.size}</Text>
                        ) : (
                          oData.customSizesQuantity.map((sQ: any) => {
                            return (
                              <Text>
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
                          {oData.customSizesQuantity.reduce(
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
    <Text style={{ fontSize: 14, marginBottom: 4 }}>Barcode</Text>

    <Image
      src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${oData.barcode}`}
      style={{ width: 80, height: 80 }}
    />

    <Text style={{ fontSize: 12, marginTop: 4 }}>{oData.barcode}</Text>
  </View>
)}

                </View>
              </View>

              {productImageUrl && (
                <View style={{ width: "30%" }}>
                  <Image
                    src={productImageUrl}
                    style={{
                      width: "100%",
                      height: "360px",
                    }}
                  />
                </View>
              )}
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
  styleDetails: {
    flexDirection: "row",
    marginTop: 20,
  },
});

export default OrderCustomerPdf;
