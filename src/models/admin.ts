import mongoose, { Document, Schema, Model, Types } from "mongoose";
interface IIncentive {
  flue: number;
  medical: number;
  others: number;
}

interface ISalaryStructure {
  basic: number;
  incentive: IIncentive;
  gross: number;
  tax?: number;
  deductions: number;
}

interface ILoanPF {
  loan: number;
  pf: number;
}

interface ILeaveType {
  total: number;
  consumed: number;
}

interface ILeaveEntitlements {
  casualLeave: ILeaveType;
  sickLeave: ILeaveType;
  annualLeave: ILeaveType;
  maternityLeave: ILeaveType;
  paternityLeave: ILeaveType;
}

export interface IAdmin extends Document {
  _id: Types.ObjectId;
  adminId: string;
  name: string;
  phoneNumber: string;
  email: string;
  password: string;
  image?: string;
  division: string;
  city: string;
  joiningDate: Date;
  salaryStructure: ISalaryStructure;
  loanPF: ILoanPF;
  leaveEntitlements: ILeaveEntitlements;
  position: string;
  createdAt?: Date;
  updatedAt?: Date;
  brickName?: string;
  ownerName: string;
  DOB?: Date;
  fcmToken?: string;
}

const adminSchema: Schema<IAdmin> = new Schema(
  {
    adminId: { type: String, required: true, unique: true },
    name: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true },
    DOB: { type: Date, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    image: { type: String, required: true },
    division: { type: String, required: true },
    city: { type: String, required: true },
    fcmToken: { type: String },
    joiningDate: { type: Date, required: true },
    salaryStructure: {
      basic: { type: Number, required: true },
      incentive: {
        flue: { type: Number, required: true, default: 0 },
        medical: { type: Number, required: true, default: 0 },
        others: { type: Number, required: true, default: 0 },
      },
      gross: { type: Number },
      tax: { type: Number, default: 0 },
      deductions: { type: Number, default: 0 },
    },
    loanPF: {
      loan: { type: Number, default: 0 },
      pf: { type: Number, default: 0 },
    },
    leaveEntitlements: {
      casualLeave: { type: { total: Number, consumed: Number }, default: {} },
      sickLeave: { type: { total: Number, consumed: Number }, default: {} },
      annualLeave: { type: { total: Number, consumed: Number }, default: {} },
      maternityLeave: {
        type: { total: Number, consumed: Number },
        default: {},
      },
      paternityLeave: {
        type: { total: Number, consumed: Number },
        default: {},
      },
    },
    position: { type: String, required: true },
    ownerName: {
      type: String,
      required: function () {
        return this.division === "Distributor";
      },
    },
    brickName: {
      type: String,
      required: function () {
        return this.division !== "Distributor";
      },
    },
  },
  {
    timestamps: true,
  },
);

const Admin: Model<IAdmin> = mongoose.model<IAdmin>("Admin", adminSchema);

export default Admin;
