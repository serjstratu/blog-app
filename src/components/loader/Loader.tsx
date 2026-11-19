import './loader.css';

interface LoaderProps {
    size?: 'small' | 'medium' | 'large';
    label?: string;
}

function Loader({size = 'medium', label}: LoaderProps) {
    return (
        <div
            className="neon-loader"
            data-size={size}
            role="status"
            aria-label={label || 'Loading'}
        >
            <div className="neon-loader__scene">
                <div className="neon-loader__orbit neon-loader__orbit--one">
                    <span />
                </div>

                <div className="neon-loader__orbit neon-loader__orbit--two">
                    <span />
                </div>

                <div className="neon-loader__orbit neon-loader__orbit--three">
                    <span />
                </div>

                <div className="neon-loader__core" />
            </div>

            {label && (
                <span className="neon-loader__label">{label}</span>
            )}
        </div>
    );
}

export default Loader;
