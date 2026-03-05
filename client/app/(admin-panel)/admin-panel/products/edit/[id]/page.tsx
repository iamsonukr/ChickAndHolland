// import { API_URL } from "@/lib/constants";
// import EditProductForm from "../../EditProductForm";

// async function getData(id: string) {
//   const [productRes, categoriesRes, subCategoriesRes, currenciesRes] =
//     await Promise.all([
//       fetch(`${API_URL}/products/${id}`, { cache: "no-cache" }),
//       fetch(`${API_URL}/category`, { cache: "no-cache" }),
//       fetch(`${API_URL}/subcategory`, { cache: "no-cache" }),
//       fetch(`${API_URL}/currencies`, { cache: "no-cache" }),
//     ]);

//   const product = await productRes.json();
//   const categories = await categoriesRes.json();
//   const subCategories = await subCategoriesRes.json();
//   const currencies = await currenciesRes.json();

//   return { product, categories, subCategories, currencies };
// }

// export default async function EditProductPage({
//   params,
// }: {
//   params: { id: string };
// }) {
//   const { product, categories, subCategories, currencies } = await getData(
//     params.id
//   );

//   return (
//     <div className="p-6">
//       <EditProductForm
//         categories={categories || []}
//         subCategories={subCategories || []}
//         currencies={currencies?.data || []} // IMPORTANT FIX
//         data={product}
//       />
//     </div>
//   );
// }
