import GroupedOrderPdf from "./GroupedOrderPdf";

// const RetailerPdf = ({ orderData }: { orderData: any }) => {
//   return <GroupedOrderPdf orderData={orderData} showShippingDate={true} />;
// };

const RetailerPdf = ({
  orderData,
  showShippingDate = true,
}: {
  orderData: any;
  showShippingDate?: boolean;
}) => {
  return (
    <GroupedOrderPdf
      orderData={orderData}
      showShippingDate={showShippingDate}
      useLargeReferenceImages
    />
  );
};

export default RetailerPdf;
