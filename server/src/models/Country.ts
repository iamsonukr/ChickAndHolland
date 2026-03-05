import {Column, Entity} from "typeorm";
import BaseModel from "./BaseModel";
import {TABLE_NAMES} from "../constants";

@Entity(TABLE_NAMES.COUNTRY)
export default class Country extends BaseModel {
    @Column("varchar", {length: 256, nullable: true})
    name: string;

    @Column("varchar", {length: 256, nullable: true})
    code: string;

    @Column("varchar", {length: 256, nullable: true})
    currency_symbol: string;
    
    @Column("varchar", {length: 256, nullable: true})
    currency_name: string;
    
    @Column("varchar", {length: 256, nullable: true})
    currency_short_name: string;
}
