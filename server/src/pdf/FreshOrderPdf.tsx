import GroupedOrderPdf from "./GroupedOrderPdf";

const FreshOrderPdf = ({ orderData }: { orderData: any }) => {
  return <GroupedOrderPdf orderData={orderData} showShippingDate={true} />;
};

export default FreshOrderPdf;
