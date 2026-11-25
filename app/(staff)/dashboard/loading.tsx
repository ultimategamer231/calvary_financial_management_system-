import styles from "./dashboard.module.css";

export default function Loading() {
  return (
    <div className={styles.dashboard}>
      <div className={styles.heading}>
        <div><h1>Dashboard</h1><p role="status">Loading financial records…</p></div>
      </div>
      <div className={styles.loadingBlocks} aria-hidden="true"><div /><div /></div>
    </div>
  );
}
