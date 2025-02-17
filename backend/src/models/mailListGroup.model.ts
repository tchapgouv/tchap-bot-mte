import {Column, DataType, Model, Table, Unique} from 'sequelize-typescript';
import {InferAttributes, InferCreationAttributes} from "sequelize";

@Table
export class MailListGroup extends Model<InferAttributes<MailListGroup>, InferCreationAttributes<MailListGroup>> {

    @Unique
    @Column(DataType.TEXT)
    declare room_id: string;
    @Column(DataType.TEXT)
    declare bot_id: string;
    @Column(DataType.TEXT)
    declare mail: string;
    @Column(DataType.BOOLEAN)
    declare activated: boolean;
}
