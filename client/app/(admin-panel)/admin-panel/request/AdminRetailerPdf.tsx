import GroupedOrderPdf from "./GroupedOrderPdf";

const AdminRetailerPdf = ({ orderData }: { orderData: any }) => {
  return <GroupedOrderPdf orderData={orderData} showShippingDate={true} />;
};

export default AdminRetailerPdf;
