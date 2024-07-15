import {Column, DataType, Model, Table, Unique} from 'sequelize-typescript';
import {InferAttributes, InferCreationAttributes} from "sequelize";

@Table
export class LdapListGroup extends Model<InferAttributes<LdapListGroup>, InferCreationAttributes<LdapListGroup>> {

    @Unique
    @Column(DataType.TEXT)
    declare room_id: string;
    @Column(DataType.TEXT)
    declare bot_id: string;
    @Column(DataType.TEXT)
    declare base_dn: string;
    @Column(DataType.TEXT)
    declare filter: string;
    @Column(DataType.BOOLEAN)
    declare recursively: boolean;
    @Column(DataType.BOOLEAN)
    declare activated: boolean;
}
