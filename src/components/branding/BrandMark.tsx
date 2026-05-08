import styles from './brand-mark.module.css';

export default function BrandMark({
  compact = false,
  subtitle = false,
}: {
  compact?: boolean;
  subtitle?: boolean;
}) {
  return (
    <div className={styles.logo}>
      <svg
        viewBox="0 0 160 90"
        aria-hidden="true"
        className={compact ? styles.logoMarkCompact : styles.logoMark}
      >
        <path d="M0 90 L40 0 L80 90 Z" fill="none" stroke="var(--tahoe-color-accent)" strokeWidth="10" strokeLinejoin="round" />
        <path d="M80 90 L120 0 L160 90 Z" fill="none" stroke="var(--tahoe-color-text-primary)" strokeWidth="10" strokeLinejoin="round" />
      </svg>
      <div className={styles.textWrap}>
        <span className={styles.wordmark}>
          tahoe<span className={styles.dot}>.</span>ai
        </span>
        {subtitle && <span className={styles.meta}>recruiter operating system</span>}
      </div>
    </div>
  );
}
