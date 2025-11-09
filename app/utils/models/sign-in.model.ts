import {z} from "zod/v4";


export const SignInSchema = z.object({
    profileEmail: z
        .email('Please provide a valid email address')
        .max(128, 'please provide a valid profileEmail (max 128 characters)'),
    profilePassword: z.string('Please provide a valid password')
        .min(8, 'password cannot be less than 8 characters')
        .max(32, 'password cannot be over 32 characters')
})

export type SignIn = z.infer<typeof SignInSchema>;
