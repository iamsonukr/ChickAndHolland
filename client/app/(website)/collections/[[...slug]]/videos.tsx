const commonVideos: {
  url: string;
  year: string;
  subCategoryId?: string | number;
}[] = [
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/UHNM9370.mp4",
    year: "2024",
    subCategoryId: "67",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/BPTP2197.mp4",
    year: "2024",
    subCategoryId: "67",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/NWVV6494.mp4",
    year: "2024",
    subCategoryId: "67",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/VVAH9795.mp4",
    year: "2024",
    subCategoryId: "67",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/QEYH9741.mp4",
    year: "2024",
    subCategoryId: "67",
  },
  // couture videos
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/PNPL0514.mp4",
    year: "2024",
    subCategoryId: "65",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/LPUZ7971.mp4",
    year: "2024",
    subCategoryId: "65",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/HURK3747.mp4",
    year: "2024",
    subCategoryId: "65",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/HEIA0374.mp4",
    year: "2024",
    subCategoryId: "65",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/NZXY6929.mp4",
    year: "2024",
    subCategoryId: "65",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/SEKA2932.mp4",
    year: "2024",
    subCategoryId: "65",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/BPTP2197.mp4",
    year: "2024",
    subCategoryId: "65",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video2022five.mp4",
    year: "2022",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video2022one.mp4",
    year: "2022",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video2022two.mp4",
    year: "2022",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video2022three.mp4",
    year: "2022",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video2022four.mp4",
    year: "2022",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video2022six.mp4",
    year: "2022",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video2022seven.mp4",
    year: "2022",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video2022one.mp4",
    year: "2022",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video2022two.mp4",
    year: "2022",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video2022three.mp4",
    year: "2022",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video2022four.mp4",
    year: "2022",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video2022five.mp4",
    year: "2022",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video2022six.mp4",
    year: "2022",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video2022seven.mp4",
    year: "2022",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video2022one.mp4",
    year: "2022",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video2022two.mp4",
    year: "2022",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video2022three.mp4",
    year: "2022",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video2022four.mp4",
    year: "2022",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video2022five.mp4",
    year: "2022",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video2022six.mp4",
    year: "2022",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video2022seven.mp4",
    year: "2022",
  },
  // 2023
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video20231.mp4",
    year: "2023",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video20232.mp4",
    year: "2023",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video20233.mp4",
    year: "2023",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video20234.mp4",
    year: "2023",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video20235.mp4",
    year: "2023",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video20236.mp4",
    year: "2023",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video20237.mp4",
    year: "2023",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video20238.mp4",
    year: "2023",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video20239.mp4",
    year: "2023",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video202310.mp4",
    year: "2023",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video20231.mp4",
    year: "2023",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video20232.mp4",
    year: "2023",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video20233.mp4",
    year: "2023",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video20234.mp4",
    year: "2023",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video20235.mp4",
    year: "2023",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video20236.mp4",
    year: "2023",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video20237.mp4",
    year: "2023",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video20238.mp4",
    year: "2023",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video20239.mp4",
    year: "2023",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video202310.mp4",
    year: "2023",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video20231.mp4",
    year: "2023",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video20232.mp4",
    year: "2023",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video20233.mp4",
    year: "2023",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video20234.mp4",
    year: "2023",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video20235.mp4",
    year: "2023",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video20236.mp4",
    year: "2023",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video20237.mp4",
    year: "2023",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video20238.mp4",
    year: "2023",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video20239.mp4",
    year: "2023",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video202310.mp4",
    year: "2023",
  },
  // 2019
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/HF1189.mp4",
    year: "2019",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/HF1190.mp4",
    year: "2019",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/HF1193.mp4",
    year: "2019",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/HF1195.mp4",
    year: "2019",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/HF1200.mp4",
    year: "2019",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/HF1201.mp4",
    year: "2019",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/HF1202.mp4",
    year: "2019",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/HF1204.mp4",
    year: "2019",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/HF1206.mp4",
    year: "2019",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/HF1207.mp4",
    year: "2019",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/HF1208.mp4",
    year: "2019",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/HF1209.mp4",
    year: "2019",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/HF1210.mp4",
    year: "2019",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/HF1211.mp4",
    year: "2019",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/HF1212.mp4",
    year: "2019",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/HF1213.mp4",
    year: "2019",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/HF1214.mp4",
    year: "2019",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/HF1216.mp4",
    year: "2019",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/HF1218.mp4",
    year: "2019",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/HF1220.mp4",
    year: "2019",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/HF1212.mp4",
    year: "2019",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/HF1213.mp4",
    year: "2019",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/HF1214.mp4",
    year: "2019",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/HF1216.mp4",
    year: "2019",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/HF1218.mp4",
    year: "2019",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/HF1220.mp4",
    year: "2019",
  },
  // 2021
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video2022seven.mp4",
    year: "2021",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video2022one.mp4",
    year: "2021",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video2022two.mp4",
    year: "2021",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video2022three.mp4",
    year: "2021",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video2022four.mp4",
    year: "2021",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video2022five.mp4",
    year: "2021",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video2022six.mp4",
    year: "2021",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video2022one.mp4",
    year: "2021",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video2022two.mp4",
    year: "2021",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video2022three.mp4",
    year: "2021",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video2022four.mp4",
    year: "2021",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video2022five.mp4",
    year: "2021",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video2022six.mp4",
    year: "2021",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video2022seven.mp4",
    year: "2021",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video2022one.mp4",
    year: "2021",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video2022two.mp4",
    year: "2021",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video2022three.mp4",
    year: "2021",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video2022four.mp4",
    year: "2021",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video2022five.mp4",
    year: "2021",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video2022six.mp4",
    year: "2021",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video2022seven.mp4",
    year: "2021",
  },
  // 2020
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/HF1189.mp4",
    year: "2020",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/HF1190.mp4",
    year: "2020",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/HF1193.mp4",
    year: "2020",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/HF1195.mp4",
    year: "2020",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/HF1200.mp4",
    year: "2020",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/HF1201.mp4",
    year: "2020",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/HF1202.mp4",
    year: "2020",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/HF1204.mp4",
    year: "2020",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/HF1206.mp4",
    year: "2020",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/HF1207.mp4",
    year: "2020",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/HF1208.mp4",
    year: "2020",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/HF1209.mp4",
    year: "2020",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/HF1210.mp4",
    year: "2020",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/HF1211.mp4",
    year: "2020",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/HF1212.mp4",
    year: "2020",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/HF1213.mp4",
    year: "2020",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/HF1214.mp4",
    year: "2020",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/HF1216.mp4",
    year: "2020",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/HF1218.mp4",
    year: "2020",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/HF1220.mp4",
    year: "2020",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/HF1212.mp4",
    year: "2020",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/HF1213.mp4",
    year: "2020",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/HF1214.mp4",
    year: "2020",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/HF1216.mp4",
    year: "2020",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/HF1218.mp4",
    year: "2020",
  },
  {
    url: "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/HF1220.mp4",
    year: "2020",
  },
];

const eternalSunshine = [
  {
    group: 1,
    video:
      "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video20231.mp4",
    products: [
      {
        id: 241,
        productCode: "ZRH440004",
        imageName:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/a26a5c87-d7f7-466e-90c8-bd8e31cb33b8.jpg",
        imageName1: null,
      },
      {
        id: 156,
        productCode: "HF110141",
        imageName:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/8d321d29-3efb-4d4d-947a-07f3e187f67c.jpg",
        imageName1: null,
      },
      {
        id: 254,
        productCode: "ZRH440008",
        imageName:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/706eaa6a-81d9-493a-88bc-4dd35a33765b.jpg",
        imageName1: null,
      },
      {
        id: 181,
        productCode: "HF110202",
        imageName:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/95a6766a-43a5-4e04-b502-9ff012189fcf.jpg",
        imageName1: null,
      },
    ],
  },
  {
    group: 2,
    video:
      "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video202310.mp4",
    products: [
      {
        id: 175,
        productCode: "HF110165",
        imageName:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/eb379cd7-020b-4e33-96d5-aa416c257b0b.jpg",
        imageName1: null,
      },
      {
        id: 201,
        productCode: "HF110333",
        imageName:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/2546cc87-9e45-4df5-b375-d234e1ff2ea8.jpg",
        imageName1: null,
      },
      {
        id: 129,
        productCode: "HF110087",
        imageName:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/d2e67c15-42c9-4634-a10f-243349842566.jpg",
        imageName1: null,
      },
      {
        id: 146,
        productCode: "HF110127",
        imageName:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/54004b6c-9968-4d7b-ac53-c0b0a706830c.jpg",
        imageName1: null,
      },
    ],
  },
  {
    group: 3,
    video:
      "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video20232.mp4",
    products: [
      {
        id: 177,
        productCode: "HF110173",
        imageName:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/a091d7e9-d762-43d6-ab9e-25fe51f9eb97.jpg",
        imageName1: null,
      },
      {
        id: 151,
        productCode: "HF110131",
        imageName:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/75d11a16-2904-4b64-b17b-6e45cf6bbf2a.jpg",
        imageName1: null,
      },
      {
        id: 245,
        productCode: "ZRH440005",
        imageName:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/b004abcd-c569-4497-8fe0-c074e973afd9.jpg",
        imageName1:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/f8523288-285c-44df-a1e6-964410e5b8fe.jpg",
      },
      {
        id: 158,
        productCode: "HF110155",
        imageName:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/f4ea206f-c366-4317-812e-111b5f36d403.jpg",
        imageName1: null,
      },
    ],
  },
  {
    group: 4,
    video:
      "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video202311.mp4",
    products: [
      {
        id: 236,
        productCode: "ZAH220002",
        imageName:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/d82fa0dd-f827-4752-b9c4-be9a4386cff3.jpg",
        imageName1: null,
      },
      {
        id: 248,
        productCode: "ZRH440006",
        imageName:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/3c88e28f-2db6-4c5a-b12e-33de02227b60.jpg",
        imageName1: null,
      },
      {
        id: 160,
        productCode: "HF110158",
        imageName:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/15e4076c-370b-469a-a286-36f30112a93b.jpg",
        imageName1:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/b24050e7-2fff-45f9-b034-91c9cb29ebfe.jpg",
      },
      {
        id: 144,
        productCode: "HF110121",
        imageName:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/58a921b9-2097-4887-af19-df40729e97b7.jpg",
        imageName1: null,
      },
    ],
  },
  {
    group: 5,
    video:
      "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video202313.mp4",
    products: [
      {
        id: 135,
        productCode: "HF110099",
        imageName:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/da5a84b4-9709-4af7-855b-39706ab458e2.jpg",
        imageName1:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/c760bc11-71a8-4242-a128-5aef19452c91.jpg",
      },
      {
        id: 273,
        productCode: "ZRH440010G",
        imageName:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/13e5a84a-95c8-4428-94a7-406fe9c9b9e4.jpg",
        imageName1:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/7227157d-14c4-4b49-bf5c-80864bd3f502.jpg",
      },
      {
        id: 154,
        productCode: "HF110138",
        imageName:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/52091f82-48cb-4e12-8215-21ea0a532346.jpg",
        imageName1:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/8019e67c-6b2c-4100-be5b-ad9b0dff27e1.jpg",
      },
      {
        id: 179,
        productCode: "HF110186",
        imageName:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/076689a3-3e0e-4ea4-8f66-c6f2be818840.jpg",
        imageName1: null,
      },
    ],
  },
  {
    group: 6,
    video:
      "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/categoryVideos/2023chick/Video202312.mov",
    products: [
      {
        id: 96,
        productCode: "HF110074",
        imageName:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/eca7c88b-1781-48d6-a6dc-cdeec2984ec4.jpg",
        imageName1:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/413f8e00-9ef3-4a05-8e8f-01e49ec2f5fd.jpg",
      },
      {
        id: 182,
        productCode: "HF110204",
        imageName:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/a5a476f9-0da4-47ba-b072-c1c01eec0e21.jpg",
        imageName1:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/77fb9bb4-45f5-4e14-ae1f-f28cf5503b9d.jpg",
      },
      {
        id: 239,
        productCode: "ZRH440003",
        imageName:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/8c430345-1384-40f0-b3bf-ef87002c4123.jpg",
        imageName1:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/0b00cab7-7308-4911-ac20-dca252150609.jpg",
      },
      {
        id: 179,
        productCode: "HF110186",
        imageName:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/74e8ff6e-fa75-403c-b948-1aa41632aab5.jpg",
        imageName1:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/ef1acd72-4e0d-46ae-b74b-3c60bd55806e.jpg",
      },
    ],
  },
  {
    group: 7,
    video:
      "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video20238.mp4",
    products: [
      {
        id: 137,
        productCode: "HF110104",
        imageName:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/08bb4efd-0807-4d42-b6a4-1dd3a52dfeec.jpg",
        imageName1:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/847ccead-e859-4c05-9bd3-3a75f0952268.jpg",
      },
      {
        id: 172,
        productCode: "HF110161",
        imageName:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/00ba9b91-c6ce-4fe8-9a62-998a91a74cf5.jpg",
        imageName1:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/eaeb60b5-f4df-47ec-b574-342186465038.jpg",
      },
      {
        id: 220,
        productCode: "HF110224",
        imageName:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/f8e0742c-1dac-4cda-ac7e-34d2386f2797.jpg",
        imageName1:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/c15a5d8e-40ad-4247-875b-8943bec55103.jpg",
      },
      {
        id: 263,
        productCode: "ZRH440010",
        imageName:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/7ecdb9b7-cc47-4e7a-918a-88c732a849a6.jpg",
        imageName1:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/97803083-3842-4412-aa35-9dc1a39113f4.jpg",
      },
    ],
  },
];

const paparazzi = [
  {
    group: 1,
    video:
      "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video20234.mp4",
    products: [
      {
        id: 237,
        productCode: "AF3300134",
        imageName:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/59b94367-c682-43b8-9343-f5d475bec315.jpg",
        imageName1: null,
      },
      {
        id: 99,
        productCode: "AF330093",
        imageName:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/1116dd97-1c1f-4565-bfd3-b069f1de37f2.jpg",
        imageName1: null,
      },
      {
        id: 170,
        productCode: "AF330112",
        imageName:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/cf4cef04-d42b-47f7-a39d-6b4e136b2567.jpg",
        imageName1:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/9bf3c0a2-bce6-4e1c-8673-ed7cf992c54d.jpg",
      },
      {
        id: 81,
        productCode: "AF330091",
        imageName:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/fba420fb-9704-4beb-95e1-645f83a438ad.jpg",
        imageName1:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/2c7d2c91-6d50-45fc-9812-ba94c561b637.jpg",
      },
    ],
  },
  {
    group: 2,
    video:
      "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video20233.mp4",
    products: [
      {
        id: 274,
        productCode: "ZAP120021S",
        imageName:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/b4018700-4913-4de4-89c6-1afc2846275c.jpg",
        imageName1:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/e7275d1e-9265-4129-a226-1a9f37444f3a.jpg",
      },
      {
        id: 257,
        productCode: "ZAP120004",
        imageName:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/b012f67a-5a10-49b2-9412-9fa3aebeb1c8.jpg",
        imageName1:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/a7fd4140-7408-422c-acd4-fdc024160eda.jpg",
      },
      {
        id: 270,
        productCode: "ZAP120013",
        imageName:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/edcabe30-2f1e-4752-b167-e87b69fc2ae3.jpg",
        imageName1:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/8793e8b4-57c4-422b-b2d0-e65e5057dbfb.jpg",
      },
      {
        id: 256,
        productCode: "ZAP120002",
        imageName:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/e1ce9e32-222d-40ba-8965-579a144439a9.jpg",
        imageName1:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/35076f4f-27a4-45cd-9a7e-2ca439be7b61.jpg",
      },
    ],
  },
  {
    group: 3,
    video:
      "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video20235.mp4",
    products: [
      {
        id: 184,
        productCode: "AF330118",
        imageName:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/5366ac4e-7c87-42ad-b985-54d09abc170c.jpg",
        imageName1:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/7d333a52-c18b-4151-9229-24c5967a907c.jpg",
      },
      {
        id: 207,
        productCode: "AF330148",
        imageName:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/11581376-0470-42e2-9638-476bf3b48144.jpg",
        imageName1:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/63c63397-3466-45fa-b7ad-87b5ca8d83be.jpg",
      },
      {
        id: 163,
        productCode: "AF330103",
        imageName:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/c7bc1a35-0176-4f26-a509-583179698744.jpg",
        imageName1:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/743ae652-30a4-400a-9bca-1e54f3cc9cde.jpg",
      },
      {
        id: 286,
        productCode: "ZAP120030",
        imageName:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/0dc0d734-f0b0-493a-bfbf-624893d49c43.jpg",
        imageName1:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/6bf0e305-2699-4606-b36d-cff54165e25b.jpg",
      },
    ],
  },
  {
    group: 4,
    video:
      "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video202314.mp4",
    products: [
      {
        id: 208,
        productCode: "AF330150",
        imageName:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/d474c11f-cc5c-4eae-be70-db5404023ab0.jpg",
        imageName1:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/6c93b879-a05f-4e40-9f62-9dd4a702a835.jpg",
      },
      {
        id: 298,
        productCode: "ZRH440002",
        imageName:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/c426441f-6a85-460a-b79c-19cd0eb6caa6.jpg",
        imageName1:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/33a4eba0-fdb6-477e-b0ab-cceedfb57b28.jpg",
      },
      {
        id: 262,
        productCode: "ZAP120007",
        imageName:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/2c0ff1cd-2b5f-4563-b79f-e993ce6c60e0.jpg",
        imageName1:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/b3682ee3-79fb-408c-92a2-282e53060069.jpg",
      },
      {
        id: 183,
        productCode: "AF330116",
        imageName:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/0a1eb5e6-4d46-4bfd-8b78-86cbddeefc82.jpg",
        imageName1:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/7e7eb0cd-bd89-486c-9190-0b597414146c.jpg",
      },
    ],
  },
  {
    group: 5,
    video:
      "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video20237.mp4",
    products: [
      {
        id: 205,
        productCode: "AF330143",
        imageName:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/6a0a1b22-633b-494c-bf4f-b44cff4eaadc.jpg",
        imageName1:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/26882c0e-4bb0-486f-b6b3-4f0bc2012d14.jpg",
      },
      {
        id: 237,
        productCode: "AF3300134",
        imageName:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/59b94367-c682-43b8-9343-f5d475bec315.jpg",
        imageName1: null,
      },
      {
        id: 214,
        productCode: "AF330160",
        imageName:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/ad66de62-8415-4955-aa2b-c313a0882512.jpg",
        imageName1:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/1e518471-2000-4e20-87dd-01b85a585ac7.jpg",
      },
      {
        id: 211,
        productCode: "AF330157",
        imageName:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/64904f55-453f-489c-b2d7-3d7ef3018a6c.jpg",
        imageName1:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/e1543bdd-94f1-449b-9ffb-0f5b81adb7d9.jpg",
      },
    ],
  },
  {
    group: 6,
    video:
      "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/optimized-videos/Video20236.mp4",
    products: [
      {
        id: 227,
        productCode: "AF330182",
        imageName:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/a852f64f-9df8-439f-be8f-bec4865f618d.jpg",
        imageName1:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/cee3f9ea-764f-4623-8cca-ba81eb6969e5.jpg",
      },
      {
        id: 252,
        productCode: "QI2A5843",
        imageName:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/3dadf3b1-b245-416f-bd37-db64d30986fb.jpg",
        imageName1:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/af478d68-d5a0-4305-9398-97f93da3eba3.jpg",
      },
      {
        id: 166,
        productCode: "AF330107",
        imageName:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/c657e6c3-9eed-41a6-9fb5-95d46853efd3.jpg",
        imageName1:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/c761a354-e3f0-42ee-9c65-ea3d0b6ce8c6.jpg",
      },
      {
        id: 269,
        productCode: "ZAP120012",
        imageName:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/a4f12972-ac6d-47a3-805c-ef247aad274c.jpg",
        imageName1:
          "https://ymts.blr1.cdn.digitaloceanspaces.com/chicandholland/products/92aefdfe-e738-4f16-83d1-95750d443cd7.jpg",
      },
    ],
  },
];

export { eternalSunshine, paparazzi, commonVideos as videos };
