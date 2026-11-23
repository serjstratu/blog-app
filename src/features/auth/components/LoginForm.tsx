import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

import {
    loginSchema,
    type LoginFormData,
} from '../schemas/loginSchema';
import { useAuth } from '../../../providers/AuthProvider.tsx';

interface LoginFormProps {
    onSuccess: () => void;
}

const LoginForm = ({ onSuccess }: LoginFormProps) => {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [serverError, setServerError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

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
        <form onSubmit={handleSubmit(onSubmit)} className="login-form" data-testid="login-form">

            <div className="login-form__field">
                <label htmlFor="login">Login</label>
                <input
                    id="login"
                    type="text"
                    placeholder="Email or username"
                    data-testid="login-input"
                    {...register('login')}
                />
                {errors.login && <span>{errors.login.message}</span>}
            </div>

            <div className="login-form__field">
                <label htmlFor="password">Password</label>

                <div className="login-form__password">
                    <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        data-testid="password-input"
                        {...register('password')}
                    />

                    <button
                        type="button"
                        className="login-form__password-toggle"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        aria-pressed={showPassword}
                        data-testid="password-toggle"
                    >
                        <FontAwesomeIcon
                            icon={showPassword ? faEyeSlash : faEye}
                        />
                    </button>
                </div>

                {errors.password && <span>{errors.password.message}</span>}
            </div>

            {serverError && (
                <p className="login-form__error" data-testid="login-server-error">{serverError}</p>
            )}

            <button type="submit" disabled={isSubmitting} data-testid="login-submit">
                {isSubmitting ? 'Logging in...' : 'Login'}
            </button>
        </form>
    );
};

export default LoginForm;