import { Types } from 'mongoose';

export function asMongoObjectId(
  id: string | Types.ObjectId | undefined | null,
): Types.ObjectId | null {
  if (id == null) {
    return null;
  }
  return id instanceof Types.ObjectId ? id : new Types.ObjectId(id);
}
