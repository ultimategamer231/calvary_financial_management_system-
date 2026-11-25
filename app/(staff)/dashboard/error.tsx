"use client";

import styles from "./dashboard.module.css";

export default function DashboardError() {
  return (
    <div className={styles.dashboard}>
      <h1>Dashboard</h1>
      <div className={styles.alert} role="alert">
        <h2>Financial records unavailable</h2>
        <p>Your report could not be loaded. Try this reporting period again.</p>
        <button onClick={() => window.location.reload()}>Try again</button>
      </div>
    </div>
  );
}
