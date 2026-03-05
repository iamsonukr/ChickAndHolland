import React from "react";
import type { NextApiRequest, NextApiResponse } from "next";
import { sendMail } from "@/lib/mail";
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
import { fresh } from "@/lib/utils";

type Response = {
  success: boolean;
  message: string;
};
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "50mb", // Increase to 10MB (adjust as needed)
    },
  },
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

    const pdf = await renderToBuffer(<StockOrdersPdf orderData={orderData} />);

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
              <p>Hello,</p>
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
      to: orderData?.manufacturingEmailAddress,
      // to: orderData?.email || orderData?.manufacturingEmailAddress,

      // cc: "pavan@ymtsindia.org",
      // cc: "krishna.web@ymtsindia.org",
      // cc: "coordinator@ymtsindia.in",
      cc: ["info@chicandholland.com", "krishna.web@ymtsindia.org"],
      subject: orderData.purchaseOrderNo,
      html: htmlContent,
      attachments: [
        {
          filename: orderData.purchaseOrderNo,
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

const StockOrdersPdf = ({ orderData }: { orderData: any }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page} orientation="landscape" wrap>
        {orderData.details.map((item: any, index: number) => (
          <View key={index} style={styles.fullPageContainer}>
            {/* Top Banner */}
            <View style={styles.topBanner}>
              <Text style={styles.bannerText}>{item.styleNo}</Text>
              <Text style={styles.bannerText}>{orderData.purchaseOrderNo}</Text>
              <View>
                <Text style={styles.bannerText}>
                  Order Received Date:{" "}
                  {dayjs(orderData.orderReceivedDate).format("DD MMM YYYY")}
                </Text>
                {/* <Text style={styles.bannerText}>
                      Order Shipping Date:{" "}
                      {dayjs(orderData.orderCancellationDate).format("DD MMM YYYY")}
                    </Text> */}
              </View>
            </View>

            <View style={styles.contentContainer}>
              <View style={styles.detailsSection}>
                {/* Product Details Table - Improved with larger text */}
                <View style={styles.tableContainer}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      backgroundColor: "#FFD1E6",
                      borderBottom: "1px solid #000",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "bold",
                        padding: 6,
                        backgroundColor: "#FFD1E6",
                        textAlign: "center",
                      }}
                    >
                      Product Specifications
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "bold",
                        padding: 6,
                        backgroundColor: "#FFD1E6",
                        textAlign: "center",
                      }}
                    >
                      {orderData.orderType == "Fresh"
                        ? fresh
                        : orderData.orderType}
                    </Text>
                  </View>

                  {/* Row 1 */}
                  <View style={styles.tableRow}>
                    <View style={styles.tableHeaderCell}>
                      <Text style={styles.headerText}>Color</Text>
                    </View>
                    <View style={styles.tableDataCell}>
                      <Text style={styles.dataText}>{item.color}</Text>
                    </View>
                    <View style={styles.tableHeaderCell}>
                      <Text style={styles.headerText}>Mesh Color</Text>
                    </View>
                    <View style={styles.tableDataCell}>
                      <Text style={styles.dataText}>{item.meshColor}</Text>
                    </View>
                  </View>

                  {/* Row 2 */}
                  <View style={styles.tableRow}>
                    <View style={styles.tableHeaderCell}>
                      <Text style={styles.headerText}>Beading Color</Text>
                    </View>
                    <View style={styles.tableDataCell}>
                      <Text style={styles.dataText}>{item.beadingColor}</Text>
                    </View>
                    <View style={styles.tableHeaderCell}>
                      <Text style={styles.headerText}>Lining</Text>
                    </View>
                    <View style={styles.tableDataCell}>
                      <Text style={styles.dataText}>{item.lining}</Text>
                    </View>
                  </View>

                  {/* Row 3 */}
                  <View style={styles.tableRow}>
                    <View style={styles.tableHeaderCell}>
                      <Text style={styles.headerText}>Lining Color</Text>
                    </View>
                    <View style={styles.tableDataCell}>
                      <Text style={styles.dataText}>{item.liningColor}</Text>
                    </View>
                    <View style={styles.tableHeaderCell}>
                      <Text style={styles.headerText}>Quantity</Text>
                    </View>
                    <View style={styles.tableDataCell}>
                      <Text style={styles.dataText}>{item.quantity}</Text>
                    </View>
                  </View>

                  {/* Row 4 - Modified to only have Lining Color */}
                  <View style={styles.tableRow}>
                    <View style={styles.tableHeaderCell}>
                      <Text style={styles.headerText}>Size</Text>
                    </View>
                    <View
                      style={{
                        width: "75%",
                        padding: 8,
                        backgroundColor: "#FFE6F2",
                        justifyContent: "center",
                        borderRight: "1px solid #ccc",
                        fontSize: 12,
                      }}
                    >
                      <Text style={styles.dataText}>{item.size}</Text>
                    </View>
                  </View>
                </View>

                {/* Customization Section */}
                <View style={styles.customizationContainer}>
                  <Text style={styles.sectionTitle}>Customization Details</Text>
                  <View style={styles.commentsBox}>
                    <Text style={styles.commentsText}>{item.comments}</Text>
                  </View>
                </View>

                {/* Extra Images Section */}
                <View style={styles.extraImagesContainer}>
                  <View style={styles.extraImagesGrid}>
                    {/* Add up to 4 additional images if available */}
                    {item.refImg?.length > 0 &&
                      item.refImg.map((imgSrc: string, imgIndex: number) => (
                        <Image
                          key={imgIndex}
                          src={imgSrc}
                          style={styles.additionalImage}
                        />
                      ))}

                    {/* Fallback if no extra images array but has individual properties */}
                    {!item.extraImages && item.secondImage && (
                      <Image
                        src={item.secondImage}
                        style={styles.additionalImage}
                      />
                    )}

                    {!item.extraImages && item.thirdImage && (
                      <Image
                        src={item.thirdImage}
                        style={styles.additionalImage}
                      />
                    )}
                  </View>
                </View>
              </View>

              {/* Main Image Section - Untouched as requested */}
              {item.image && (
                <View style={styles.mainImageContainer}>
                  <Image src={item.image} style={styles.mainImage} />
                </View>
              )}
            </View>
          </View>
        ))}
      </Page>
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
    height: "100%",
    flexDirection: "column",
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
    fontSize: 15,
    fontWeight: "bold",
  },
  contentContainer: {
    flex: 1,
    flexDirection: "row",
    marginTop: 10,
  },
  detailsSection: {
    width: "60%",
    flexDirection: "column",
    padding: 10,
    gap: 15,
  },
  tableContainer: {
    border: "1px solid #000",
    borderRadius: 4,
    width: "100%",
    marginBottom: 15,
  },
  tableTitle: {
    fontSize: 14,
    fontWeight: "bold",
    padding: 6,
    backgroundColor: "#FFD1E6",
    textAlign: "center",
    borderBottom: "1px solid #000",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1px solid #ccc",
  },
  tableHeaderCell: {
    width: "25%",
    padding: 8,
    backgroundColor: "#FF5698",
    justifyContent: "center",
    borderRight: "1px solid #ccc",
  },
  tableDataCell: {
    width: "25%",
    padding: 8,
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
    fontSize: 14,
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
    flex: 1,
    flexDirection: "column",
    marginTop: 10,
  },
  extraImagesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  additionalImage: {
    width: "45%",
    height: 150,
    objectFit: "contain",
    borderRadius: 4,
    border: "1px solid #ccc",
  },
  mainImageContainer: {
    width: "40%",
    height: "100%",
    padding: 5,
  },
  mainImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    borderRadius: 4,
  },
});
