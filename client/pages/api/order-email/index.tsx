import React from "react";
import type { NextApiRequest, NextApiResponse } from "next";
import { sendMail } from "../../../lib/mail";
import { generateRandomColour } from "../../../lib/utils";
import {
  Document,
  Image,
  Page,
  renderToBuffer,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import dayjs from "dayjs";
import Mail from "nodemailer/lib/mailer";

type Response = {
  success: boolean;
  message: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Response>,
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  try {
    const { orderData } = req.body;

    const pdf = await renderToBuffer(
      <OrderCustomerPdf orderData={orderData} />,
    );

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .container {
                background-color: #f9f9f9;
                border: 1px solid #ddd;
                border-radius: 5px;
                padding: 20px;
            }
            .header {
                text-align: center;
                margin-bottom: 20px;
            }
            .logo {
                max-width: 150px;
                height: auto;
            }
            .footer {
                text-align: center;
                margin-top: 20px;
                font-size: 0.9em;
                color: #777;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <p>Hello ${orderData?.customer?.name},</p>
            <p>Thank you for your order.</p>
            <p>Please find the order details attached below.</p>
            <p>Best Regards,<br>Chic & Holland Team</p>
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} Chic & Holland. All rights reserved.</p>
        </div>
    </body>
    </html>
    `;

    const mailOptions: Mail.Options = {
      to: orderData?.customer?.email,
      // to: "pavan@ymtsindia.org",
      subject: "Order Confirmation",
      html: htmlContent,
      attachments: [
        {
          filename: "Order Details.pdf",
          content: pdf,
          contentType: "application/pdf",
        },
      ],
      replyTo: "support@chicandholland.com",
    };

    await sendMail(mailOptions);

    return res.status(200).json({
      success: true,
      message: "Order sent successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
}

interface OrderCustomerPdfProps {
  orderData: {
    styles: Array<{
      styleNo: string;
      convertedFirstProductImage?: string;
      colorType: string;
      customColor?: string[];
      sizeCountry: string;
      size: string;
      customSize?: string[];
      quantity?: number;
      customSizesQuantity?: Array<{
        size: string;
        quantity: number;
      }>;
      photoUrls?: string[];
      comments?: string[];
    }>;
    purchaeOrderNo?: string;
    purchaseOrderNo?: string;
    orderReceivedDate: string;
    orderCancellationDate: string;
    customer: {
      name: string;
      email: string;
    };
  };
}

const OrderCustomerPdf: React.FC<OrderCustomerPdfProps> = ({ orderData }) => {
  return (
    <Document>
      {orderData?.styles?.map((oData, i) => {
        const productImageUrl = oData.convertedFirstProductImage;

        return (
          <Page
            size="A4"
            style={styles.page}
            orientation="landscape"
            key={i}
            wrap={false}
          >
            <View style={styles.topBanner}>
              <Text>{oData.styleNo}</Text>
              <Text>
                {orderData.purchaeOrderNo || orderData.purchaseOrderNo}
              </Text>
              <View>
                <Text>
                  Order Received date:{" "}
                  {dayjs(orderData.orderReceivedDate).format("DD MMM YYYY")}
                </Text>
                <Text>
                  Order Shipping date:{" "}
                  {dayjs(orderData.orderCancellationDate).format("DD MMM YYYY")}
                </Text>
              </View>
            </View>
            <View style={styles.styleDetails}>
              <View
                style={{
                  flexDirection: "column",
                  width: productImageUrl ? "60%" : "100%",
                }}
              >
                <View style={{ flexDirection: "column" }}>
                  <View style={{ flexDirection: "row" }}>
                    <View
                      style={{
                        width: "33%",
                        backgroundColor: "#FF5698",
                        justifyContent: "center",
                        alignItems: "center",
                        padding: "15px",
                      }}
                    >
                      <Text>Color</Text>
                    </View>
                    <View
                      style={{
                        width: "33%",
                        backgroundColor: "#FF5698",
                        justifyContent: "center",
                        alignItems: "center",
                        padding: "15px",
                      }}
                    >
                      <Text>Size ({oData.sizeCountry})</Text>
                    </View>
                    <View
                      style={{
                        width: "33%",
                        backgroundColor: "#FF5698",
                        justifyContent: "center",
                        alignItems: "center",
                        padding: "15px",
                      }}
                    >
                      <Text>Quantity</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: "row" }}>
                    <View
                      style={{
                        width: "33%",
                        backgroundColor: "pink",
                        justifyContent: "center",
                        alignItems: "center",
                        padding: "15px",
                        paddingVertical: "30px",
                        flexDirection: "column",
                      }}
                    >
                      {oData.colorType == "Custom" ? (
                        <View style={{ width: "100%" }}>
                          {oData.customColor?.map((c: string) => {
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
                        width: "33%",
                        backgroundColor: "pink",
                        justifyContent: "center",
                        alignItems: "center",
                        padding: "15px",
                        paddingVertical: "30px",
                      }}
                    >
                      <View>
                        {oData.size !== "Custom" ? (
                          <Text>{oData.size}</Text>
                        ) : (
                          oData.customSizesQuantity?.map((sQ: any) => {
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
                        width: "33%",
                        backgroundColor: "pink",
                        justifyContent: "center",
                        alignItems: "center",
                        padding: "15px",
                        paddingVertical: "30px",
                      }}
                    >
                      {/*<Text>{oData.quantity}</Text>*/}

                      {oData.size != "Custom" ? (
                        <Text>{oData.quantity}</Text>
                      ) : (
                        <Text>
                          {oData.customSizesQuantity?.reduce(
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
                      {oData.photoUrls?.map((url, i) => (
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
                      ))}
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
                  {oData.comments?.map((comment, i) => {
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
                </View>
              </View>

              {productImageUrl && (
                <View style={{ width: "40%" }}>
                  <Image
                    src={productImageUrl}
                    style={{
                      width: "100%",
                      height: 450,
                      objectFit: "cover",
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
  styleDetails: {
    flexDirection: "row",
    marginTop: 20,
  },
});
