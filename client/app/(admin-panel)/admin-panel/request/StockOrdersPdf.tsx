import React from "react";
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import dayjs from "dayjs";

const StockOrdersPdf = ({ orderData }: { orderData: any }) => {
  const item = orderData.details?.[0] || {};

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>

        {/* ================= HEADER ================= */}
        <View style={styles.topBanner}>
          <Text style={styles.heading}>Stock Order</Text>
          <Text style={styles.subText}>
            PO: {orderData.purchaseOrderNo}
          </Text>
          <Text style={styles.subText}>
            Customer: {orderData.customerId}
          </Text>
        </View>

        {/* ================= DATES ================= */}
        <View style={styles.dateRow}>
          <Text style={styles.dateText}>
            Received:{" "}
            {orderData.orderReceivedDate
              ? dayjs(orderData.orderReceivedDate).format("DD MMM YYYY")
              : "-"}
          </Text>
          <Text style={styles.dateText}>
            Shipping:{" "}
            {orderData.orderCancellationDate
              ? dayjs(orderData.orderCancellationDate).format("DD MMM YYYY")
              : "-"}
          </Text>
        </View>

        {/* ================= PRODUCT DETAILS ================= */}
        <View style={styles.itemSection}>
          <View style={styles.itemDetails}>

            {/* Table Header */}
            <View style={styles.tableHeaderRow}>
              <Text style={styles.th}>Style No</Text>
              <Text style={styles.th}>Color</Text>
              <Text style={styles.th}>Mesh</Text>
              <Text style={styles.th}>Beading</Text>
              <Text style={styles.th}>Lining</Text>
              <Text style={styles.th}>Lining Color</Text>
              <Text style={styles.th}>Size</Text>
              <Text style={styles.th}>Qty</Text>
            </View>

            {/* Table Body */}
            <View style={styles.tableBodyRow}>
              <Text style={styles.td}>{item.styleNo || "-"}</Text>
              <Text style={styles.td}>{item.color || "-"}</Text>
              <Text style={styles.td}>{item.meshColor || "-"}</Text>
              <Text style={styles.td}>{item.beadingColor || "-"}</Text>
              <Text style={styles.td}>{item.lining || "-"}</Text>
              <Text style={styles.td}>{item.liningColor || "-"}</Text>
              <Text style={styles.td}>{item.size || "-"}</Text>
              <Text style={styles.td}>{item.quantity || "-"}</Text>
            </View>

            {/* ================= BARCODE BLOCK ================= */}
            {item.barcode && (
              <View style={styles.barcodeContainer}>
                <Text style={styles.barcodeTitle}>Barcode</Text>

                <Image
                  src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${item.barcode}&scale=3&height=10&includetext=false`}
                  style={styles.barcodeImage}
                />

                <Text style={styles.barcodeText}>
                  {item.barcode}
                </Text>
              </View>
            )}
          </View>

          {/* ================= PRODUCT IMAGE ================= */}
          {item.image && (
            <View style={styles.imageBox}>
              <Image src={item.image} style={styles.image} />
            </View>
          )}
        </View>

      </Page>
    </Document>
  );
};

export default StockOrdersPdf;

const styles = StyleSheet.create({
  page: {
    padding: 20,
  },

  /* Header */
  topBanner: {
    backgroundColor: "#FF5698",
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
  },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  subText: {
    fontSize: 14,
    marginTop: 2,
    color: "#000",
  },

  /* Dates */
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  dateText: {
    fontSize: 12,
  },

  /* Item section */
  itemSection: {
    flexDirection: "row",
    marginTop: 10,
    gap: 10,
  },
  itemDetails: {
    flex: 1,
  },

  /* Table */
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#ffe1ef",
    padding: 6,
  },
  tableBodyRow: {
    flexDirection: "row",
    backgroundColor: "#fff1f8",
    padding: 6,
  },
  th: {
    width: "13%",
    fontSize: 10,
    fontWeight: "bold",
  },
  td: {
    width: "13%",
    fontSize: 10,
  },

  /* Barcode */
  barcodeContainer: {
    marginTop: 14,
    alignItems: "center",
    padding: 8,
    border: "1px solid #000",
  },
  barcodeTitle: {
    fontSize: 11,
    marginBottom: 4,
  },
  barcodeImage: {
    width: 220,
    height: 60,
  },
  barcodeText: {
    fontSize: 9,
    marginTop: 4,
  },

  /* Image */
  imageBox: {
    width: 160,
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: 180,
    borderRadius: 4,
  },
});
