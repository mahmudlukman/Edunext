import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import config from "../config";

export enum UserRole {
  ADMIN = "admin",
  TEACHER = "teacher",
  STUDENT = "student",
  PARENT = "parent",
}

export type userRoles = "admin" | "teacher" | "student" | "parent";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: userRoles;
  isActive: boolean;
  studentClass?: string | null;
  teacherSubject?: string[] | null;
  resetPasswordToken?: string;
  resetPasswordTime?: Date;
  getJwtToken(): string;
  getRefreshToken(): string;
  comparePassword(enteredPassword: string): Promise<boolean>;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
      default: UserRole.STUDENT,
    },
    isActive: { type: Boolean, default: true },
    studentClass: { type: mongoose.Schema.Types.ObjectId, ref: "Class" },
    teacherSubject: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subject" }],
    resetPasswordToken: { type: String },
    resetPasswordTime: { type: Date },
  },
  {
    timestamps: true,
  },
);

// Hash password
UserSchema.pre<IUser>("save", async function () {
  if (!this.isModified("password")) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// JWT token
UserSchema.methods.getJwtToken = function (): string {
  return jwt.sign({ id: this._id }, config.JWT_SECRET_KEY as string, {
    expiresIn: config.JWT_EXPIRES || "15m",
  });
};

// JWT Refresh Token (long-lived)
UserSchema.methods.getRefreshToken = function (): string {
  return jwt.sign({ id: this._id }, config.REFRESH_TOKEN_SECRET as string, {
    expiresIn: config.REFRESH_TOKEN_EXPIRES || "7d", // Long-lived: 7 days
  });
};

// Compare password
UserSchema.methods.comparePassword = async function (
  enteredPassword: string,
): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model<IUser>("User", UserSchema);
export default User;
