/* eslint-disable @typescript-eslint/no-explicit-any */
import { IComment } from './comment.interface';
import Comment from './comment.model';
import { JwtPayload } from 'jsonwebtoken';
import { USER_ROLE } from '../user/user.constant';

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

const CommentServices = { createComment };
export default CommentServices;
