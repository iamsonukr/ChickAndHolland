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
  beadingColourName: string;
  liningColourName: string;
};

const ExpandStockDetails = ({
  item,
  beadingColourName,
  liningColourName,
}: Props) => {
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
                  <div
                    className="h-5 w-5 rounded-full"
                    style={{ backgroundColor: item.beading_color }}
                  />
                  <span>
                    {item.beading_color === item.product.beading_color
                      ? `SAS(${beadingColourName})`
                      : beadingColourName}
                  </span>
                </div>
              </TableCell>
            </TableRow>

          
            <TableRow>
              <TableCell className="font-medium">Lining Color</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div
                    className="h-5 w-5 rounded-full"
                    style={{ backgroundColor: item.lining_color }}
                  />
                  <span>
                    {item.lining_color === item.product.lining_color
                      ? `SAS(${liningColourName})`
                      : liningColourName}
                  </span>
                </div>
              </TableCell>
            </TableRow>

           
            <TableRow>
              <TableCell className="font-medium">Lining</TableCell>
              <TableCell>
                {item.product.lining === item.lining
                  ? `SAS(${item.lining})`
                  : item.lining}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
};

export default ExpandStockDetails;
