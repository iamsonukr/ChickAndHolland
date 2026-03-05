// "use client";

// import { API_URL } from "@/lib/constants";
// import { Search } from "lucide-react";
// import { useRouter } from "next/navigation";
// import { useState, useRef, useEffect } from "react";
// import { useForm } from "react-hook-form";

// const SearchBar = () => {
//   const addForm = useForm();
//   const [searchOpen, setSearchOpen] = useState<boolean>(false);
//   const [searchData, setSearchData] = useState([]);
//   const searchBarRef: any = useRef(null); // Reference to the search bar container
//   const router = useRouter();

//   const toggleSearchOpen = () => {
//     setSearchOpen((prev) => !prev);
//   };

//   const navigateToProduct = (productCode: number) => {
//     setSearchData([]);
//     setSearchOpen(false);
//     router.push(`/product/${productCode}`);
//   };

//   const searchDataFun = async (search: string) => {
//     try {
//       if (search.trim().length < 1) {
//         return setSearchData([]);
//       }

//       await fetch(API_URL + `products/searchStyleNo/?query=${search}`)
//         .then((res) => res.json())
//         .then((data) => {
//           setSearchData(data.products);
//         });
//     } catch (error) {
//       console.log(error);
//     }
//   };

//   // Effect to handle clicks outside the search bar
//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (
//         searchBarRef.current &&
//         !searchBarRef.current.contains(event.target as Node)
//       ) {
//         setSearchData([]);
//         setSearchOpen(false);
//         addForm.reset();
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, []);

//   return (
//     <div className="relative" ref={searchBarRef}>
//       <Search
//         className="cursor-pointer text-[#C9A39A] hover:text-white 2xl:text-4xl 3xl:text-6xl 4xl:text-9xl"
//         onClick={toggleSearchOpen}
//       />
//       <div className="absolute -left-[270px] top-[78px] z-10 md:-left-[300px] md:top-[40px]">
//         {searchOpen && (
//           <>
//             <input
//               className="focus:shadow-outline appearance-none rounded border border-red-500 px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none"
//               id="password"
//               type="text"
//               {...addForm.register("search", {
//                 onChange(event) {
//                   searchDataFun(event.target.value);
//                 },
//               })}
//               placeholder="Search"
//               autoComplete="off"
//               autoFocus
//               required
//               onBlur={() => {
//                 // No need to close here because it's handled by the outside click logic
//               }}
//               onFocus={() => setSearchData([])}
//             />
//             {searchData.length > 0 && (
//               <div className="h-[300px] overflow-y-scroll bg-white pb-2 pe-2 ps-2">
//                 {searchData.map((data: any, index) => {
//                   return (
//                     <div
//                       className="mb-3 border-b-black text-center text-xl"
//                       style={{
//                         cursor: "pointer",
//                         borderBottom: "1px solid black",
//                       }}
//                       onClick={() => navigateToProduct(data.productId)}
//                       key={index}
//                     >
//                       <p>{data.label}</p>
//                     </div>
//                   );
//                 })}
//               </div>
//             )}
//           </>
//         )}
//       </div>
//     </div>
//   );
// };

// export default SearchBar;


"use client";

import { API_URL } from "@/lib/constants";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";

const SearchBar = () => {
  const addForm = useForm();
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [searchData, setSearchData] = useState<any[]>([]);
  const searchBarRef: any = useRef(null); // Reference to the search bar container
  const router = useRouter();

  const toggleSearchOpen = () => {
    setSearchOpen((prev) => !prev);
  };

  const navigateToProduct = (productCode: number) => {
    setSearchData([]);
    setSearchOpen(false);
    addForm.reset();
    router.push(`/product/${productCode}`);
  };

  const searchDataFun = async (search: string) => {
    try {
      if (search.trim().length < 1) {
        return setSearchData([]);
      }

      await fetch(API_URL + `products/searchStyleNo/?query=${search}`)
        .then((res) => res.json())
        .then((data) => {
          setSearchData(data.products);
        });
    } catch (error) {
      console.log(error);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && searchData.length === 1) {
      navigateToProduct(searchData[0].productId);
    }
  };

  // Effect to handle clicks outside the search bar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchBarRef.current &&
        !searchBarRef.current.contains(event.target as Node)
      ) {
        setSearchData([]);
        setSearchOpen(false);
        addForm.reset();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={searchBarRef}>
      <Search
        className="cursor-pointer text-[#C9A39A] hover:text-white 2xl:text-4xl 3xl:text-6xl 4xl:text-9xl"
        onClick={toggleSearchOpen}
      />
      <div className="absolute -left-[270px] top-[78px] z-10 md:-left-[300px] md:top-[40px]">
        {searchOpen && (
          <>
            <input
              className="focus:shadow-outline appearance-none rounded border border-red-500 px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none"
              id="password"
              type="text"
              {...addForm.register("search", {
                onChange(event) {
                  searchDataFun(event.target.value);
                },
              })}
              placeholder="Search"
              autoComplete="off"
              autoFocus
              required
              onKeyDown={handleKeyDown}
              onBlur={() => {
                // No need to close here because it's handled by the outside click logic
              }}
              onFocus={() => setSearchData([])}
            />
            {searchData.length > 0 && (
              <div className="h-[300px] overflow-y-scroll bg-white pb-2 pe-2 ps-2">
                {searchData.map((data: any, index) => {
                  return (
                    <div
                      className="mb-3 border-b-black text-center text-xl"
                      style={{
                        cursor: "pointer",
                        borderBottom: "1px solid black",
                      }}
                      onClick={() => navigateToProduct(data.productId)}
                      key={index}
                    >
                      <p>{data.label}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchBar;