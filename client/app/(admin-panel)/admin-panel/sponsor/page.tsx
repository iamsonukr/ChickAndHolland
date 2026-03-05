import { ContentLayout } from "@/components/custom/admin-panel/contentLayout";
import { getSponsors } from "@/lib/data";
import CustomSearchBar from "@/components/custom/admin-panel/customSearchBar";
import AddSponsorForm, { DeleteSPonsor } from "./AddSponsorsForm";
import EditForm from "./EditSponsorForm";
import CustomPagination from "@/components/custom/admin-panel/customPagination";

interface Sponsor {
  id: number;
  image_url: string;
  description: string;
}

const Sponser = async (props: {
  searchParams: Promise<Record<string, string>>;
}) => {
  const searchParams = await props.searchParams;
  const currentPage = searchParams["cPage"] ? Number(searchParams["cPage"]) : 1;
  const query = searchParams["q"] ? searchParams["q"] : "";

  const sponsors = await getSponsors({
    page: currentPage,
    query,
  });

  return (
    <ContentLayout title="Sponsor">
      <div className="flex flex-col gap-8">
        <div className="flex flex-row items-center justify-between">
          <h1 className="text-xl md:text-2xl">Sponsor data</h1>
          <AddSponsorForm />
        </div>

        <div className="space-y-2">
          <CustomSearchBar query={query} />
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6">
            {sponsors.sponsorWithProducts.map((item: Sponsor) => (
              <div
                key={item.id}
                className="h-70 flex flex-col rounded-lg border shadow-sm"
              >
                <img
                  className="h-[100%] object-fill"
                  src={item.image_url}
                  alt="profile-picture"
                />
                <p className="text-center">{item.description}</p>
                <div className="flex flex-col gap-2 p-2">
                  <DeleteSPonsor id={item.id} />
                  <EditForm
                    id={item.id}
                    imageUrl={item.image_url}
                    description={item.description}
                  />
                </div>
              </div>
            ))}
          </div>
          <CustomPagination
            currentPage={currentPage}
            totalLength={sponsors.totalCount}
          />
        </div>
      </div>
    </ContentLayout>
  );
};

export default Sponser;
