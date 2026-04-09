// "use client";

// import { Button } from "@/components/ui/button";
// import { TableCell, TableRow } from "@/components/ui/table";
// import { useState } from "react";

// type Props = {
//   item: any;
//   beadingColourName: string;
//   liningColourName: string;
// };

// const ExpandStockDetails = ({
//   item,
//   beadingColourName,
//   liningColourName,
// }: Props) => {
//   const [showMore, setShowMore] = useState(false);

//   return (
//     <>
//       {showMore && (
//         <>
//           <TableRow>
//             <TableCell className="text-nowrap font-medium">
//               Beading Color
//             </TableCell>
//             <TableCell>
//               <div className="flex gap-2">
//                 <p
//                   className="h-5 w-5 rounded-full"
//                   style={{
//                     backgroundColor: item.beading_color,
//                   }}
//                 ></p>

//                 {item.beading_color === item.product.beading_color
//                   ? `SAS(${beadingColourName})`
//                   : beadingColourName}
//               </div>
//             </TableCell>
//           </TableRow>

//           <TableRow>
//             <TableCell className="font-medium">Lining Color</TableCell>
//             <TableCell>
//               <div className="flex gap-2">
//                 <p
//                   className="h-5 w-5 rounded-full"
//                   style={{
//                     backgroundColor: item.lining_color,
//                   }}
//                 ></p>

//                 {item.lining_color === item.product.lining_color
//                   ? `SAS(${liningColourName})`
//                   : liningColourName}
//               </div>
//             </TableCell>
//           </TableRow>

//           <TableRow>
//             <TableCell className="font-medium">Lining</TableCell>
//             <TableCell>
//               {item.product.lining === item.lining
//                 ? `SAS(${item.lining})`
//                 : item.lining}
//             </TableCell>
//           </TableRow>
//         </>
//       )}
//       <Button
//         size="sm"
//         variant="outline"
//         className="w-full mt-3"
//         onClick={() => setShowMore(!showMore)}
//       >
//         {showMore ? "Show less" : "Show more"}
//       </Button>
//     </>
//   );
// };

// export default ExpandStockDetails;

"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

type Props = {
  item: any;
  beadingColourName?: string;
  liningColourName?: string;
};

const ExpandStockDetails = ({
  item,
  beadingColourName,
  liningColourName,
}: Props) => {
  const getColourLabel = (
    colourValue?: string,
    defaultColourValue?: string,
    colourName?: string,
  ) => {
    const resolvedName = colourName || colourValue || "-";

    if (
      colourValue &&
      defaultColourValue &&
      colourValue === defaultColourValue &&
      resolvedName !== "No Color"
    ) {
      return `SAS(${resolvedName})`;
    }

    return resolvedName;
  };

  const getLiningLabel = () => {
    const resolvedLining = item.lining || "-";

    if (
      item.product?.lining &&
      item.product.lining === item.lining &&
      resolvedLining !== "No Lining"
    ) {
      return `SAS(${resolvedLining})`;
    }

    return resolvedLining;
  };

  const shouldShowSwatch = (colourValue?: string) =>
    Boolean(colourValue && colourValue !== "No Color");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="mt-3 w-full">
          Show more
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Stock Details</DialogTitle>
        </DialogHeader>

        <Table>
          <TableBody>
           
            <TableRow>
              <TableCell className="font-medium">Beading Color</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {shouldShowSwatch(item.beading_color) && (
                    <div
                      className="h-5 w-5 rounded-full"
                      style={{ backgroundColor: item.beading_color }}
                    />
                  )}
                  <span>
                    {getColourLabel(
                      item.beading_color,
                      item.product?.beading_color,
                      beadingColourName,
                    )}
                  </span>
                </div>
              </TableCell>
            </TableRow>

          
            <TableRow>
              <TableCell className="font-medium">Lining Color</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {shouldShowSwatch(item.lining_color) && (
                    <div
                      className="h-5 w-5 rounded-full"
                      style={{ backgroundColor: item.lining_color }}
                    />
                  )}
                  <span>
                    {getColourLabel(
                      item.lining_color,
                      item.product?.lining_color,
                      liningColourName,
                    )}
                  </span>
                </div>
              </TableCell>
            </TableRow>

           
            <TableRow>
              <TableCell className="font-medium">Lining</TableCell>
              <TableCell>{getLiningLabel()}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
};

export default ExpandStockDetails;
