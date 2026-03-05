import { ContentLayout } from "@/components/custom/admin-panel/contentLayout";
import {
  getAdminBankDetails,
  getAdminBankRetailerDetails,
  getBankDetails,
  getRetailerDetails,
} from "@/lib/data";
import { cookies } from "next/headers";
import {
  BookUser,
  Building,
  CalendarArrowDown,
  CreditCard,
  Hash,
  Mail,
  MapPin,
  Phone,
  Store,
  User,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Data, { PersonalDetailsForm } from "./Data";
import { Separator } from "@/components/ui/separator"; // Fixed import
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import ParsedPhoneNumbers from "./phonen-number";

const RetailerDashboard = async () => {
  const retailerId = (await cookies()).get("retailerId")?.value;

  const retailerDetails = await getRetailerDetails(Number(retailerId));
console.log("🔥 RETAILER DETAILS:", JSON.stringify(retailerDetails, null, 2));

  const bankDetails = await getBankDetails(retailerId);
const adminBanks = await getAdminBankRetailerDetails(Number(retailerId));
console.log("Retailer ID =>", retailerId);
console.log("Admin Banks =>", JSON.stringify(adminBanks, null, 2));


  return (
    <ContentLayout title="My Account ">
      <div className="grid md:grid-cols-1 md:gap-4 md:px-4 lg:grid-cols-2">
        {/* Personal Info Card */}
        <Card className="border-2 shadow-md transition-all hover:shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between gap-2 text-xl">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Personal Information
              </div>
              <PersonalDetailsForm
                retailerId={retailerDetails?.retailer?.id}
                data={retailerDetails?.retailer}
              />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="flex items-center gap-2 py-3 font-medium text-gray-500">
                    <User className="h-4 w-4 text-primary" />
                    Name
                  </TableCell>
                  <TableCell className="py-3 font-semibold">
                    {retailerDetails?.retailer?.name}
                  </TableCell>
                </TableRow>

                <TableRow>
  <TableCell className="flex items-center gap-2 py-3 font-medium text-gray-500">
    <Phone className="h-4 w-4 text-primary" />
    Phone Number
  </TableCell>
  <TableCell className="py-3 font-semibold">
    {retailerDetails?.retailer?.phoneNumber ? (
      <ParsedPhoneNumbers phoneNumber={retailerDetails.retailer.phoneNumber} />
    ) : (
      <span className="text-gray-400">Not provided</span>
    )}
  </TableCell>
</TableRow>


                <TableRow>
                  <TableCell className="flex items-center gap-2 py-3 font-medium text-gray-500">
                    <Mail className="h-4 w-4 text-primary" />
                    Email
                  </TableCell>
                  <TableCell className="py-3 font-semibold">
                    <a
                      href={`mailto:${retailerDetails?.retailer?.email}`}
                      className="text-primary hover:underline"
                    >
                      {retailerDetails?.retailer?.email}
                    </a>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Store Info Card */}
        <Card className="border-2 shadow-md transition-all hover:shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Store className="h-5 w-5 text-primary" />
              Store Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="flex items-center gap-2 py-3 font-medium text-gray-500">
                    <Store className="h-4 w-4 text-primary" />
                    Store Name
                  </TableCell>
                  <TableCell className="py-3 font-semibold">
                    {retailerDetails?.retailer?.storeName}
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="flex items-center gap-2 py-3 font-medium text-gray-500">
                    <MapPin className="h-4 w-4 text-primary" />
                    Store Address
                  </TableCell>
                  <TableCell className="py-3 font-semibold">
                    {retailerDetails?.retailer?.storeAddress}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <div className="flex flex-col md:gap-2 md:p-4">
        {/* Your Bank Account Details */}
        <Card className="border-2 shadow-md transition-all hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Building className="h-5 w-5 text-primary" />
              Your Bank Account Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Bank Account Section */}
            <div>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="flex items-center gap-2 py-3 font-medium text-gray-500">
                      <Building className="h-4 w-4 text-primary" />
                      Bank Name
                    </TableCell>
                    <TableCell className="py-3 font-semibold">
                      {bankDetails.data?.bankName}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="flex items-center gap-2 py-3 font-medium text-gray-500">
                      <Hash className="h-4 w-4 text-primary" />
                      Account Number
                    </TableCell>
                    <TableCell className="py-3 font-semibold">
                      {bankDetails.data?.account}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="flex items-center gap-2 py-3 font-medium text-gray-500">
                      <CreditCard className="h-4 w-4 text-primary" />
                      Swift Code
                    </TableCell>
                    <TableCell className="py-3 font-semibold">
                      {bankDetails.data?.ifc}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="flex items-center gap-2 py-3 font-medium text-gray-500">
                      <Store className="h-4 w-4 text-primary" />
                      Branch Name
                    </TableCell>
                    <TableCell className="py-3 font-semibold">
                      {bankDetails.data?.branch}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="flex items-center gap-2 py-3 font-medium text-gray-500">
                      <BookUser className="h-4 w-4 text-primary" />
                      Address
                    </TableCell>
                    <TableCell className="py-3 font-semibold">
                      {bankDetails.data?.address}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <Data
                data={bankDetails.data}
                retailerId={retailerId}
                whatToShow="bank"
              />
            </div>

            <>
              <Separator className="my-4" />

              {/* Credit Card Section */}
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                  <CreditCard className="h-4 w-4" />
                  Credit Card
                </h3>

                {bankDetails.data?.card ? (
                  <div className="rounded-lg bg-gradient-to-r from-gray-800 to-gray-700 p-4 text-white shadow">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="text-sm font-medium opacity-80">
                        {bankDetails.data?.card_name}
                      </div>
                      <CreditCard className="h-5 w-5 opacity-80" />
                    </div>

                    <div className="mb-4 font-mono text-base tracking-wider">
                      {bankDetails.data?.card || "•••• •••• •••• ••••"}
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs opacity-75">EXPIRES</div>
                        <div className="font-mono text-sm">
                          {bankDetails.data?.exp || "MM/YY"}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="border-white/50 text-xs text-white"
                      >
                        ACTIVE
                      </Badge>
                    </div>

                    <div className="mt-4 border-t border-white/20 pt-3">
                      <div className="text-xs opacity-75">BILLING ADDRESS</div>
                      <div className="truncate text-sm">
                        {bankDetails.data?.card_address ||
                          "No address provided"}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center">
                    <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No card details</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by adding your card information.</p>
                  </div>
                )}
              </div>

              <Data
                data={bankDetails.data}
                retailerId={retailerId}
                whatToShow="card"
              />
            </>
          </CardContent>
        </Card>

        {/* Admin Bank Details Header Card */}
        {adminBanks.data && adminBanks.data.length > 0 && (
          <Card className="col-span-1 mt-8 border-2 shadow-md transition-all hover:shadow-lg lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-xl">
                Chic & Holland Bank Details
              </CardTitle>
              <CardDescription>
                Use the following bank details for your transactions
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Admin Bank Details Cards */}
        {adminBanks.data &&
          adminBanks.data.map((bank: any) => (
            <Card
              key={bank.id}
              className="border-2 shadow-md transition-all hover:shadow-lg"
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Building className="h-5 w-5 text-primary" />
                  {bank.bankName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell className="flex items-center gap-2 py-3 font-medium text-gray-500">
                        <User className="h-4 w-4 text-primary" />
                        Account Holder
                      </TableCell>
                      <TableCell className="py-3 font-semibold">
                        {bank.accountHolder}
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell className="flex items-center gap-2 py-3 font-medium text-gray-500">
                        <Hash className="h-4 w-4 text-primary" />
                        Account Number
                      </TableCell>
                      <TableCell className="py-3 font-semibold">
                        {bank.accountNumber}
                      </TableCell>
                    </TableRow>

                    {/* IFSC CODE (optional) */}
{bank.ifscCode && (
  <TableRow>
    <TableCell className="flex items-center gap-2 py-3 font-medium text-gray-500">
      <CreditCard className="h-4 w-4 text-primary" />
            Swift Code

    </TableCell>
    <TableCell className="py-3 font-semibold">
      {bank.ifscCode}
    </TableCell>
  </TableRow>
)}

{/* SWIFT CODE (optional) */}
{bank.swiftCode && (
  <TableRow>
    <TableCell className="flex items-center gap-2 py-3 font-medium text-gray-500">
      <CreditCard className="h-4 w-4 text-primary" />
IFSC Code    </TableCell>
    <TableCell className="py-3 font-semibold">
      {bank.swiftCode}
    </TableCell>
  </TableRow>
)}



                    <TableRow>
                      <TableCell className="flex items-center gap-2 py-3 font-medium text-gray-500">
                        <BookUser className="h-4 w-4 text-primary" />
                        Address
                      </TableCell>
                      <TableCell className="py-3 font-semibold">
                        {bank.address}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
      </div>
    </ContentLayout>
  );
};

export default RetailerDashboard;
