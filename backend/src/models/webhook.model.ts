import {Column, Model, Table, Unique, DataType} from "sequelize-typescript";
import {InferAttributes, InferCreationAttributes} from "sequelize";

@Table
export class Webhook extends Model<InferAttributes<Webhook>, InferCreationAttributes<Webhook>> {

    @Column(DataType.TEXT)
    webhook_label!: string;
    @Unique
    @Column(DataType.TEXT)
    webhook_id!: string;
    @Column(DataType.TEXT)
    bot_id!: string;
    @Column(DataType.TEXT)
    room_id!: string;
    @Column(DataType.TEXT)
    script!: string;
}
