import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";
import { TABLE_NAMES } from "../constants";
import BaseModel from "./BaseModel";

@Entity(TABLE_NAMES.QUICKBOOKLOGINHISTORY)
export default class QuickbooksLoginHistory extends BaseModel {
  @Column("varchar", { length: 256 })
  userId: string;

  @Column({ nullable: true })
  userEmail: string;

  @Column({ default: true })
  success: boolean;

  @CreateDateColumn()
  loggedInAt: Date;
}