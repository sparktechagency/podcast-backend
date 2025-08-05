import { z } from "zod";

export const updateBookmarkData = z.object({
    body: z.object({
        name: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
    }),
});

const BookmarkValidations = { updateBookmarkData };
export default BookmarkValidations;