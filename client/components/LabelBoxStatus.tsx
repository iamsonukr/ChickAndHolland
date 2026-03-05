import Image from "next/image";

export default function LabelBoxStatus({
  styleNo,
  size,
  color,
  po,
  barcode,
}: {
  styleNo?: string;
  size?: string;
  color?: string;
  po?: string;
  barcode?: string;
}) {
  return (
    <div className="w-[150px] border-[3px] border-black bg-white text-center text-sm">
      
      {/* STYLE NO */}
      <div className="border-b-[3px] border-black py-2 font-semibold">
        {styleNo || "-"}
      </div>

      {/* SIZE */}
      <div className="border-b-[3px] border-black py-2">
        {size || "-"}
      </div>

      {/* COLOR */}
      <div className="border-b-[3px] border-black py-2">
        {color || "-"}
      </div>

      {/* PO NUMBER */}
      <div className="border-b-[3px] border-black py-2 text-xs font-semibold break-all px-1">
        {po || "-"}
      </div>

      {/* BARCODE */}
      {barcode && (
        <div className="py-2 flex justify-center">
          <Image
            src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${barcode}&scale=2&height=10&includetext=false`}
            alt="barcode"
            width={130}
            height={50}
          />
        </div>
      )}
    </div>
  );
}
