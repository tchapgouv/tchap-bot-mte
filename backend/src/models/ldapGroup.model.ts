import {Column, DataType, Model, Table, Unique} from 'sequelize-typescript';
import {InferAttributes, InferCreationAttributes} from "sequelize";

@Table
export class LdapGroup extends Model<InferAttributes<LdapGroup>, InferCreationAttributes<LdapGroup>> {

    @Unique
    @Column(DataType.TEXT)
    declare room_id: string;
    @Column(DataType.TEXT)
    declare base_dn: string;
    @Column(DataType.BOOLEAN)
    declare recursively: boolean;
    @Column(DataType.TEXT)
    declare filter: string;
}
