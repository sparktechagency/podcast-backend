/* eslint-disable @typescript-eslint/no-explicit-any */
import { IComment } from './comment.interface';
import Comment from './comment.model';
import { JwtPayload } from 'jsonwebtoken';
import { USER_ROLE } from '../user/user.constant';
import AppError from '../../error/appError';

const createComment = async (user: JwtPayload, payload: Partial<IComment>) => {
    const commentData: any = {
        ...payload,
        commentor: user.profileId,
        commentorType:
            user.role == USER_ROLE.creator ? 'Creator' : 'NormalUser',
        likers: [],
    };
    const result = await Comment.create(commentData);
    return result;
};

const createReply = async (user: JwtPayload, payload: IComment) => {
    const comment = await Comment.findById(payload.parent);
    if (!comment) {
        throw new AppError(404, 'Parent comment not found');
    }
    const replyData: any = {
        ...payload,
        commentor: user.profileId,
        commentorType:
            user.role == USER_ROLE.creator ? 'Creator' : 'NormalUser',
        likers: [],
    };
    const result = await Comment.create(replyData);
    return result;
};

const CommentServices = { createComment, createReply };
export default CommentServices;
