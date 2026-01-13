import mongoose, { Document, Schema, Model, Types } from "mongoose";

export interface IAdmin extends Document {
  _id: Types.ObjectId;
  adminId: string;
  name: string;
  phoneNumber: string;
  email: string;
  password: string;
  image?: string;
  division: string;
  area: string;
  region: string;
  strategy: string;
  position: string;
  createdAt?: Date;
  updatedAt?: Date;
  ownerName: string;
  fcmToken?: string;
}

const adminSchema: Schema<IAdmin> = new Schema(
  {
    adminId: { type: String, required: true, unique: true },
    name: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    image: { type: String },
    fcmToken: { type: String },
    division: { type: String, required: true },
    area: { type: String, required: true },
    region: { type: String, required: true },
    strategy: { type: String, required: true },
    position: { type: String, required: true },

    ownerName: {
      type: String,
      required: function () {
        return this.division === "Distributor";
      },
    },
  },
  {
    timestamps: true,
  }
);

const Admin: Model<IAdmin> = mongoose.model<IAdmin>("Admin", adminSchema);

export default Admin;
