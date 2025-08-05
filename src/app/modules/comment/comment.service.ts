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
        podcast: comment.podcast,
    };
    const result = await Comment.create(replyData);
    return result;
};

const updateComment = async (
    user: JwtPayload,
    id: string,
    payload: Partial<IComment>
) => {
    const result = await Comment.findOneAndUpdate(
        { _id: id, commentor: user.profileId },
        payload,
        { new: true, runValidators: true }
    );
    if (!result) {
        throw new AppError(
            404,
            'Comment not found or you are not authorized to update this comment'
        );
    }
    return result;
};

const deleteComment = async (profileId: string, id: string) => {
    const result = await Comment.findOneAndDelete({
        _id: id,
        commentor: profileId,
    });
    if (!result) {
        throw new AppError(
            404,
            'Comment not found or you are not authorized to update this comment'
        );
    }
    return result;
};

const CommentServices = {
    createComment,
    createReply,
    updateComment,
    deleteComment,
};
export default CommentServices;
