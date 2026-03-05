import {
  Document,
  Page,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import LabelBox from "./LabelBox";

const LabelOnlyPdf = ({ orderData }: any) => {
  return (
    <Document>
      {orderData.details.map((item: any, index: number) => (
        <Page key={index} size="A4" style={styles.page}>
          <View style={styles.center}>
            <LabelBox
              item={item}
              purchaseOrderNo={orderData.purchaseOrderNo}
            />
          </View>
        </Page>
      ))}
    </Document>
  );
};

const styles = StyleSheet.create({
  page: {
    justifyContent: "center",
    alignItems: "center",
  },
  center: {
    alignItems: "center",
  },
});

export default LabelOnlyPdf;
