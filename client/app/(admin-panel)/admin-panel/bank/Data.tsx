// // components/admin/bank-details-form.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import useHttp from "@/lib/hooks/usePost";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { getCurrencies } from "@/lib/data";

const formSchema = z.object({
  bankName: z.string().min(2),
  accountNumber: z.string().min(8),
  accountHolder: z.string().min(2),
  ifscCode: z.string().min(4),
    swiftCode: z.string().optional().or(z.literal("")),   // <-- ADD THIS

  address: z.string().min(5),
  currencyId: z.string().min(1, "Please select a currency"),
});

export const BankDetailsForm = ({
  bank,
  isEdit,
}: {
  bank?: any;
  isEdit: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bankName: "",
      accountNumber: "",
      accountHolder: "",
      ifscCode: "",
        swiftCode: "",   // <-- ADD THIS

      address: "",
      currencyId: "",
    },
  });

  const {
    executeAsync: addBank,
  } = useHttp(`/admin-bank`, "POST");

  const {
    executeAsync: editBank,
  } = useHttp(`/admin-bank/${bank?.id}`, "PATCH");

  const handleSubmit = async (values: any) => {
    values.currencyId = Number(values.currencyId);

    try {
      if (isEdit) {
        await editBank(values);
        toast.success("Bank Details updated");
      } else {
        await addBank(values);
        toast.success("Bank Details Added");
      }
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  useEffect(() => {
    getCurrencies().then((res: any) => {
      setCurrencies(res.data || res);
    });
  }, []);

  const dataFill = () => {
    form.setValue("accountHolder", bank.accountHolder);
    form.setValue("accountNumber", bank.accountNumber);
    form.setValue("bankName", bank.bankName);
    form.setValue("ifscCode", bank.ifscCode);
    form.setValue("swiftCode", bank.swiftCode || "");

    form.setValue("address", bank.address);
    form.setValue("currencyId", String(bank.currencyId || ""));
  };

  useEffect(() => {
    if (isEdit && bank) {
      dataFill();
    } else {
      form.reset();
    }
  }, [isEdit, bank, open]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          {isEdit ? (
            <>
              <Edit /> Edit Bank Details
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" /> Add Bank Details
            </>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            {bank ? "Edit Bank Details" : "Add Bank Details"}
          </SheetTitle>
        </SheetHeader>
        <div className="py-4">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="bankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter bank name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accountHolder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Holder</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter account holder name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter account number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ifscCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Swift Code</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter Swift code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
  control={form.control}
  name="swiftCode"
  render={({ field }) => (
    <FormItem>
      <FormLabel>IFSC Code (Optional)</FormLabel>
      <FormControl>
        <Input placeholder="Enter Swift Code" {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>


              {/* ⭐ Currency Field Added Here */}
              <FormField
                control={form.control}
                name="currencyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="border rounded-md p-2 w-full bg-background"
                      >
                        <option value="">Select Currency</option>
                        {currencies.map((cur: any) => (
                          <option key={cur.id} value={cur.id}>
                            {cur.currencyCode} ({cur.symbol})
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank Address</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter bank address"
                        {...field}
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full">
                {bank ? "Update" : "Add"} Bank Details
              </Button>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// below code untouched ✔️

export const Active = ({ id }: { id: any }) => {
  const { executeAsync } = useHttp(`/admin-bank/active/${id}`, "PATCH");
  const router = useRouter();
  return (
    <Button
      variant={"default"}
      onClick={() => {
        executeAsync();
        router.refresh();
      }}
    >
      Make Active
    </Button>
  );
};

export const DeActive = ({ id }: { id: any }) => {
  const { executeAsync } = useHttp(`/admin-bank/deactive/${id}`, "PATCH");
  const router = useRouter();
  return (
    <Button
      variant={"destructive"}
      onClick={() => {
        executeAsync();
        router.refresh();
      }}
    >
      Deactivate
    </Button>
  );
};

export const DeleteBank = ({ id }: { id: any }) => {
  const { executeAsync } = useHttp(`/admin-bank/delete/${id}`, "DELETE");
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const submit = () => {
    executeAsync();
    router.refresh();
    setOpen(false);
    toast.success("Bank Deleted ");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">Delete</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Bank</DialogTitle>
          <DialogDescription>Are you sure you want delete</DialogDescription>
        </DialogHeader>
        <Button
          variant={"destructive"}
          onClick={submit}
        >
          Delete
        </Button>
      </DialogContent>
    </Dialog>
  );
};

// components/admin/bank-details-form.tsx
// "use client";

// import { Button } from "@/components/ui/button";
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/components/ui/form";
// import { Input } from "@/components/ui/input";
// import {
//   Sheet,
//   SheetContent,
//   SheetHeader,
//   SheetTitle,
//   SheetTrigger,
// } from "@/components/ui/sheet";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import { Textarea } from "@/components/ui/textarea";
// import useHttp from "@/lib/hooks/usePost";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { Edit, Plus, Building } from "lucide-react";
// import { useRouter } from "next/navigation";
// import { useEffect, useState } from "react";
// import { useForm } from "react-hook-form";
// import { toast } from "sonner";
// import * as z from "zod";
// import { getCurrencies } from "@/lib/data";

// const formSchema = z.object({
//   bankName: z.string().min(2),
//   accountNumber: z.string().min(8),
//   accountHolder: z.string().min(2),
//   ifscCode: z.string().min(4),
//   address: z.string().min(5),
//   currencyId: z.string().min(1, "Please select a currency"),
// });

// export const BankDetailsForm = ({
//   bank,
//   isEdit,
//   children,
// }: {
//   bank?: any;
//   isEdit: boolean;
//   children?: React.ReactNode;
// }) => {
//   const [open, setOpen] = useState(false);
//   const [currencies, setCurrencies] = useState<any[]>([]);
//   const router = useRouter();

//   const form = useForm<z.infer<typeof formSchema>>({
//     resolver: zodResolver(formSchema),
//     defaultValues: {
//       bankName: "",
//       accountNumber: "",
//       accountHolder: "",
//       ifscCode: "",
//       address: "",
//       currencyId: "",
//     },
//   });

//   const {
//     executeAsync: addBank,
//   } = useHttp(`/admin-bank`, "POST");

//   const {
//     executeAsync: editBank,
//   } = useHttp(`/admin-bank/${bank?.id}`, "PATCH");

//   const handleSubmit = async (values: any) => {
//     values.currencyId = Number(values.currencyId);

//     try {
//       if (isEdit) {
//         await editBank(values);
//         toast.success("Bank Details updated successfully");
//       } else {
//         await addBank(values);
//         toast.success("Bank Details added successfully");
//       }
//       setOpen(false);
//       router.refresh();
//     } catch (error) {
//       toast.error("Something went wrong");
//     }
//   };

//   useEffect(() => {
//     getCurrencies().then((res: any) => {
//       setCurrencies(res.data || res);
//     });
//   }, []);

//   const dataFill = () => {
//     form.setValue("accountHolder", bank.accountHolder);
//     form.setValue("accountNumber", bank.accountNumber);
//     form.setValue("bankName", bank.bankName);
//     form.setValue("ifscCode", bank.ifscCode);
//     form.setValue("address", bank.address);
//     form.setValue("currencyId", String(bank.currencyId || ""));
//   };

//   useEffect(() => {
//     if (isEdit && bank) {
//       dataFill();
//     } else {
//       form.reset();
//     }
//   }, [isEdit, bank, open]);

//   return (
//     <Sheet open={open} onOpenChange={setOpen}>
//       <SheetTrigger asChild>
//         {children || (
//           <div className="px-6 py-3 bg-gradient-to-r from-black via-gray-900 to-yellow-600 text-white rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105 text-sm cursor-pointer flex items-center gap-2 border border-yellow-500/30 backdrop-blur-sm">
//             {isEdit ? (
//               <>
//                 <Edit className="h-4 w-4" />
//                 Edit
//               </>
//             ) : (
//               <>
//                 <Plus className="h-4 w-4" />
//                 Add Bank Details
//               </>
//             )}
//           </div>
//         )}
//       </SheetTrigger>
//       <SheetContent className="bg-gradient-to-br from-gray-900 via-black to-yellow-900/20 backdrop-blur-xl border-l border-yellow-500/30">
//         {/* Animated Background Elements */}
//         <div className="absolute inset-0 overflow-hidden -z-10">
//           <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-yellow-600/20 to-gray-800 rounded-full blur-2xl"></div>
//           <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-tr from-gray-700 to-yellow-700/10 rounded-full blur-2xl"></div>
//         </div>
        
//         <SheetHeader className="relative">
//           <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-600 via-gray-800 to-black"></div>
//           <div className="flex items-center gap-3 mt-6">
//             <div className="relative">
//               <div className="absolute inset-0 bg-gradient-to-br from-yellow-600 to-gray-800 rounded-lg blur-md"></div>
//               <div className="relative w-10 h-10 bg-gradient-to-r from-black via-gray-900 to-yellow-600 rounded-lg flex items-center justify-center border border-yellow-500/30">
//                 <Building className="h-5 w-5 text-white" />
//               </div>
//             </div>
//             <SheetTitle className="text-2xl font-bold text-white font-serif tracking-wide">
//               {bank ? "Edit Bank Details" : "Add Bank Details"}
//             </SheetTitle>
//           </div>
//         </SheetHeader>
        
//         <div className="py-6 h-full overflow-y-auto">
//           <Form {...form}>
//             <form
//               onSubmit={form.handleSubmit(handleSubmit)}
//               className="space-y-6"
//             >
//               <FormField
//                 control={form.control}
//                 name="bankName"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel className="text-gray-300 font-semibold">Bank Name</FormLabel>
//                     <FormControl>
//                       <Input 
//                         placeholder="Enter bank name" 
//                         {...field} 
//                         className="bg-gray-800/80 backdrop-blur-md border-gray-600/50 rounded-xl py-6 px-4 text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-500/50 transition-all duration-300 border"
//                       />
//                     </FormControl>
//                     <FormMessage className="text-red-400" />
//                   </FormItem>
//                 )}
//               />

//               <FormField
//                 control={form.control}
//                 name="accountHolder"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel className="text-gray-300 font-semibold">Account Holder</FormLabel>
//                     <FormControl>
//                       <Input
//                         placeholder="Enter account holder name"
//                         {...field}
//                         className="bg-gray-800/80 backdrop-blur-md border-gray-600/50 rounded-xl py-6 px-4 text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-500/50 transition-all duration-300 border"
//                       />
//                     </FormControl>
//                     <FormMessage className="text-red-400" />
//                   </FormItem>
//                 )}
//               />

//               <FormField
//                 control={form.control}
//                 name="accountNumber"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel className="text-gray-300 font-semibold">Account Number</FormLabel>
//                     <FormControl>
//                       <Input 
//                         placeholder="Enter account number" 
//                         {...field}
//                         className="bg-gray-800/80 backdrop-blur-md border-gray-600/50 rounded-xl py-6 px-4 text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-500/50 transition-all duration-300 border font-mono"
//                       />
//                     </FormControl>
//                     <FormMessage className="text-red-400" />
//                   </FormItem>
//                 )}
//               />

//               <FormField
//                 control={form.control}
//                 name="ifscCode"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel className="text-gray-300 font-semibold">Swift Code</FormLabel>
//                     <FormControl>
//                       <Input 
//                         placeholder="Enter Swift code" 
//                         {...field}
//                         className="bg-gray-800/80 backdrop-blur-md border-gray-600/50 rounded-xl py-6 px-4 text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-500/50 transition-all duration-300 border font-mono"
//                       />
//                     </FormControl>
//                     <FormMessage className="text-red-400" />
//                   </FormItem>
//                 )}
//               />

//               {/* ⭐ Currency Field */}
//               <FormField
//                 control={form.control}
//                 name="currencyId"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel className="text-gray-300 font-semibold">Currency</FormLabel>
//                     <FormControl>
//                       <select
//                         {...field}
//                         className="w-full bg-gray-800/80 backdrop-blur-md border border-gray-600/50 rounded-xl py-5 px-4 text-white focus:ring-2 focus:ring-yellow-500/50 transition-all duration-300"
//                       >
//                         <option value="" className="text-gray-400">Select Currency</option>
//                         {currencies.map((cur: any) => (
//                           <option key={cur.id} value={cur.id} className="text-white bg-gray-800">
//                             {cur.currencyCode} ({cur.symbol})
//                           </option>
//                         ))}
//                       </select>
//                     </FormControl>
//                     <FormMessage className="text-red-400" />
//                   </FormItem>
//                 )}
//               />

//               <FormField
//                 control={form.control}
//                 name="address"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel className="text-gray-300 font-semibold">Bank Address</FormLabel>
//                     <FormControl>
//                       <Textarea
//                         placeholder="Enter bank address"
//                         {...field}
//                         rows={4}
//                         className="bg-gray-800/80 backdrop-blur-md border-gray-600/50 rounded-xl p-4 text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-500/50 transition-all duration-300 resize-none border"
//                       />
//                     </FormControl>
//                     <FormMessage className="text-red-400" />
//                   </FormItem>
//                 )}
//               />

//               <div className="flex gap-3 pt-4">
//                 <Button
//                   type="button"
//                   variant="outline"
//                   onClick={() => setOpen(false)}
//                   className="flex-1 py-6 rounded-xl border-gray-600/50 text-gray-300 hover:bg-gray-700/50 transition-all duration-300 font-semibold bg-gray-800/50"
//                 >
//                   Cancel
//                 </Button>
//                 <Button 
//                   type="submit" 
//                   className="flex-1 py-6 bg-gradient-to-r from-black via-gray-900 to-yellow-600 text-white rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105 border border-yellow-500/30 backdrop-blur-sm"
//                 >
//                   {bank ? "Update" : "Add"} Bank Details
//                 </Button>
//               </div>
//             </form>
//           </Form>
//         </div>
//       </SheetContent>
//     </Sheet>
//   );
// };

// export const Active = ({ id, children }: { id: any; children?: React.ReactNode }) => {
//   const { executeAsync } = useHttp(`/admin-bank/active/${id}`, "PATCH");
//   const router = useRouter();
  
//   return (
//     <div
//       className="px-6 py-3 bg-gradient-to-r from-black via-gray-900 to-green-600 text-white rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105 text-sm cursor-pointer text-center border border-green-500/30 backdrop-blur-sm"
//       onClick={() => {
//         executeAsync();
//         router.refresh();
//         toast.success("Bank activated successfully");
//       }}
//     >
//       {children || "Activate"}
//     </div>
//   );
// };

// export const DeActive = ({ id, children }: { id: any; children?: React.ReactNode }) => {
//   const { executeAsync } = useHttp(`/admin-bank/deactive/${id}`, "PATCH");
//   const router = useRouter();
  
//   return (
//     <div
//       className="px-6 py-3 bg-gradient-to-r from-black via-gray-900 to-orange-600 text-white rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105 text-sm cursor-pointer text-center border border-orange-500/30 backdrop-blur-sm"
//       onClick={() => {
//         executeAsync();
//         router.refresh();
//         toast.success("Bank deactivated successfully");
//       }}
//     >
//       {children || "Deactivate"}
//     </div>
//   );
// };

// export const DeleteBank = ({ id, children }: { id: any; children?: React.ReactNode }) => {
//   const { executeAsync } = useHttp(`/admin-bank/delete/${id}`, "DELETE");
//   const router = useRouter();
//   const [open, setOpen] = useState(false);

//   const submit = () => {
//     executeAsync();
//     router.refresh();
//     setOpen(false);
//     toast.success("Bank deleted successfully");
//   };

//   return (
//     <Dialog open={open} onOpenChange={setOpen}>
//       <DialogTrigger asChild>
//         {children || (
//           <div className="px-6 py-3 bg-gradient-to-r from-black via-gray-900 to-red-600 text-white rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105 text-sm cursor-pointer text-center border border-red-500/30 backdrop-blur-sm">
//             Delete
//           </div>
//         )}
//       </DialogTrigger>
//       <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-gray-900 via-black to-red-900/20 backdrop-blur-xl border border-red-500/30 rounded-3xl">
//         {/* Animated Background */}
//         <div className="absolute inset-0 overflow-hidden -z-10">
//           <div className="absolute -top-10 -right-10 w-20 h-20 bg-gradient-to-br from-red-600/20 to-gray-800 rounded-full blur-xl"></div>
//           <div className="absolute -bottom-10 -left-10 w-20 h-20 bg-gradient-to-tr from-gray-700 to-red-700/10 rounded-full blur-xl"></div>
//         </div>
        
//         <DialogHeader>
//           <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-gray-800 to-black"></div>
//           <div className="flex items-center gap-3 mt-2">
//             <div className="relative">
//               <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-gray-800 rounded-lg blur-md"></div>
//               <div className="relative w-8 h-8 bg-gradient-to-r from-black via-gray-900 to-red-600 rounded-lg flex items-center justify-center border border-red-500/30">
//                 <span className="text-white text-sm font-bold">!</span>
//               </div>
//             </div>
//             <DialogTitle className="text-xl font-bold text-white font-serif">
//               Delete Bank Account
//             </DialogTitle>
//           </div>
//           <DialogDescription className="text-gray-300 pt-4 text-base">
//             Are you sure you want to delete this bank account? This action cannot be undone and all associated data will be permanently removed.
//           </DialogDescription>
//         </DialogHeader>
        
//         <div className="flex gap-3 pt-4">
//           <Button
//             variant="outline"
//             onClick={() => setOpen(false)}
//             className="flex-1 py-6 rounded-xl border-gray-600/50 text-gray-300 hover:bg-gray-700/50 transition-all duration-300 font-semibold bg-gray-800/50"
//           >
//             Cancel
//           </Button>
//           <Button
//             variant={"destructive"}
//             onClick={submit}
//             className="flex-1 py-6 bg-gradient-to-r from-black via-gray-900 to-red-600 text-white rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105 border border-red-500/30 backdrop-blur-sm"
//           >
//             Delete Account
//           </Button>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// };