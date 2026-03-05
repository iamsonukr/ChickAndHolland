// import {
//   Entity,
//   Column,
//   PrimaryGeneratedColumn,
//   ManyToOne,
//   CreateDateColumn,
//   UpdateDateColumn,
//   BaseEntity,
//   JoinColumn,
// } from "typeorm";

// import Order from "./Order";
// import { RetailerOrder } from "./RetailerOrder";
// import Style from "./OrderStyle";

// @Entity("order_pieces")
// export default class OrderPiece extends BaseEntity {
//   @PrimaryGeneratedColumn()
//   id: number;

//   @ManyToOne(() => Order, { nullable: true })
//   @JoinColumn({ name: "orderId" })
//   order: Order | null;

//   @ManyToOne(() => RetailerOrder, { nullable: true })
//   @JoinColumn({ name: "retailerOrderId" })
//   retailerOrder: RetailerOrder | null;

//   // ⭐ ADD THIS — missing relation
//   @ManyToOne(() => Style, { nullable: true })
//   @JoinColumn({ name: "styleId" })
//   style: Style | null;

//   @Column()
//   styleNo: string;

//   @Column()
//   pieceNumber: number;

//   @Column({ unique: true })
//   barcode: string;

//   @Column({
//     type: "enum",
//     enum: [
//       "Pattern",
//       "Khaka",
//       "Issue Beading",
//       "Beading",
//       "Zarkan",
//       "Stitching",
//       "Balance Pending",
//       "Ready To Delivery",
//       "Shipped"
//     ],
//     default: "Pattern",
//   })
//   status: string;

//   @CreateDateColumn()
//   createdAt: Date;

//   @UpdateDateColumn()
//   updatedAt: Date;
// }
