/**
 * @copyright 2026 oghenemine emmanuel
 * @license Apache-2.0
 */

import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser {
    username: string,
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    avatar?: string | null;
    createdAt: Date;
    updatedAt: Date;
    twoFactorAuthEnabled: boolean;
    twoFactorAuthSecret?: string | null;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
    {
        username: {
            type: String,
            required: [true, 'Username is required'],
            maxLength: [20, 'Username must be less than 20 characters'],
            unique: [true, 'Username must be unique'],
            lowercase: true,
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            maxLength: [50, 'Email must be less than 50 characters'],
            unique: [true, 'Email must be unique'],
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            select: false,
        },
        firstName: {
            type: String,
            maxLength: [20, 'First name must be less than 20 characters'],
        },
        lastName: {
            type: String,
            maxLength: [20, 'Last name must be less than 20 characters'],
        },
        avatar: {
            type: String,
            default: null,
        },
        twoFactorAuthEnabled: {
            type: Boolean,
            default: false,
        },
        twoFactorAuthSecret: {
            type: String,
            default: null,
        }
    },
    {
        timestamps: true,
    }
);

userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }

    // Hash the password
    this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (
    candidatePassword: string
): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

export default model<IUser>('User', userSchema);