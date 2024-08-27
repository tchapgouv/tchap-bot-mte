import {Column, DataType, Model, Table} from 'sequelize-typescript';
import {InferAttributes, InferCreationAttributes} from "sequelize";

@Table
export class Metric extends Model<InferAttributes<Metric>, InferCreationAttributes<Metric>> {

    @Column(DataType.TEXT)
    declare name: string;
    @Column(DataType.TEXT)
    declare labels: string;
    @Column(DataType.NUMBER)
    declare count: number;
}
