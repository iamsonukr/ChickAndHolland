import { ContentLayout } from "@/components/custom/admin-panel/contentLayout";
import { getProductColours } from "@/lib/data";
import PlaceSampleOrderForm from "./PlaceSampleOrderForm";

const SampleOrderPage = async () => {
  const coloursResponse = await getProductColours({});
  const colours = coloursResponse?.productColours ?? [];

  return (
    <ContentLayout title="Sample Order">
      <div className="p-4">
        <PlaceSampleOrderForm colours={colours} />
      </div>
    </ContentLayout>
  );
};

export default SampleOrderPage;
