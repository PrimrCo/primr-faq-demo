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

/**
 * Primitive Event model with limited fields.
 */
export interface PrimrEvent {
  _id: string;
  name: string;
  // ...other fields as needed
}
