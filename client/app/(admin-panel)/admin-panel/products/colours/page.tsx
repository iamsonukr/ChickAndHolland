import { ContentLayout } from "@/components/custom/admin-panel/contentLayout";
import { getProductCategories, getProductColours } from "@/lib/data";
import AddProductColour from "./AddProductColour";
import DeleteProductColour from "@/app/(admin-panel)/admin-panel/products/colours/DeleteProductColour";

const Colours = async (
  props: {
    searchParams: Promise<Record<string, string>>;
  }
) => {
  const searchParams = await props.searchParams;
  const currentPage = searchParams["cPage"] ? Number(searchParams["cPage"]) : 1;
  const query = searchParams["q"] ? searchParams["q"] : "";

  const colors = await getProductColours({});

  return (
    <ContentLayout title="Colours">
      <div className="flex flex-col gap-8">
        <div className="flex flex-row items-center justify-between">
          <h1 className="text-xl md:text-2xl">Product Colours</h1>

          <AddProductColour />
        </div>

        <div className={"space-y-2"}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {colors.productColours?.map((color: any, index: number) => {
              return (
                <div key={index}
                     className="flex flex-col items-center justify-center p-4 cursor-pointer hover:shadow-md rounded-md transition-all border relative">
                  <div className="w-20 h-20 rounded-full"
                       style={{
                         backgroundColor: color.hexcode,
                         border: "1px solid #dcdcdc",
                         boxShadow: "0 0 3px rgba(0, 0, 0, 0.1)"
                       }}></div>
                  <p className="text-center mt-2">{color.name}</p>

                  <div className={'absolute top-2 right-2'}>
                    <DeleteProductColour colourId={color.id} />
                  </div>
                </div>
              );
            })}

          </div>
        </div>
      </div>
    </ContentLayout>
  );
};

export default Colours;

