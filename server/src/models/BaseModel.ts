import { BaseEntity, CreateDateColumn, PrimaryGeneratedColumn, Column, DeleteDateColumn } from "typeorm";

export default class BaseModel extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'datetime', nullable: true })
  deletedAt?: Date;
}
