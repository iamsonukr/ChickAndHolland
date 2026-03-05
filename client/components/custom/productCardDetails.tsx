"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { getProductColours } from "@/lib/data";

// Define nested interfaces (keeping these for clarity, but using `any` for top-level type)
interface ProductImage {
  id: number;
  createdAt: string;
  name: string;
  isMain: boolean;
}

// Use `any` for the top-level type as requested
const ProductDetailsSheet: React.FC<{ data: any }> = ({ data }) => {
  const [colors, setColors] = useState([] as any);

  const fetchDetails = async () => {
    try {
      const colours = await getProductColours({});

      setColors(colours.productColours);
    } catch (error) {
      console.log(error);
    }
  };

  const getColourBasedOnId = (hex: string) => {
    return colors.find((colour: any) => colour.hexcode === hex)?.name;
  };
  const referenceImages = data.reference_image
    ? JSON.parse(data.reference_image)
    : [];
  useEffect(() => {
    fetchDetails();
  }, []);
  return (
    <Sheet>
      {/* Trigger button to open the sheet */}
      <SheetTrigger asChild>
        <Button className="w-full">Details</Button>
      </SheetTrigger>

      {/* Sheet content */}
      <SheetContent className="w-full !max-w-5xl overflow-y-auto p-0">
        <SheetHeader className="p-4">
          <SheetTitle>Product Customization Sheet</SheetTitle>
        </SheetHeader>
        <Card className="m-4 border-none shadow-none">
          <CardContent className="grid gap-6 pt-6">
            {/* Reference Images Section */}

            {/* Colors Section */}
            <div>
              <h3 className="mb-2 text-lg font-bold text-gray-700 underline underline-offset-2">
                Colors
              </h3>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="w-1/2 font-medium">Color</TableCell>
                    <TableCell className="w-1/2">{data.color || "—"}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="w-1/2 font-medium">
                      Mesh Color
                    </TableCell>
                    <TableCell className="w-1/2">
                      {data.mesh_color === "SAS"
                        ? "SAS"
                        : getColourBasedOnId(data.mesh_color) || "—"}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="w-1/2 font-medium">
                      Beading Color
                    </TableCell>
                    <TableCell className="w-1/2">
                      {data.beading_color === "SAS"
                        ? "SAS"
                        : getColourBasedOnId(data.beading_color) || "—"}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="w-1/2 font-medium">
                      Lining Color
                    </TableCell>
                    <TableCell className="w-1/2">
                      {data.lining_color === "SAS"
                        ? "SAS"
                        : getColourBasedOnId(data.lining_color) || "—"}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Customization Options Section */}
            <div>
              <h3 className="mb-2 text-lg font-bold text-gray-700 underline underline-offset-2">
                Customization Options
              </h3>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="w-1/2 font-medium">
                      Add Lining
                    </TableCell>
                    <TableCell className="w-1/2">
                      {data.add_lining === 0 ? "No" : "Yes"}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="w-1/2 font-medium">Lining</TableCell>
                    <TableCell className="w-1/2">
                      {data.lining || "—"}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="w-1/2 font-medium">
                      Customization
                    </TableCell>
                    <TableCell className="w-1/2">
                      {data.customization || "—"}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Sizing & Quantity Section */}
            <div>
              <h3 className="mb-2 text-lg font-bold text-gray-700 underline underline-offset-2">
                Sizing & Quantity
              </h3>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="w-1/2 font-medium">Size</TableCell>
                    <TableCell className="w-1/2">
                      {data.product_size} ({data.size_country || "—"})
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="w-1/2 font-medium">
                      Quantity
                    </TableCell>
                    <TableCell className="w-1/2">
                      {data.quantity || "—"}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Product Details Section */}
            <div>
              <h3 className="mb-2 text-lg font-bold text-gray-700 underline underline-offset-2">
                Product Details
              </h3>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="w-1/2 font-medium">
                      Product Code
                    </TableCell>
                    <TableCell className="w-1/2">
                      {data.product?.productCode || "—"}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {referenceImages.length > 0 && (
              <div>
                <h3 className="mb-2 text-lg font-bold text-gray-700 underline underline-offset-2">
                  Reference Images
                </h3>
                <div className="grid grid-cols-5 gap-2">
                  {referenceImages.map((image: any, index: number) => (
                    <div
                      key={index}
                      className="h-auto overflow-hidden rounded border"
                    >
                      <img
                        src={image}
                        alt={`Reference ${index + 1}`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </SheetContent>
    </Sheet>
  );
};

export default ProductDetailsSheet;
