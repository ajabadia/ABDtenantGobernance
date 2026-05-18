import { Document, Model } from 'mongoose';
import type { QueryFilter, UpdateQuery } from 'mongoose';

export class BaseRepository<T extends Document> {
  public model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async create(data: Partial<T>): Promise<T> {
    return await this.model.create(data);
  }

  async findById(id: string): Promise<T | null> {
    return await this.model.findById(id).exec();
  }

  async findOne(filter: QueryFilter<T>): Promise<T | null> {
    return await this.model.findOne(filter).exec();
  }

  async find(filter: QueryFilter<T> = {}): Promise<T[]> {
    return await this.model.find(filter).exec();
  }

  async update(id: string, data: UpdateQuery<T>): Promise<T | null> {
    return await this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async updateOne(filter: QueryFilter<T>, data: UpdateQuery<T>, options = {}): Promise<any> {
    return await this.model.updateOne(filter, data, options).exec();
  }

  async delete(id: string): Promise<T | null> {
    return await this.model.findByIdAndDelete(id).exec();
  }

  async countDocuments(filter: QueryFilter<T> = {}): Promise<number> {
    return await this.model.countDocuments(filter).exec();
  }
}

