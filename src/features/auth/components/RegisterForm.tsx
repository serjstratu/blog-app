import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { registerSchema, type RegisterFormData } from '../schemas/registerSchema';
import { useAuth } from '../../../providers/AuthProvider.tsx';

interface RegisterFormProps {
    onSuccess: () => void;
}

const RegisterForm = ({ onSuccess }: RegisterFormProps) => {
    const { register: registerUser } = useAuth();
    const navigate = useNavigate();
    const [serverError, setServerError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormData>({
        resolver: yupResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterFormData) => {
        setServerError('');
        try {
            const user = await registerUser(data);
            onSuccess();
            navigate(`/user/${user.id}`);
        } catch (error) {
            setServerError(error instanceof Error ? error.message : 'Something went wrong');
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="login-form" data-testid="register-form">
            <div className="login-form__field">
                <label htmlFor="register-name">Name</label>
                <input id="register-name" autoComplete="name" placeholder="Your name" data-testid="register-name-input" {...register('name')} />
                {errors.name && <span>{errors.name.message}</span>}
            </div>
            <div className="login-form__field">
                <label htmlFor="register-username">Username</label>
                <input id="register-username" autoComplete="username" placeholder="Username" data-testid="register-username-input" {...register('username')} />
                {errors.username && <span>{errors.username.message}</span>}
            </div>
            <div className="login-form__field">
                <label htmlFor="register-email">Email</label>
                <input id="register-email" type="email" autoComplete="email" placeholder="Email address" data-testid="register-email-input" {...register('email')} />
                {errors.email && <span>{errors.email.message}</span>}
            </div>
            <div className="login-form__field">
                <label htmlFor="register-password">Password</label>
                <div className="login-form__password">
                    <input id="register-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="At least 8 characters" data-testid="register-password-input" {...register('password')} />
                    <button type="button" className="login-form__password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} data-testid="register-password-toggle">
                        <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                    </button>
                </div>
                {errors.password && <span>{errors.password.message}</span>}
            </div>
            {serverError && <p className="login-form__error" data-testid="register-server-error">{serverError}</p>}
            <button type="submit" disabled={isSubmitting} data-testid="register-submit">
                {isSubmitting ? 'Creating account...' : 'Create account'}
            </button>
        </form>
    );
};

export default RegisterForm;
