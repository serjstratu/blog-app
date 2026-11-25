import { Link } from 'react-router-dom';
import './breadcrumbs.css';

export interface BreadcrumbItem {
    label: string;
    to?: string;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
}

const Breadcrumbs = ({ items }: BreadcrumbsProps) => (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
        <ol className="breadcrumbs__list">
            {items.map((item, index) => {
                const isCurrent = index === items.length - 1 || !item.to;
                return (
                    <li className="breadcrumbs__item" key={`${item.label}-${index}`}>
                        {index > 0 && <span className="breadcrumbs__separator" aria-hidden="true">/</span>}
                        {isCurrent ? (
                            <span aria-current="page" data-testid="breadcrumb-current">{item.label}</span>
                        ) : (
                            <Link to={item.to!}>{item.label}</Link>
                        )}
                    </li>
                );
            })}
        </ol>
    </nav>
);

export default Breadcrumbs;
