import { ContentLayout } from "@/components/custom/admin-panel/contentLayout";
import { getProductBeaders, getProductColours } from "@/lib/data";
import PlaceSampleOrderForm from "./PlaceSampleOrderForm";

const SampleOrderPage = async () => {
  const [coloursResponse, beadersResponse] = await Promise.all([
    getProductColours({}),
    getProductBeaders({}),
  ]);
  const colours = coloursResponse?.productColours ?? [];
  const beaders = beadersResponse?.beaders ?? [];

  return (
    <ContentLayout title="Sample Order">
      <div className="p-4">
        <PlaceSampleOrderForm colours={colours} beaders={beaders} />
      </div>
    </ContentLayout>
  );
};

export default SampleOrderPage;
