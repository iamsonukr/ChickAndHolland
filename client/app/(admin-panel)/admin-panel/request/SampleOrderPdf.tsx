import GroupedOrderPdf from "./GroupedOrderPdf";

const SampleOrderPdf = ({ orderData }: { orderData: any }) => {
  return (
    <GroupedOrderPdf
      orderData={orderData}
      showShippingDate={true}
      preserveMainImageAspect
      keepReferenceImagesInSingleRow
    />
  );
};

export default SampleOrderPdf;
