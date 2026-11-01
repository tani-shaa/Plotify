"""
Anomaly detection service — uses Isolation Forest (scikit-learn) to flag
suspicious property transfer patterns.

Features used per property:
  • transfer_count    — total number of transfers
  • days_since_reg    — days between registration and most recent transfer
  • avg_days_between  — average days between consecutive transfers (0 if only 1 transfer)

A property is flagged when its Isolation Forest score = -1 (anomaly).
"""
from __future__ import annotations

import sqlite3
from datetime import datetime, timezone
from typing import List, Dict, Any

import pandas as pd
from sklearn.ensemble import IsolationForest


def _load_transfer_data(db_path: str) -> pd.DataFrame:
    """
    Query the SQLite database and build a per-property feature DataFrame.
    Returns an empty DataFrame if there is not enough data.
    """
    conn = sqlite3.connect(db_path)

    properties_df = pd.read_sql_query(
        "SELECT id, registered_at FROM properties",
        conn,
        parse_dates=["registered_at"],
    )

    transfers_df = pd.read_sql_query(
        "SELECT property_id, requested_at FROM transfers WHERE status = 'approved'",
        conn,
        parse_dates=["requested_at"],
    )

    conn.close()

    if properties_df.empty:
        return pd.DataFrame()

    # Aggregate transfer counts per property
    if not transfers_df.empty:
        agg = transfers_df.groupby("property_id").agg(
            transfer_count=("requested_at", "count"),
            last_transfer=("requested_at", "max"),
            first_transfer=("requested_at", "min"),
        ).reset_index()
        agg.rename(columns={"property_id": "id"}, inplace=True)
        df = properties_df.merge(agg, on="id", how="left")
    else:
        df = properties_df.copy()
        df["transfer_count"] = 0
        df["last_transfer"]  = pd.NaT
        df["first_transfer"] = pd.NaT

    df["transfer_count"] = df["transfer_count"].fillna(0).astype(int)

    now = datetime.now(timezone.utc)

    def _days(dt):
        if pd.isna(dt):
            return 0.0
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return max((now - dt).days, 0)

    df["days_since_reg"] = df["registered_at"].apply(_days)

    # Average interval between transfers
    def _avg_interval(row):
        if row["transfer_count"] <= 1:
            return 0.0
        first = row["first_transfer"]
        last  = row["last_transfer"]
        if pd.isna(first) or pd.isna(last):
            return 0.0
        if first.tzinfo is None:
            first = first.replace(tzinfo=timezone.utc)
        if last.tzinfo is None:
            last = last.replace(tzinfo=timezone.utc)
        total_days = max((last - first).days, 1)
        return total_days / (row["transfer_count"] - 1)

    df["avg_days_between"] = df.apply(_avg_interval, axis=1)

    return df


def detect_anomalies(db_path: str, contamination: float = 0.1) -> List[Dict[str, Any]]:
    """
    Run Isolation Forest over property transfer features and return a list of
    anomalous property records.

    Args:
        db_path:      Filesystem path to the SQLite database.
        contamination: Expected fraction of anomalies (0.0–0.5). Default 10 %.

    Returns:
        List of dicts with keys: property_id, transfer_count, days_since_reg,
        avg_days_between, anomaly_score.
        Returns empty list if there are fewer than 5 properties (not enough data).
    """
    df = _load_transfer_data(db_path)

    if df.empty or len(df) < 5:
        return []

    features = df[["transfer_count", "days_since_reg", "avg_days_between"]].values

    clf = IsolationForest(
        n_estimators=100,
        contamination=contamination,
        random_state=42,
    )
    clf.fit(features)

    df["_label"]  = clf.predict(features)           # -1 = anomaly, 1 = normal
    df["_score"]  = clf.score_samples(features)     # lower = more anomalous

    anomalies = df[df["_label"] == -1]

    result = []
    for _, row in anomalies.iterrows():
        result.append({
            "property_id":      int(row["id"]),
            "transfer_count":   int(row["transfer_count"]),
            "days_since_reg":   float(row["days_since_reg"]),
            "avg_days_between": float(row["avg_days_between"]),
            "anomaly_score":    round(float(row["_score"]), 4),
        })

    # Sort by most anomalous first
    result.sort(key=lambda x: x["anomaly_score"])
    return result
