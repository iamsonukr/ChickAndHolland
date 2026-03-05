// import {
//   BeforeUpdate,
//   Column,
//   Entity,
//   JoinColumn,
//   ManyToOne,
//   OneToOne,
// } from "typeorm";
// import BaseModel from "./BaseModel";
// import Retailer from "./Retailer";
// import { ShippingStatus } from "./Order";
// import RetailerFavouritesOrders from "./ReailerFavouritesOrder";
// import RetailerStockOrders from "./RetailerStockOrders";

// // export enum OrderStatus {
// //   PatternKhaka = "Pattern/Khaka",
// //   Beading = "Beading",
// //   Stitching = "Stitching",
// //   Ready_To_Delivery = "Ready To Delivery",
// //   MovedToDelivery = "Moved To Delivery",
// //   Delivered = "Delivered",
// // }

// export enum OrderStatus {
//   PatternKhaka = "Pattern/Khaka",
//   Beading = "Beading",
//   Stitching = "Stitching",
//   Balance_Pending = "Balance Pending",
//   Ready_To_Delivery = "Ready To Delivery",
//   Shipped = "Shipped",
// }

// @Entity("retailer_orders")
// export class RetailerOrder extends BaseModel {
//   @ManyToOne(() => Retailer, (retailer) => retailer.orders, {
//     cascade: true,
//   })
//   retailer: Retailer;

//   @OneToOne(() => RetailerFavouritesOrders, (favourites) => favourites.order)
//   @JoinColumn()
//   favourite_order: RetailerFavouritesOrders;

//   @OneToOne(() => RetailerStockOrders, (stock) => stock.order)
//   @JoinColumn()
//   Stock_order: RetailerStockOrders;

//   @Column("boolean", { default: false })
//   isApproved: boolean;

//   @Column("boolean", { default: false })
//   is_stock_order: boolean;

//   @Column("varchar", { nullable: true })
//   admin_us_size: string;


//   // @Column("enum", { enum: OrderStatus, default: OrderStatus.PatternKhaka })
//   // orderStatus: OrderStatus;

//   @Column('varchar', { length: 225, nullable: true, default: OrderStatus.PatternKhaka })
//   orderStatus: string;

//   @Column("enum", { enum: ShippingStatus, default: ShippingStatus.NotShipped })
//   shippingStatus: ShippingStatus;

//   @Column("datetime", { nullable: true })
//   shippingDate: Date | null;

//   // @BeforeUpdate()
//   // updateShippingDate() {
//   //   if (this.shippingStatus === ShippingStatus.Shipped) {
//   //     this.shippingDate = new Date();
//   //   } else if (this.shippingStatus === ShippingStatus.NotShipped) {
//   //     this.shippingDate = null;
//   //   }
//   // }

//   @BeforeUpdate()
//   updateShippingDate() {
//     if (this.orderStatus === OrderStatus.Shipped) {
//       this.shippingDate = new Date();
//     } else if (this.orderStatus === OrderStatus.Ready_To_Delivery) {
//       this.shippingDate = null;
//     }
//   }

//   @Column("int")
//   purchaseAmount: number;

//   @Column("int", { default: 0 })
//   shippingAmount: number;

//   @Column("int", { default: 0 })
//   status_id: number;

//   @Column("varchar", { length: 225, nullable: false, unique: true })
//   purchaeOrderNo: string;

//   @Column("datetime", {
//     nullable: true, // Allow NULL values
//     default: () => "CURRENT_TIMESTAMP",
//   })
//   pattern: Date | null;

//   @Column("datetime", { nullable: true })
//   beading: Date;

//   @Column("datetime", { nullable: true })
//   stitching: Date;

//   @Column("datetime", { nullable: true })
//   ready_to_delivery: Date;

//   @Column("datetime", { nullable: true })
//   shipped: Date;

//   @Column("datetime", { nullable: true })
//   shiping_date: Date;

//   @Column("varchar", { length: 225, nullable: true, default: null })
//   invoiceNo: string;

//   @Column("varchar", { length: 225, nullable: true, default: null })
//   estimateNo: string;

//   @Column("varchar", {
//     length: 225,
//     default: "rubyinc@hotmail.com",
//   })
//   manufacturingEmailAddress: string;

//   // orderReceivedDate
//   @Column("datetime", { nullable: false, default: () => "CURRENT_TIMESTAMP" })
//   orderReceivedDate: Date;

//   // orderCancellationDate (this means, this is like deadline)
//   @Column("datetime", { nullable: true })
//   orderCancellationDate: Date;

//   // address
//   @Column("text", { nullable: true })
//   address: string;

//   // tracking no
//   @Column("varchar", { length: 225, nullable: true })
//   trackingNo: string;

//   @Column("varchar", { length: 225, nullable: true })
//   StyleNo: string;

//   @Column("varchar", { length: 225, nullable: true })
//   Size: string;

//   @Column("varchar", { length: 225, nullable: true })
//   quantity: string;

//   @Column("varchar", { length: 225, nullable: true })
//   size_country: string;

//   @Column("int", { default: 0 })
//   status: number;
// }
import {
  BeforeUpdate,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
} from "typeorm";
import BaseModel from "./BaseModel";
import Retailer from "./Retailer";
import { ShippingStatus, OrderStatus } from "./Order";
import RetailerFavouritesOrders from "./ReailerFavouritesOrder";
import RetailerStockOrders from "./RetailerStockOrders";

@Entity("retailer_orders")
export class RetailerOrder extends BaseModel {

  @ManyToOne(() => Retailer, (retailer) => retailer.orders, {
    cascade: true,
  })
  retailer: Retailer;

  @OneToOne(() => RetailerFavouritesOrders, fav => fav.order, {
    onDelete: "SET NULL",
  })
  @JoinColumn()
  favourite_order: RetailerFavouritesOrders;

  // FINAL FIX — ONE RetailerOrder → ONE StockOrder
  @OneToOne(() => RetailerStockOrders, (stock) => stock.order, {
    onDelete: "SET NULL",
  })
  @JoinColumn()
  Stock_order: RetailerStockOrders;

  @Column("varchar", { nullable: true, length: 255 })
  ppt_path: string;

  @Column("boolean", { default: false })
  isApproved: boolean;

  @Column("boolean", { default: false })
  is_stock_order: boolean;

  @Column("varchar", { nullable: true })
  admin_us_size: string;

  @Column("enum", {
    enum: OrderStatus,
    default: OrderStatus.Pattern,
  })
  orderStatus: OrderStatus;

  @Column("enum", { enum: ShippingStatus, default: ShippingStatus.NotShipped })
  shippingStatus: ShippingStatus;

  @Column("datetime", { nullable: true })
  shippingDate: Date | null;

  @BeforeUpdate()
  updateShippingDate() {
    if (this.orderStatus === OrderStatus.Shipped) {
      this.shippingDate = new Date();
    } else if (this.orderStatus === OrderStatus.Ready_To_Delivery) {
      this.shippingDate = null;
    }
  }

  @Column("int")
  purchaseAmount: number;

  @Column("int", { default: 0 })
  shippingAmount: number;

  @Column("int", { default: 0 })
  status_id: number;

  @Column("varchar", { length: 225, nullable: false, unique: true })
  purchaeOrderNo: string;

  @Column("datetime", { nullable: true, default: () => "CURRENT_TIMESTAMP" })
  pattern: Date | null;

  @Column({ nullable: true })
  phoneNumber!: string;

  @Column("datetime", { nullable: true })
  khaka: Date;

  @Column("datetime", { nullable: true })
  issue_beading: Date;

  @Column("datetime", { nullable: true })
  beading: Date;

  @Column("datetime", { nullable: true })
  zarkan: Date;

  @Column("datetime", { nullable: true })
  stitching: Date;

  @Column("datetime", { nullable: true })
  ready_to_delivery: Date;

  @Column("datetime", { nullable: true })
  shipped: Date;

  @Column("datetime", { nullable: true })
  shiping_date: Date;

  @Column("varchar", { length: 225, nullable: true, default: null })
  invoiceNo: string;

  @Column("varchar", { length: 225, nullable: true, default: null })
  estimateNo: string;

  @Column("varchar", {
    length: 225,
    default: "rubyinc@hotmail.com",
  })
  manufacturingEmailAddress: string;

  @Column("datetime", { nullable: false, default: () => "CURRENT_TIMESTAMP" })
  orderReceivedDate: Date;

  @Column("datetime", { nullable: true })
  orderCancellationDate: Date;

  @Column("text", { nullable: true })
  address: string;

  @Column("varchar", { length: 225, nullable: true })
  trackingNo: string;

  @Column("varchar", { length: 225, nullable: true })
  StyleNo: string;

  @Column("varchar", { length: 225, nullable: true })
  Size: string;

    @Column("varchar", { length: 50, default: "Pending" })
  payment_status: string;


  @Column("varchar", { length: 225, nullable: true })
  quantity: string;

  @Column("varchar", { length: 225, nullable: true })
  size_country: string;

  @Column("int", { default: 0 })
  status: number;
  @Column({ type: "datetime", nullable: true })
  balance_pending: Date | null;

}

