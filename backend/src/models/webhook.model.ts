import {Column, Model, Table, Unique, DataType} from "sequelize-typescript";
import {InferAttributes, InferCreationAttributes} from "sequelize";

@Table
export class Webhook extends Model<InferAttributes<Webhook>, InferCreationAttributes<Webhook>> {

    @Column(DataType.TEXT)
    declare webhook_label: string;
    @Unique
    @Column(DataType.TEXT)
    declare webhook_id: string;
    @Column(DataType.TEXT)
    declare bot_id: string;
    @Column(DataType.TEXT)
    declare room_id: string;
    @Column(DataType.TEXT)
    declare script: string;
    @Column(DataType.BOOLEAN)
    declare internet: boolean;
    @Column(DataType.NUMBER)
    declare lastUseEpoch: number;
}
