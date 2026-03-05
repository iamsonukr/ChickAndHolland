import { Column, Entity, ManyToOne } from "typeorm";
import BaseModel from "./BaseModel";
import Order from "./Order";
import { TABLE_NAMES } from "../constants";

@Entity(TABLE_NAMES.BODY_DETAILS)
export default class BodyDetail extends BaseModel {
  @Column("int", { nullable: false })
  height: number;

  @Column("int", { nullable: false })
  head: number;

  @Column("int", { nullable: false })
  neck: number;

  @Column("int", { nullable: false })
  hip: number;

  @Column("int", { nullable: false })
  shoulderToWaist: number;

  @Column("int", { nullable: false })
  sleeveLength: number;

  @Column("int", { nullable: false })
  armTurn: number;

  @Column("int", { nullable: false })
  shoeSize: number;

  @Column("int", { nullable: false })
  waistLengthBehind: number;

  @Column("int", { nullable: false })
  shoulderLength: number;

  @Column("int", { nullable: false })
  bustCircumference: number;

  @Column("int", { nullable: false })
  waistCircumference: number;

  @Column("int", { nullable: false })
  waistToKnee: number;

  @Column("int", { nullable: false })
  waistToAnkle: number;

  @Column("int", { nullable: false })
  waistLengthBehind_two: number;

  // @ManyToOne(() => Order, (order) => order.bodyDetails, {
  //   onDelete: "CASCADE",
  //   onUpdate: "CASCADE",
  // })
  // order: Order;
}
