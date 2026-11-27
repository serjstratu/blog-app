import * as yup from 'yup';

export const registerSchema = yup.object({
    name: yup.string().trim().required('Name is required'),
    username: yup.string().trim().required('Username is required'),
    email: yup.string().trim().email('Enter a valid email').required('Email is required'),
    password: yup.string().required('Password is required').min(8, 'Password must be at least 8 characters'),
});

export type RegisterFormData = yup.InferType<typeof registerSchema>;
