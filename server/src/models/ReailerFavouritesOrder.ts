import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from "typeorm";
import { TABLE_NAMES } from "../constants";
import BaseModel from "./BaseModel";
import Favourites from "./Favourites";
import { RetailerOrder } from "./RetailerOrder";
import Retailer from "./Retailer";

@Entity(TABLE_NAMES.RETAILERFAVOURITESORDERS)
export default class RetailerFavouritesOrders extends BaseModel {
@OneToOne(() => RetailerOrder, order => order.favourite_order)
order: RetailerOrder;

  @Column("varchar", { nullable: false })
  favourite_ids: string;

  @ManyToOne(() => Retailer, (retailer: any) => retailer.favourites)
  retailer: Retailer;

@Column("int", { default: 0 })
is_approved: number;


  @Column("varchar", { nullable: true })
  rejected_comments: string;

  @Column("boolean", { default: false })
  isDeleted: boolean;
}
