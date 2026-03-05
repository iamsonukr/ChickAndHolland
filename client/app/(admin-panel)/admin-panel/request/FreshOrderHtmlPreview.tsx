"use client";
import dayjs from "dayjs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const fresp = "text-[14px] font-semibold";

export default function FreshOrderHtmlPreview({ orderData, form }: any) {
  const styles = form.watch("styles") || [];

  return (
    <div className="bg-white p-4 border rounded-md text-black">
      {/* Header Section */}
      <div className="flex justify-between bg-pink-500 text-black font-bold p-4">
        <div className="text-lg">{orderData.customerId}</div>
        <div className="text-xl">{orderData.purchaseOrderNo}</div>

        <div className="text-right text-sm">
          Order Received Date:{" "}
          <span>{dayjs(orderData.orderReceivedDate).format("DD MMM YYYY")}</span>
          <br />
          Order Shipping Date:{" "}
          <span>
            {dayjs(orderData.orderCancellationDate).format("DD MMM YYYY")}
          </span>
        </div>
      </div>

      {/* Products */}
      {styles.map((item: any, i: number) => {
        const previewImage = item.image?.includes("webp")
          ? item.image.replace(".webp", ".jpeg")
          : item.image;

        return (
          <div className="flex gap-4 mt-4" key={i}>
            {/* TABLE */}
            <table className="text-[13px] border w-[60%]">
              <thead>
                <tr className="bg-pink-600 text-white">
                  <th colSpan={4} className="p-2 text-left">
                    Product Specifications
                  </th>
                </tr>
              </thead>

              <tbody>
                <tr className="border">
                  <td className={fresp}>Color</td>
                  <td>
                    <Input
                      className="bg-white text-black border border-gray-400"

                      value={item.customColor}
                      onChange={(e) =>
                        form.setValue(`styles.${i}.customColor`, e.target.value)
                      }
                    />
                  </td>

                  <td className={fresp}>Mesh Color</td>
                  <td>
                    <Input
                      className="bg-white text-black border border-gray-400"

                      value={item.meshColor}
                      onChange={(e) =>
                        form.setValue(`styles.${i}.meshColor`, e.target.value)
                      }
                    />
                  </td>
                </tr>

                <tr className="border">
                  <td className={fresp}>Quantity</td>
                  <td>
                    <Input
                      className="bg-white text-black border border-gray-400"

                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        form.setValue(`styles.${i}.quantity`, e.target.value)
                      }
                    />
                  </td>

                  <td className={fresp}>Beading Color</td>
                  <td>
                    <Input
                      className="bg-white text-black border border-gray-400"

                      value={item.beadingColor}
                      onChange={(e) =>
                        form.setValue(`styles.${i}.beadingColor`, e.target.value)
                      }
                    />
                  </td>
                </tr>

                <tr className="border">
                  <td className={fresp}>Size</td>
                  <td>
                    <Input
                      className="bg-white text-black border border-gray-400"

                      value={item.size}
                      onChange={(e) =>
                        form.setValue(`styles.${i}.size`, e.target.value)
                      }
                    />
                  </td>

                  <td className={fresp}>Lining Color</td>
                  <td>
                    <Input
                      className="bg-white text-black border border-gray-400"

                      value={item.liningColor}
                      onChange={(e) =>
                        form.setValue(`styles.${i}.liningColor`, e.target.value)
                      }
                    />
                  </td>
                </tr>

                <tr className="border">
                  <td className={fresp}>Lining</td>
                  <td colSpan={3}>
                    <Input
                      className="bg-white text-black border border-gray-400"

                      value={item.lining}
                      onChange={(e) =>
                        form.setValue(`styles.${i}.lining`, e.target.value)
                      }
                    />
                  </td>
                </tr>

                <tr className="border">
                  <td className={fresp}>Comments</td>
                  <td colSpan={3}>
                    <Textarea
                    
                      value={item.comments}
                      onChange={(e) =>
                        form.setValue(`styles.${i}.comments`, e.target.value)
                      }
  className="bg-white text-black border border-gray-400"
                    />
                  </td>
                </tr>
              </tbody>
            </table>

            {/* IMAGE */}
            <div className="w-[40%] flex items-center justify-center">
              <img
                src={previewImage}
                alt="Product"
                className="rounded-lg object-cover w-[300px] h-[500px]"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
