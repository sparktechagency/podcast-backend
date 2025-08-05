import { Schema, model } from 'mongoose';
import { TUser, UserModel } from './user.interface';
// import config from '../../config';
import bcrypt from 'bcrypt';
import config from '../../config';
import redis from '../../utilities/redisClient';

const userSchema = new Schema<TUser>(
    {
        profileId: {
            type: String,
            default: null,
        },
        email: {
            type: String,
            // required: true,
            // unique: true,
            default: '',
        },
        password: {
            type: String,
        },
        role: {
            type: String,
            enum: ['user', 'creator', 'superAdmin', 'admin'],
            required: true,
        },
        isBlocked: {
            type: Boolean,
            default: false,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        verifyCode: {
            type: Number,
        },
        resetCode: {
            type: Number,
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        isResetVerified: {
            type: Boolean,
            default: false,
        },
        codeExpireIn: {
            type: Date,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        appleId: {
            type: String,
        },
        googleId: {
            type: String,
        },
        passwordChangedAt: {
            type: Date,
        },
        isRegistrationCompleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// userSchema.pre('save', async function (next) {
//     // eslint-disable-next-line @typescript-eslint/no-this-alias
//     const user = this;
//     user.password = await bcrypt.hash(
//         user.password,
//         Number(config.bcrypt_salt_rounds)
//     );
//     next();
// });

userSchema.post('save', function (doc, next) {
    doc.password = '';
    next();
});
// statics method for check is user exists
userSchema.statics.isUserExists = async function (phoneNumber: string) {
    return await User.findOne({ phoneNumber }).select('+password');
};
// statics method for check password match  ----
userSchema.statics.isPasswordMatched = async function (
    plainPasswords: string,
    hashPassword: string
) {
    return await bcrypt.compare(plainPasswords, hashPassword);
};
userSchema.pre('save', async function (next) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const user = this;
    if (user.password) {
        user.password = await bcrypt.hash(
            user.password,
            Number(config.bcrypt_salt_rounds)
        );
    }
    next();
});

userSchema.statics.isJWTIssuedBeforePasswordChange = async function (
    passwordChangeTimeStamp,
    jwtIssuedTimeStamp
) {
    const passwordChangeTime =
        new Date(passwordChangeTimeStamp).getTime() / 1000;

    return passwordChangeTime > jwtIssuedTimeStamp;
};

const deleteAllCreatorCache = async () => {
    const keys = await redis.keys('all-creators:*');
    if (keys.length > 0) {
        await redis.del(...keys);
    }
};
userSchema.post('save', deleteAllCreatorCache);
userSchema.post('findOneAndUpdate', deleteAllCreatorCache);
userSchema.post('findOneAndDelete', deleteAllCreatorCache);
userSchema.post('deleteOne', deleteAllCreatorCache);
userSchema.post('deleteMany', deleteAllCreatorCache);

export const User = model<TUser, UserModel>('User', userSchema);
