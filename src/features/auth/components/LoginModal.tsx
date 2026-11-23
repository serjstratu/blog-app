import LoginForm from './LoginForm';
import './loginModal.css';

interface LoginModalProps {
    onClose: () => void;
}

const LoginModal = ({ onClose }: LoginModalProps) => {
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

                <h2 id="login-title" data-testid="login-modal-title">Welcome back</h2>
                <p data-testid="login-modal-description">Sign in to your account</p>

                <LoginForm onSuccess={onClose} />
            </div>
        </div>
    );
};

export default LoginModal;
