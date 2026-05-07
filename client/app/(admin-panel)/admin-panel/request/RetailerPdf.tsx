import GroupedOrderPdf from "./GroupedOrderPdf";

const RetailerPdf = ({ orderData }: { orderData: any }) => {
  return <GroupedOrderPdf orderData={orderData} showShippingDate={true} />;
};

export default RetailerPdf;
