import { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import './loginModal.css';

interface LoginModalProps {
    onClose: () => void;
}

const LoginModal = ({ onClose }: LoginModalProps) => {
    const [mode, setMode] = useState<'login' | 'register'>('login');
    return (
        <div className="modal-overlay" data-testid="login-modal-overlay" onClick={onClose}>
            <div
                className="login-modal"
                onClick={(event) => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="login-title"
                data-testid="login-modal"
            >
                <button
                    type="button"
                    className="login-modal__close"
                    onClick={onClose}
                    aria-label="Close"
                    data-testid="login-modal-close"
                >
                    ×
                </button>

                <h2 id="login-title" data-testid="login-modal-title">
                    {mode === 'login' ? 'Welcome back' : 'Create your account'}
                </h2>
                <p data-testid="login-modal-description">
                    {mode === 'login' ? 'Sign in to your account' : 'Join the community'}
                </p>

                {mode === 'login'
                    ? <LoginForm onSuccess={onClose} />
                    : <RegisterForm onSuccess={onClose} />}

                <p className="login-modal__switch">
                    {mode === 'login' ? 'New here?' : 'Already have an account?'}{' '}
                    <button
                        type="button"
                        onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                        data-testid="auth-mode-toggle"
                    >
                        {mode === 'login' ? 'Create an account' : 'Log in'}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default LoginModal;
