import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import {
    loginSchema,
    type LoginFormData,
} from '../schemas/loginSchema';
import {useAuth} from "../../../providers/AuthProvider.tsx";

interface LoginFormProps {
    onSuccess: () => void;
}

const LoginForm = ({ onSuccess }: LoginFormProps) => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [serverError, setServerError] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormData>({
        resolver: yupResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData) => {
        setServerError('');

        try {
            const user = await login(data);
            onSuccess();
            navigate(`/user/${user.id}`);
        } catch (error) {
            setServerError(
                error instanceof Error ? error.message : 'Something went wrong',
            );
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="login-form">
            <div className="login-form__field">
                <label htmlFor="login">Login</label>
                <input
                    id="login"
                    type="text"
                    placeholder="Email or username"
                    {...register('login')}
                />
                {errors.login && <span>{errors.login.message}</span>}
            </div>

            <div className="login-form__field">
                <label htmlFor="password">Password</label>
                <input
                    id="password"
                    type="password"
                    placeholder="Password"
                    {...register('password')}
                />
                {errors.password && <span>{errors.password.message}</span>}
            </div>

            {serverError && (
                <p className="login-form__error">{serverError}</p>
            )}

            <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Logging in...' : 'Login'}
            </button>
        </form>
    );
};

export default LoginForm;
