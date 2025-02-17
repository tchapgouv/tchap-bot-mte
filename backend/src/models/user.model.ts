import {Column, DataType, Model, Table, Unique} from 'sequelize-typescript';
import {InferAttributes, InferCreationAttributes} from "sequelize";

@Table
export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {

    @Unique
    @Column(DataType.TEXT)
    declare username: string
}
