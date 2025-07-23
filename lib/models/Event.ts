import { ObjectId } from "mongodb";

/**
 * Event model for grouping documents and Q&A context.
 */
export interface Event {
  _id: ObjectId;
  user: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
