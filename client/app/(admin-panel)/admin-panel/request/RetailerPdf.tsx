import GroupedOrderPdf from "./GroupedOrderPdf";

const RetailerPdf = ({ orderData }: { orderData: any }) => {
  return <GroupedOrderPdf orderData={orderData} />;
};

export default RetailerPdf;
