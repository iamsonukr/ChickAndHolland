// app/admin/bank-details/page.tsx
import { ContentLayout } from "@/components/custom/admin-panel/contentLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import { AlertCircle, Building, Plus } from "lucide-react";
import { Active, BankDetailsForm, DeActive, DeleteBank } from "./Data";
import { getAdminBankDetails } from "@/lib/data";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Item } from "@radix-ui/react-navigation-menu";
// Mock data - in real app, this would come from a database

interface BankDetail {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  ifscCode: string;
}

export default async function page() {
  const banks = await getAdminBankDetails();

  return (
    <ContentLayout title="Bank Details">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight">Bank Account</h2>
          </div>

          <BankDetailsForm isEdit={false} />
        </div>

        {/* Bank Details Card */}
        <div className="grid gap-4 md:grid-cols-2">
          {!banks.data ? (
            <Alert variant="default" className="col-span-full bg-gray-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-muted-foreground">
                No bank details added yet. Please add your bank account
                information.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {banks.data.map((item: any) => {
                return (
                  <Card key={item.id} className="shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <Building className="h-5 w-5 text-primary" />
                        {item.bankName}
                        {item.isActive == 1 && (
                          <p className="h-6 w-6 rounded-full bg-green-500"></p>
                        )}
                      </CardTitle>
                    </CardHeader>

                    <CardContent>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 items-center gap-2">
                          <span className="font-medium text-gray-500">
                            Account Holder:
                          </span>
                          <span className="font-semibold">
                            {item.accountHolder}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 items-center gap-2">
                          <span className="font-medium text-gray-500">
                            Account Number:
                          </span>
                          <span className="font-semibold">
                            {item.accountNumber}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 items-center gap-2">
                          <span className="font-medium text-gray-500">
                            Swift Code:
                          </span>
                          <span className="font-semibold">{item.ifscCode}</span>
                        </div>
                        {item.swiftCode && (
  <div className="grid grid-cols-2 items-center gap-2">
    <span className="font-medium text-gray-500">IFSC Code:</span>
    <span className="font-semibold">{item.swiftCode}</span>
  </div>
)}

                        <div className="grid grid-cols-2 items-center gap-2">
                          <span className="font-medium text-gray-500">
                            Address:
                          </span>
                          <span className="font-semibold">{item.address}</span>
                        </div>
                      </div>
                    </CardContent>

                    <CardFooter className="border-t pt-4">
                      <div className="flex w-full justify-between">
                        <BankDetailsForm bank={item} isEdit={true} />
                        {item.isActive == 0 ? (
                          <Active id={item.id} />
                        ) : (
                          <DeActive id={item.id} />
                        )}
                        <DeleteBank id={item.id} />
                      </div>
                    </CardFooter>
                  </Card>
                );
              })}
            </>
          )}
        </div>
      </div>
    </ContentLayout>
  );
}

// app/admin/bank-details/page.tsx
// import { ContentLayout } from "@/components/custom/admin-panel/contentLayout";
// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardFooter,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { AlertCircle, Building, Plus } from "lucide-react";
// import { Active, BankDetailsForm, DeActive, DeleteBank } from "./Data";
// import { getAdminBankDetails } from "@/lib/data";

// import { Alert, AlertDescription } from "@/components/ui/alert";
// import { Item } from "@radix-ui/react-navigation-menu";

// interface BankDetail {
//   id: string;
//   bankName: string;
//   accountNumber: string;
//   accountHolder: string;
//   ifscCode: string;
// }

// export default async function page() {
//   const banks = await getAdminBankDetails();

//   return (
//     <ContentLayout title="Bank Details">
//       <div className="space-y-6">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-2">
//             <Building className="h-6 w-6 text-primary" />
//             <h2 className="text-2xl font-bold tracking-tight">Bank Account</h2>
//           </div>

//           <BankDetailsForm isEdit={false} />
//         </div>

//         {/* Bank Details Card */}
//         <div className="grid gap-4 md:grid-cols-2">
//           {!banks.data ? (
//             <Alert variant="default" className="col-span-full bg-gray-50">
//               <AlertCircle className="h-4 w-4" />
//               <AlertDescription className="text-muted-foreground">
//                 No bank details added yet. Please add your bank account
//                 information.
//               </AlertDescription>
//             </Alert>
//           ) : (
//             <>
//               {banks.data.map((item: any) => {
//                 return (
//                   <Card key={item.id} className="shadow-sm">
//                     <CardHeader className="pb-2">
//                       <CardTitle className="flex items-center gap-2 text-xl">
//                         <Building className="h-5 w-5 text-primary" />
//                         {item.bankName}
//                         {item.isActive == 1 && (
//                           <p className="h-6 w-6 rounded-full bg-green-500"></p>
//                         )}
//                       </CardTitle>
//                     </CardHeader>

//                     <CardContent>
//                       <div className="space-y-3">
//                         <div className="grid grid-cols-2 items-center gap-2">
//                           <span className="font-medium text-gray-500">
//                             Account Holder:
//                           </span>
//                           <span className="font-semibold">
//                             {item.accountHolder}
//                           </span>
//                         </div>

//                         <div className="grid grid-cols-2 items-center gap-2">
//                           <span className="font-medium text-gray-500">
//                             Account Number:
//                           </span>
//                           <span className="font-semibold">
//                             {item.accountNumber}
//                           </span>
//                         </div>

//                         <div className="grid grid-cols-2 items-center gap-2">
//                           <span className="font-medium text-gray-500">
//                             Swift Code:
//                           </span>
//                           <span className="font-semibold">{item.ifscCode}</span>
//                         </div>

//                         <div className="grid grid-cols-2 items-center gap-2">
//                           <span className="font-medium text-gray-500">
//                             Address:
//                           </span>
//                           <span className="font-semibold">{item.address}</span>
//                         </div>

//                         {/* ⭐ Currency Display Added Here */}
//                         <div className="grid grid-cols-2 items-center gap-2">
//                           <span className="font-medium text-gray-500">
//                             Currency:
//                           </span>
//                           <span className="font-semibold">
//                             {item.currency
//                               ? `${item.currency.code} `
//                               : "N/A"}
//                           </span>
//                           {/* (${item.currency.symbol}) */}
//                         </div>
//                       </div>
//                     </CardContent>

//                     <CardFooter className="border-t pt-4">
//                       <div className="flex w-full justify-between">
//                         <BankDetailsForm bank={item} isEdit={true} />
//                         {item.isActive == 0 ? (
//                           <Active id={item.id} />
//                         ) : (
//                           <DeActive id={item.id} />
//                         )}
//                         <DeleteBank id={item.id} />
//                       </div>
//                     </CardFooter>
//                   </Card>
//                 );
//               })}
//             </>
//           )}
//         </div>
//       </div>
//     </ContentLayout>
//   );
// }

// // app/admin/bank-details/page.tsx
// import { ContentLayout } from "@/components/custom/admin-panel/contentLayout";
// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardFooter,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { AlertCircle, Building, Plus } from "lucide-react";
// import { Active, BankDetailsForm, DeActive, DeleteBank } from "./Data";
// import { getAdminBankDetails } from "@/lib/data";
// import { Alert, AlertDescription } from "@/components/ui/alert";

// interface BankDetail {
//   id: string;
//   bankName: string;
//   accountNumber: string;
//   accountHolder: string;
//   ifscCode: string;
// }

// export default async function page() {
//   const banks = await getAdminBankDetails();

//   return (
//     <ContentLayout
//       title={
//         <span className="text-3xl font-bold text-white mb-3 font-serif tracking-wide">
//           Bank Account Management
//         </span>
//       }
//     >
//       {/* Luxury Background with Animated Gradient */}
//       <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-rose-50/20 dark:from-slate-950 dark:via-amber-950/20 dark:to-rose-950/10 relative overflow-hidden">
//         {/* Animated Background Elements */}
//         <div className="absolute inset-0 overflow-hidden">
//           <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-amber-200/40 to-rose-300/30 rounded-full blur-3xl animate-pulse"></div>
//           <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-rose-200/30 to-amber-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
//           <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-amber-100/20 to-rose-100/10 rounded-full blur-3xl animate-pulse delay-500"></div>
//         </div>

//         <div className="relative z-10 p-4 md:p-6">
//           <div className="max-w-7xl mx-auto">
            
//          {/* Luxury Header Section */}
// <div className="mb-6">
//   <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-slate-200/50 dark:border-slate-700/50 relative overflow-hidden">

//     <div className="absolute top-0 left-0 right-0 h-1  "></div>

//     <div className="flex flex-col md:flex-row md:items-center justify-between">
//       <div className="mb-4 md:mb-0">
//         <div className="flex items-center gap-2 mb-2">
//           <div className="relative">
//             <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-rose-500 rounded-lg blur-md"></div>
//             <div className="relative w-9 h-9 bg-gradient-to-r from-black via-gray-900 to-yellow-600 rounded-lg flex items-center justify-center shadow-lg border border-yellow-500/30 backdrop-blur-sm">
//               <Building className="h-4 w-4 text-white" />
//             </div>
//           </div>

//           <h2 className="text-xl font-bold text-slate-800 dark:text-white font-serif tracking-wide">
//             Bank Accounts
//           </h2>
//         </div>

//         <p className="text-slate-600 dark:text-slate-400 text-sm font-light">
//           TOTAL <span className="font-semibold text-amber-600 dark:text-amber-400">{banks.data?.length || 0}</span> ACCOUNTS
//         </p>
//       </div>

//       {/* Add Bank Button */}
//       <div className="flex items-center gap-2">
//         <BankDetailsForm isEdit={false}>
//           <div className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 text-white rounded-xl font-semibold text-xs transition-all duration-500 backdrop-blur-md border border-transparent hover:shadow-xl hover:scale-105 flex items-center gap-1.5">
//             <Plus className="h-3.5 w-3.5" />
//             Add Account
//           </div>
//         </BankDetailsForm>
//       </div>
//     </div>
//   </div>
// </div>


//            {/* Bank Details Cards Grid */}
// <div className="grid gap-4 md:grid-cols-2">
//   {!banks.data ? (
//     <div className="col-span-full">
//       <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-xl p-8 text-center border border-slate-200/50 dark:border-slate-700/50 relative overflow-hidden">

//         <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-rose-500 to-purple-600"></div>

//         <div className="relative inline-block mb-6">
//           <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-2xl blur-md"></div>
//           <div className="relative w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-600 dark:to-slate-700 rounded-2xl flex items-center justify-center border border-slate-300/50 dark:border-slate-600/50">
//             <AlertCircle className="h-8 w-8 text-slate-400 dark:text-slate-500" />
//           </div>
//         </div>

//         <h3 className="text-lg font-bold text-slate-600 dark:text-slate-400 mb-2 font-serif">
//           No Bank Accounts
//         </h3>

//         <p className="text-slate-500 dark:text-slate-500 max-w-md mx-auto text-sm leading-relaxed">
//           No bank details added yet. Please add your bank account information to get started.
//         </p>
//       </div>
//     </div>
//   ) : (
//     <>
//       {banks.data.map((item: any, index: number) => (
//         <div 
//           key={item.id}
//           className="group animate-in fade-in slide-in-from-bottom-8"
//           style={{ animationDelay: `${index * 100}ms` }}
//         >
//           <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden border border-slate-200/50 dark:border-slate-700/50 relative transition-all duration-500 hover:shadow-2xl hover:scale-105">

//             <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-rose-500 to-purple-600"></div>

//             {item.isActive == 1 && (
//               <div className="absolute top-3 right-3 z-10">
//                 <div className="relative">
//                   <div className="absolute inset-0 bg-green-500 rounded-full blur-sm animate-pulse"></div>
//                   <div className="relative w-4 h-4 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full border border-white dark:border-slate-800 shadow-lg"></div>
//                 </div>
//               </div>
//             )}

//             <CardHeader className="pb-2 relative">
//               <div className="absolute inset-0 bg-gradient-to-r from-black via-gray-900 to-yellow-600 border border-yellow-500/50 backdrop-blur-sm"></div>
//               <div className="relative p-4">
//                 <CardTitle className="flex items-center gap-2 text-lg text-white font-serif">
//                   <div className="relative">
//                     <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-rose-500 rounded-md blur-md"></div>
//                     <div className="relative w-8 h-8 bg-gradient-to-r from-amber-500 to-rose-600 rounded-md flex items-center justify-center">
//                       <Building className="h-4 w-4 text-white" />
//                     </div>
//                   </div>
//                   {item.bankName}
//                 </CardTitle>
//               </div>
//             </CardHeader>

//             <CardContent className="p-4">
//               <div className="space-y-3">

//                 <div className="flex items-center justify-between p-3 rounded-xl border bg-slate-50 dark:bg-slate-800/50">
//                   <span className="font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wide">
//                     Account Holder:
//                   </span>
//                   <span className="font-bold text-slate-800 dark:text-white text-sm">
//                     {item.accountHolder}
//                   </span>
//                 </div>

//                 <div className="flex items-center justify-between p-3 rounded-xl border bg-amber-50 dark:bg-amber-900/20">
//                   <span className="font-semibold text-amber-600 dark:text-amber-400 text-xs uppercase tracking-wide">
//                     Account Number:
//                   </span>
//                   <span className="font-bold text-slate-800 dark:text-white text-sm font-mono">
//                     {item.accountNumber}
//                   </span>
//                 </div>

//                 <div className="flex items-center justify-between p-3 rounded-xl border bg-rose-50 dark:bg-rose-900/20">
//                   <span className="font-semibold text-rose-600 dark:text-rose-400 text-xs uppercase tracking-wide">
//                     IFSC Code:
//                   </span>
//                   <span className="font-bold text-slate-800 dark:text-white text-sm font-mono">
//                     {item.ifscCode}
//                   </span>
//                 </div>

//                 <div className="flex items-center justify-between p-3 rounded-xl border bg-emerald-50 dark:bg-emerald-900/20">
//                   <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-xs uppercase tracking-wide">
//                     Bank Address:
//                   </span>
//                   <span className="font-bold text-slate-800 dark:text-white text-xs text-right max-w-[130px] truncate">
//                     {item.address || "N/A"}
//                   </span>
//                 </div>

//                 <div className="flex items-center justify-between p-3 rounded-xl border bg-purple-50 dark:bg-purple-900/20">
//                   <span className="font-semibold text-purple-600 dark:text-purple-400 text-xs uppercase tracking-wide">
//                     Currency:
//                   </span>
//                   <span className="font-bold text-slate-800 dark:text-white text-sm">
//                     {item.currency ? `${item.currency.code}` : "N/A"}
//                   </span>
//                 </div>

//               </div>
//             </CardContent>

//             <CardFooter className="border-t border-slate-200 dark:border-slate-700 pt-4 px-4 pb-4">
//               <div className="flex w-full justify-between items-center">
//                 <div className="flex items-center gap-2">

//                   <BankDetailsForm bank={item} isEdit={true}>
//                     <div className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold transition-all hover:shadow-md hover:scale-105">
//                       Edit
//                     </div>
//                   </BankDetailsForm>

//                   {item.isActive == 0 ? (
//                     <Active id={item.id}>
//                       <div className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold transition-all hover:shadow-md hover:scale-105">
//                         Activate
//                       </div>
//                     </Active>
//                   ) : (
//                     <DeActive id={item.id}>
//                       <div className="px-4 py-2 bg-orange-600 text-white rounded-lg text-xs font-semibold transition-all hover:shadow-md hover:scale-105">
//                         Deactivate
//                       </div>
//                     </DeActive>
//                   )}

//                 </div>

//                 <DeleteBank id={item.id}>
//                   <div className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold transition-all hover:shadow-md hover:scale-105">
//                     Delete
//                   </div>
//                 </DeleteBank>

//               </div>
//             </CardFooter>
//           </div>
//         </div>
//       ))}
//     </>
//   )}
// </div>


//             {/* Luxury Footer
//             <div className="mt-12 text-center">
//               <div className="inline-flex items-center space-x-2 text-slate-500 dark:text-slate-400 text-sm">
//                 <span>✨</span>
//                 <span>Secure Banking Management System</span>
//                 <span>✨</span>
//               </div>
//             </div> */}
//           </div>
//         </div>
//       </div>
//     </ContentLayout>
//   );
// }