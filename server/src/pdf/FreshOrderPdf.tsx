import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  PDFDownloadLink,
} from "@react-pdf/renderer";
import dayjs from "dayjs";
import { Svg, Path } from "@react-pdf/renderer";

const fresh = "Fresh";

const FreshOrderPdf = ({ orderData }: { orderData: any }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page} orientation="landscape" wrap>
        {orderData.details.map((item: any, index: number) => (
          <View key={index} style={styles.fullPageContainer}>
            {/* Top Banner */}
            <View style={styles.topBanner}>
              <Text style={styles.bannerTexts}>{item.styleNo}</Text>
              <Text style={styles.bannerTextPurchaseOrderNo}>
                {orderData.purchaseOrderNo}
              </Text>
              <View>
                <Text style={styles.bannerText}>
                  Order Received Date:{" "}
                  {dayjs(orderData.orderReceivedDate).format("DD MMM YYYY")}
                </Text>
                {orderData.orderCancellationDate && (
                  <Text style={styles.bannerText}>
                    Order Shipping Date:{" "}
                    {dayjs(orderData.orderCancellationDate).format(
                      "DD MMM YYYY",
                    )}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.contentContainer}>
              <View style={styles.detailsSection}>
                {/* Product Details Table */}
                <View style={styles.tableContainer}>
                  <View style={styles.tableTitleRow}>
                    <Text style={styles.tableTitle}>
                      Product Specifications
                    </Text>
                    <Text style={styles.orderTypeText}>
                      {orderData.orderType == "Fresh"
                        ? fresh
                        : orderData.orderType}
                    </Text>
                  </View>

                  {/* Row 1 */}
                  <View style={styles.tableRow}>
                    <View style={styles.leftSection}>
                      <View style={styles.tableHeaderCell}>
                        <Text style={styles.headerText}>Color</Text>
                      </View>
                      <View style={styles.tableDataCell}>
                        <Text style={styles.dataText}>{item.color}</Text>
                      </View>
                    </View>
                    <View style={styles.rightSection}>
                      <View style={styles.tableHeaderCell}>
                        <Text style={styles.headerText}>Mesh Color</Text>
                      </View>
                      <View style={styles.tableDataCell}>
                        <Text style={styles.dataText}>{item.meshColor}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Row 2 */}
                  <View style={styles.tableRow}>
                    <View style={styles.leftSection}>
                      <View style={styles.tableHeaderCell}>
                        <Text style={styles.headerText}>Quantity</Text>
                      </View>
                      <View style={styles.tableDataCell}>
                        <Text style={styles.dataText}>{item.quantity}</Text>
                      </View>
                    </View>
                    <View style={styles.rightSection}>
                      <View style={styles.tableHeaderCell}>
                        <Text style={styles.headerText}>Beading Color</Text>
                      </View>
                      <View style={styles.tableDataCell}>
                        <Text style={styles.dataText}>{item.beadingColor}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Rows 3 & 4 - Custom merged layout */}
                  <View style={styles.mergedContainer}>
                    {/* Left side - Size cell spans full height */}
                    <View style={styles.leftMergedContainer}>
                      <View style={styles.sizeHeaderCell}>
                        <Text style={styles.headerText}>
                          Size ({orderData.details[0]?.size_country})
                        </Text>
                      </View>
                      <View style={styles.sizeDataCell}>
                       <Text style={styles.dataText} wrap>
  {item.admin_us_size
    ? `US ${item.admin_us_size} (${item.size_country} ${item.size})`
    : ` ${item.size}`  
  }
</Text>

{/* ${item.size_country} */}


                      </View>
                    </View>

                    {/* Right side - Two stacked cells */}
                    <View style={styles.rightStackedContainer}>
                      {/* Lining Color row */}
                      <View style={styles.stackedRowTop}>
                        <View style={styles.stackedHeaderCell}>
                          <Text style={styles.headerText}>Lining Color</Text>
                        </View>
                        <View style={styles.stackedDataCell}>
                          <Text style={styles.dataText}>
                            {item.liningColor}
                          </Text>
                        </View>
                      </View>

                      {/* Lining row */}
                      <View style={styles.stackedRowBottom}>
                        <View style={styles.stackedHeaderCell}>
                          <Text style={styles.headerText}>Lining</Text>
                        </View>
                        <View style={styles.stackedDataCell}>
                          <Text style={styles.dataText}>{item.lining}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>

                {/* BARCODE BLOCK */}
{/* {item.barcode && (
  <View style={{ marginTop: 10, alignItems: "center" }}>
    <Text style={{ fontSize: 12, marginBottom: 4 }}>Barcode</Text>

    <Image
      src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${item.barcode}&scale=3&height=10&includetext=false`}
      style={{ width: 220, height: 60 }}
    />

    <Text style={{ fontSize: 10, marginTop: 4 }}>
      {item.barcode}
    </Text>
  </View>
)} */}



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
                    {item.refImg?.length > 0 &&
                      item.refImg.map((imgSrc: string, imgIndex: number) => (
                        <Image
                          key={imgIndex}
                          src={imgSrc}
                          style={styles.additionalImage}
                        />
                      ))}
                  </View>
                </View>
              </View>

              {/* {item.image && (
                <View style={styles.mainImageContainer}>
                  <Image src={item.image} style={styles.mainImage} />
                </View>
              )} */}
              {/* Main Image Section */}
{item.image && (
  <View style={styles.mainImageContainer}>
    {/* MAIN IMAGE */}
    <Image src={item.image} style={styles.mainImage} />

    {/* 🔥 RIGHT SIDE LABEL BOX */}
    <View
      style={{
        position: "absolute",
        bottom: -45,   // ⬅️ only this changed
        right: -20,
        width: 120,
        backgroundColor: "#FFFFFF",
        border: "2px solid #000",
      }}
    >
      {/* STYLE */}
      <View style={{ borderBottom: "2px solid #000", paddingVertical: 6 }}>
        <Text style={{ fontSize: 11, textAlign: "center" }}>
          {item.styleNo}
        </Text>
      </View>

      {/* SIZE */}
      <View style={{ borderBottom: "2px solid #000", paddingVertical: 6 }}>
        <Text style={{ fontSize: 11, textAlign: "center" }}>
          {item.size}
        </Text>
      </View>
      <View style={{ borderBottom: "2px solid #000", paddingVertical: 6 }}>
        <Text style={{ fontSize: 11, textAlign: "center" }}>
          {item.color}
        </Text>
      </View>

      {/* PO */}
      <View style={{ borderBottom: "2px solid #000", paddingVertical: 6 }}>
        <Text style={{ fontSize: 11, textAlign: "center" }}>
          {orderData.purchaseOrderNo}
        </Text>
      </View>

      {/* COLOR (commented) */}

      {/* ✅ BARCODE */}
      {item.barcode && (
        <View style={{ paddingVertical: 6, alignItems: "center" }}>
          <Image
            src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${item.barcode}&scale=2&height=8&includetext=false`}
            style={{ width: 110, height: 35 }}
          />
          <Text style={{ fontSize: 8, marginTop: 2 }}>
            {/* {item.barcode} */}
          </Text>
        </View>
      )}
    </View>
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
    fontSize: 18,
    fontWeight: "bold",
  },
 bannerTexts: {
  color: "black",
  fontSize: 25,
  fontWeight: "bold",
}
,
  bannerTextPurchaseOrderNo: {
    color: "black",
    fontSize: 30,
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
  tableTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#FFD1E6",
    borderBottom: "1px solid #000",
    alignItems: "center",
    flexGrow: 1,
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
    fontSize: 14,
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
    width: "60%",
    height: 190,
    objectFit: "contain",
    borderRadius: 4,
    border: "1px solid #ccc",
  },
  mainImageContainer: {
    width: "40%",
    height: "470px",
    padding: 5,
  },
  mainImage: {
    width: "100%",
    height: "100%",
    borderRadius: 4,
  },
});

export default FreshOrderPdf;
