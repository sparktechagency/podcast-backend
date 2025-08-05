import { z } from "zod";

export const updateCommentData = z.object({
    body: z.object({
        name: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
    }),
});

const CommentValidations = { updateCommentData };
export default CommentValidations;