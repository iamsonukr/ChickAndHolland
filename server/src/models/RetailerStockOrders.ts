import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  ManyToOne,
} from "typeorm";
import { TABLE_NAMES } from "../constants";
import BaseModel from "./BaseModel";
import { RetailerOrder } from "./RetailerOrder";
import Stock from "./Stock";
import Retailer from "./Retailer";
import Currency from "./Currency";

@Entity(TABLE_NAMES.RETAILERSTOCKORDERS)
export default class RetailerStockOrders extends BaseModel {

  @ManyToOne(() => Stock, (stock) => stock)
  stock: Stock;

  @ManyToOne(() => Retailer, (r) => r)
  retailer: Retailer;

  @Column("int", { nullable: false })
  quantity: number;

  @Column({ type: "varchar", length: 10, nullable: true })
  admin_us_size!: string;

  @Column("boolean", { nullable: false, default: 0 })
  is_approved: number;

  @Column("varchar", { nullable: true })
  rejected_comments: string;

  @Column("varchar", { nullable: false, default: "SAS" })
  mesh_color: string;

  @Column("varchar", { nullable: false, default: "SAS" })
  beading_color: string;

  @Column("varchar", { nullable: false, default: "SAS" })
  lining: string;

  @Column("varchar", { nullable: true, default: "SAS" })
  lining_color: string | null;

  // FINAL FIX — ONE StockOrder → ONE RetailerOrder
  @OneToOne(() => RetailerOrder, (order) => order.Stock_order, {
    onDelete: "SET NULL",
  })
  @JoinColumn()
  order: RetailerOrder;

  @Column({ nullable: true })
  currencyId: number | null;

  @ManyToOne(() => Currency, { nullable: true })
  @JoinColumn({ name: "currencyId" })
  currency: Currency;

  @Column("boolean", { default: false })
  isDeleted: boolean;
}
