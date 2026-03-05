import { Entity, Column, UpdateDateColumn } from "typeorm";
import { TABLE_NAMES } from "../constants";
import BaseModel from "./BaseModel";

@Entity(TABLE_NAMES.QUICKBOOKTOKENS)
export default class QuickbooksToken extends BaseModel {
  @Column("text")
  accessToken: string;

  @Column("text")
  refreshToken: string;

  @Column('text')
  realmId: string;

  @Column("datetime")  // Changed from 'timestamp with time zone' to 'datetime'
  expiresAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}