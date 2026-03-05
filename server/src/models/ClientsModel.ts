import { Column, Entity, JoinColumn, OneToOne } from "typeorm";
import { TABLE_NAMES } from "../constants";
import BaseModel from "./BaseModel";
import Customer from "./Customer";

@Entity(TABLE_NAMES.Clients)
export default class Clients extends BaseModel {
    @Column("varchar", { length: 50, nullable: false })
    name: string;

    @Column("varchar", { length: 250, nullable: false })
    address: string;

    @Column("int", { nullable: false })
    proximity: number;

    @Column("varchar", { length: 250, nullable: false })
    latitude: number;

    @Column("varchar", { length: 250, nullable: false })
    longitude: number;

    @Column("varchar", { length: 250, nullable: true })
    city_name: string;

    @Column("boolean", { default: false })
    isDeleted: boolean;

    @OneToOne(() => Customer, (customer) => customer.client)
    @JoinColumn()
    customer: Customer;
}
