


type Props = {
  styleNo: string;
  size: string;
  po: string;
  color: string;
  barcode?: string;
    quantity: number | string;   // ✅ ADD THIS

};

export default function WebLabelBox({
  styleNo,
  size,
  po,
  color,
  barcode,
  quantity
}: Props) {
  return (
    <div className="w-[140px] border-2 border-black bg-white">

      <div className="border-b-2 border-black py-2 text-center">
        {/* <p className="text-[11px] font-bold">STYLE NO</p> */}
        <p className="text-[11px]">{styleNo}</p>
      </div>

      <div className="border-b-2 border-black py-2 text-center">
        {/* <p className="text-[11px] font-bold">SIZE</p> */}
        <p className="text-[11px]">{size} / {quantity}</p>

      </div>
      {/* QUANTITY */}
      {/* <div className="border-b-2 border-black py-2 text-center">
        <p className="text-[11px]">QTY: {quantity}</p>
      </div> */}

      <div className="border-b-2 border-black py-2 text-center">
        <p className="text-[11px] font-bold">PO#</p>
        {/* <p className="text-[11px]">{po}</p> */}
      </div>

      {/* ✅ BARCODE */}
      {barcode && (
        <div className="py-2 flex flex-col items-center">
          <img
            src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${barcode}&scale=2&height=8&includetext=false`}
            alt="barcode"
            className="w-[120px] h-[35px]"
          />
          {/* <p className="text-[8px] mt-1">{barcode}</p> */}
        </div>
      )}
    </div>
  );
}
