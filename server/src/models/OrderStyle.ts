import { Column, Entity, ManyToOne } from "typeorm";
import BaseModel from "./BaseModel";
import Order from "./Order";

export enum ColorType {
  "Same as showcase" = "Same as showcase",
  "Client provided" = "Client provided",
  "Custom" = "Custom",
}

export enum SizeCountry {
  EU = "EU",
  IT = "IT",
  US = "US",
  UK = "UK",
}

@Entity("orderStyles")
export default class Style extends BaseModel {
  @ManyToOne(() => Order, (order) => order.styles, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  order: Order;

  @Column("varchar", { length: 225, nullable: true })
  styleNo: string;

  
  @Column("varchar", { unique: true })   // ✔ ONE BARCODE PER STYLE
  barcode: string;

  // @Column("enum", { enum: ColorType })
  @Column("varchar", { length: 225, nullable: true })
  colorType: string;


  @Column("json")
  customColor: string;

  // @Column("enum", { enum: SizeCountry })
  @Column("varchar", { length: 225, nullable: true })
  sizeCountry: SizeCountry;

  @Column("varchar", { nullable: true })
  size: number;

  @Column("json")
  customSize: string;

  @Column("json")
  customSizesQuantity: string;

  @Column("int")
  quantity: number;

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  unitPrice: number | null;

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  subtotal: number | null;

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  totalPrice: number | null;

  @Column("int", { nullable: true })
  currencyId: number | null;

  @Column("varchar", { length: 10, nullable: true })
  currencyCode: string | null;

  @Column("varchar", { length: 10, nullable: true })
  currencySymbol: string | null;

  @Column("varchar", { nullable: false, default: "SAS" })
  mesh_color: string;

  @Column("varchar", { nullable: false, default: "SAS" })
  beading_color: string;

  @Column("varchar", { length: 255, nullable: true, select: false })
  beader: string | null;

  @Column("varchar", { nullable: false, default: "SAS" })
  lining: string;

  @Column("varchar", { nullable: true, default: "SAS" })
  lining_color: string | null;

  @Column("json")
  photoUrls: string;

  @Column("varchar", { nullable: true })
currentStatus: string | null;

  @Column("json")
  comments: string;
}
