import {Column, DataType, Model, Table, Unique} from 'sequelize-typescript';
import {InferAttributes, InferCreationAttributes} from "sequelize";

@Table
export class LdapGroup extends Model<InferAttributes<LdapGroup>, InferCreationAttributes<LdapGroup>> {

    @Unique
    @Column(DataType.TEXT)
    room_id!: string;
    @Column(DataType.TEXT)
    base_dn!: string;
    @Column(DataType.TEXT)
    filter!: string;
}
