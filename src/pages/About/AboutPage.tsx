import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faReact,
    faPython,
} from '@fortawesome/free-brands-svg-icons';
import {
    faCode,
    faDatabase,
    faBolt,
    faVial,
    faLightbulb,
    faServer,
    faLaptopCode,
} from '@fortawesome/free-solid-svg-icons';

import './aboutPage.css';

const technologies = [
    { name: 'React', icon: faReact, color: '#61DAFB' },
    { name: 'TypeScript', icon: faCode, color: '#3178C6' },
    { name: 'Python', icon: faPython, color: '#3776AB' },
    { name: 'FastAPI', icon: faBolt, color: '#009688' },
    { name: 'PostgreSQL', icon: faDatabase, color: '#4169E1' },
    { name: 'Vitest', icon: faVial, color: '#FCC72B' },
];

const AboutPage = () => {
    return (
        <section className="about-page">
            <div className="about-page__header" data-testid="aboutPageHeader">
                <span className="about-page__eyebrow">
                    <FontAwesomeIcon icon={faLightbulb} />
                    About this project
                </span>

                <h1>
                    Learning, building & exploring <span>React</span>
                </h1>

                <p>
                    A personal project where I explore modern React features,
                    experiment with new technologies, and improve my
                    development skills through practical work.
                </p>
            </div>

            <div className="about-page__content" data-testid="aboutPageContent">
                <article className="about-page__card">
                    <div className="about-page__card-icon">
                        <FontAwesomeIcon icon={faLightbulb} />
                    </div>
                    <h2>Why this project?</h2>
                    <p>
                        My goal is to stay up to date with the React ecosystem
                        and get hands-on experience with the latest features,
                        patterns, and best practices. Instead of just reading
                        documentation, I prefer learning by building something
                        real.
                    </p>
                </article>

                <article className="about-page__card">
                    <div className="about-page__card-icon">
                        <FontAwesomeIcon icon={faLaptopCode} />
                    </div>
                    <h2>Frontend</h2>
                    <p>
                        The frontend is built with React and TypeScript,
                        using modern development tools and libraries.
                        I'm experimenting with React features, component
                        architecture, state management, and testing.
                    </p>
                </article>

                <article className="about-page__card">
                    <div className="about-page__card-icon">
                        <FontAwesomeIcon icon={faServer} />
                    </div>
                    <h2>Backend</h2>
                    <p>
                        The entire backend is developed by me using Python
                        and FastAPI. This includes building REST APIs,
                        implementing business logic, handling data, and
                        connecting the backend with the frontend.
                    </p>
                </article>

                <article className="about-page__card">
                    <div className="about-page__card-icon">
                        <FontAwesomeIcon icon={faCode} />
                    </div>
                    <h2>Built along the way</h2>
                    <p>
                        This is an evolving project. New features,
                        improvements, experiments, and ideas will be added
                        as I continue learning and developing it.
                    </p>
                </article>
            </div>

            <div className="about-page__stack">
                <div className="about-page__stack-header">
                    <h2>Technology stack</h2>
                    <p>Tools and technologies powering this project.</p>
                </div>

                <div className="about-page__technologies">
                    {technologies.map((technology) => (
                        <div
                            className="about-page__technology"
                            key={technology.name}
                        >
                            <FontAwesomeIcon
                                icon={technology.icon}
                                style={{ color: technology.color }}
                            />
                            <span>{technology.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default AboutPage;
