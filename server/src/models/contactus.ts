import {Column, Entity} from "typeorm";
import BaseModel from "./BaseModel";
import {TABLE_NAMES} from "../constants";

@Entity(TABLE_NAMES.CONTACT_US)
export default class Contactus extends BaseModel {
    @Column("varchar", {length: 35, nullable: false, unique: false})
    name: string;

    @Column("varchar", {length: 225, nullable: false, unique: false})
    email: string;

    @Column("varchar", {length: 225, nullable: true})
    phoneNumber: string;

    @Column("varchar", {length: 50, nullable: false, unique: false})
    subject: string;

    @Column("varchar", {length: 50, nullable: false, unique: false})
    country: string;

    @Column("varchar", { length: 50, nullable: true })
    state: string;

    @Column("text", {nullable: false, unique: false})
    message: string;
    @Column("boolean", { default: false })
isRead: boolean;

}
