import LoginForm from './LoginForm';
import './loginModal.css';

interface LoginModalProps {
    onClose: () => void;
}

const LoginModal = ({ onClose }: LoginModalProps) => {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="login-modal"
                onClick={(event) => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="login-title"
            >
                <button
                    type="button"
                    className="login-modal__close"
                    onClick={onClose}
                    aria-label="Close"
                >
                    ×
                </button>

                <h2 id="login-title">Welcome back</h2>
                <p>Sign in to your account</p>

                <LoginForm onSuccess={onClose} />
            </div>
        </div>
    );
};

export default LoginModal;