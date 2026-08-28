import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Upload, Cpu, BarChart3, Sparkles } from 'lucide-react';
import '../styles/home.css';

const csvRows = [
    ['date', 'region', 'revenue', 'units'],
    ['04-01', 'North', '12,480', '340'],
    ['04-02', 'South', '9,120', '266'],
    ['04-03', 'East', '15,760', '410'],
    ['04-04', 'West', '7,340', '198'],
];

const steps = [
    {
        num: '01',
        icon: Upload,
        title: 'Drop your CSV',
        body: 'Drag a raw export straight from your database, spreadsheet, or export tool. No formatting, no cleanup, no config.',
    },
    {
        num: '02',
        icon: Cpu,
        title: 'We parse it instantly',
        body: 'Column types, outliers, and missing values are detected automatically the moment the file lands.',
    },
    {
        num: '03',
        icon: BarChart3,
        title: 'Read the story',
        body: 'Trends, distributions, and anomalies are surfaced as charts you can actually act on, not just look at.',
    },
];

const stats = [
    { value: '2.1M+', label: 'rows parsed daily' },
    { value: '340ms', label: 'median parse time' },
    { value: '99.94%', label: 'field accuracy' },
    { value: '11k+', label: 'datasets analyzed' },
];

export default function Home({ onGetStarted }) {
    const [scrollY, setScrollY] = useState(0);
    const rafRef = useRef(null);

    useEffect(() => {
        const onScroll = () => {
            if (rafRef.current) return;
            rafRef.current = requestAnimationFrame(() => {
                setScrollY(window.scrollY);
                rafRef.current = null;
            });
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <div className="home">
            <div
                className="home-grid-field"
                style={{ transform: `translateY(${scrollY * 0.15}px)` }}
            />
            <div
                className="home-grid-field home-grid-field--far"
                style={{ transform: `translateY(${scrollY * 0.06}px)` }}
            />

            <nav className="home-nav">
                <div className="home-nav-brand">
                    <span className="home-nav-mark">IF</span>
                    InsightFlow
                </div>
                <div className="home-nav-links">
                    <a href="#how-it-works">How it works</a>
                    <a href="#proof">Numbers</a>
                </div>
                <button className="home-btn home-btn--ghost" onClick={onGetStarted}>
                    Go to dashboard
                </button>
            </nav>

            <header className="home-hero">
                <div className="home-hero-copy">
                    <span className="home-eyebrow">
                        <Sparkles size={14} />
                        CSV IN &rarr; INSIGHT OUT
                    </span>
                    <h1 className="home-headline">
                        Unlock insights from your data in <span className="home-headline-accent">seconds</span>.
                    </h1>
                    <p className="home-subhead">
                        Upload any CSV and InsightFlow parses, cleans, and charts it before your coffee
                        gets cold. No pipelines to build, no dashboards to configure, just the numbers
                        that matter, instantly readable.
                    </p>
                    <div className="home-hero-actions">
                        <button className="home-btn home-btn--primary" onClick={onGetStarted}>
                            Get started free
                            <ArrowRight size={18} />
                        </button>
                        <a href="#how-it-works" className="home-btn home-btn--text">
                            See how it works
                        </a>
                    </div>
                    <div className="home-hero-meta">No credit card &middot; Free for datasets under 50MB</div>
                </div>

                <div
                    className="home-hero-visual"
                    style={{ transform: `translateY(${scrollY * -0.08}px)` }}
                >
                    <div className="home-panel">
                        <div className="home-scanline" />
                        <div className="home-panel-header">
                            <span className="home-panel-dot" />
                            <span className="home-panel-dot" />
                            <span className="home-panel-dot" />
                            <span className="home-panel-filename">sales_q2.csv</span>
                        </div>
                        <div className="home-panel-body">
                            <div className="home-csv-rows">
                                {csvRows.map((row, i) => (
                                    <div
                                        className="home-csv-row"
                                        style={{ animationDelay: `${i * 0.35}s` }}
                                        key={i}
                                    >
                                        {row.map((cell, j) => (
                                            <span
                                                key={j}
                                                className={j === 0 ? 'home-csv-cell home-csv-cell--dim' : 'home-csv-cell'}
                                            >
                                                {cell}
                                            </span>
                                        ))}
                                    </div>
                                ))}
                            </div>
                            <div className="home-bars">
                                {[62, 41, 78, 35, 90].map((h, i) => (
                                    <div
                                        key={i}
                                        className="home-bar"
                                        style={{ '--bar-height': `${h}%`, animationDelay: `${1.6 + i * 0.12}s` }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="home-float-chip home-float-chip--a">Rows parsed: 12,450</div>
                    <div className="home-float-chip home-float-chip--b">Quality score 98.5%</div>
                </div>
            </header>

            <section className="home-stats" id="proof">
                {stats.map((s, i) => (
                    <div className="home-stat" key={i}>
                        <span className="home-stat-value">{s.value}</span>
                        <span className="home-stat-label">{s.label}</span>
                    </div>
                ))}
            </section>

            <section className="home-steps" id="how-it-works">
                <div className="home-section-head">
                    <span className="home-eyebrow">THE PIPELINE</span>
                    <h2>From raw file to real answer, in three steps.</h2>
                </div>
                <div className="home-steps-grid">
                    {steps.map((step, i) => {
                        const Icon = step.icon;
                        return (
                            <div className="home-step-card" key={i}>
                                <span className="home-step-num">{step.num}</span>
                                <div className="home-step-icon">
                                    <Icon size={22} />
                                </div>
                                <h3>{step.title}</h3>
                                <p>{step.body}</p>
                            </div>
                        );
                    })}
                </div>
            </section>

            <section className="home-cta-banner">
                <h2>Your next dataset is one drop away.</h2>
                <p>
                    Stop wrangling spreadsheets by hand. Let InsightFlow do the first pass so you can
                    start on the interesting part.
                </p>
                <button className="home-btn home-btn--primary home-btn--large" onClick={onGetStarted}>
                    Get started free
                    <ArrowRight size={18} />
                </button>
            </section>

            <footer className="home-footer">
                <span>&copy; {new Date().getFullYear()} InsightFlow</span>
                <span>Built for people who'd rather read a chart than a spreadsheet.</span>
            </footer>
        </div>
    );
}