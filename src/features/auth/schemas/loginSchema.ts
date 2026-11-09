import * as yup from 'yup';

export const loginSchema = yup.object({
    login: yup
        .string()
        .required('Login is required'),

    password: yup
        .string()
        .required('Password is required')
        .min(6, 'Password must be at least 6 characters'),
});

export type LoginFormData = yup.InferType<typeof loginSchema>;