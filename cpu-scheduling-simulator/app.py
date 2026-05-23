"""Flask API for the CPU Scheduling Simulator."""
from __future__ import annotations

from flask import Flask, jsonify, render_template, request

from scheduler import compare_all, simulate

app = Flask(__name__)


def validate_payload(data: dict) -> tuple[list[dict], str | None]:
    """Validate incoming process data and return a normalized process list."""
    processes = data.get("processes", [])
    if not isinstance(processes, list) or not processes:
        return [], "Please add at least one process."

    seen = set()
    normalized = []
    for idx, p in enumerate(processes, start=1):
        pid = str(p.get("pid", "")).strip()
        if not pid:
            return [], f"Process #{idx} is missing a Process ID."
        if pid in seen:
            return [], f"Duplicate Process ID found: {pid}."
        seen.add(pid)

        try:
            arrival = int(p.get("arrival"))
            burst = int(p.get("burst"))
            priority = int(p.get("priority", 0))
        except (TypeError, ValueError):
            return [], f"Process {pid} has invalid numeric values."

        if arrival < 0:
            return [], f"Process {pid} arrival time cannot be negative."
        if burst <= 0:
            return [], f"Process {pid} burst time must be greater than 0."
        if priority < 0:
            return [], f"Process {pid} priority cannot be negative."

        normalized.append({"pid": pid, "arrival": arrival, "burst": burst, "priority": priority})

    return normalized, None


@app.route("/")
def index():
    """Render the single-page simulator UI."""
    return render_template("index.html")


@app.post("/api/simulate")
def api_simulate():
    """Run a single selected scheduling algorithm."""
    data = request.get_json(silent=True) or {}
    processes, error = validate_payload(data)
    if error:
        return jsonify({"error": error}), 400

    algorithm = data.get("algorithm", "fcfs")
    quantum = int(data.get("quantum", 2) or 2)

    if algorithm == "rr" and quantum <= 0:
        return jsonify({"error": "Round Robin time quantum must be greater than 0."}), 400

    try:
        result = simulate(processes, algorithm, quantum)
        return jsonify(result)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400


@app.post("/api/compare")
def api_compare():
    """Run every algorithm and return comparison metrics."""
    data = request.get_json(silent=True) or {}
    processes, error = validate_payload(data)
    if error:
        return jsonify({"error": error}), 400

    quantum = int(data.get("quantum", 2) or 2)
    if quantum <= 0:
        return jsonify({"error": "Time quantum must be greater than 0."}), 400

    results = compare_all(processes, quantum)
    summary = [
        {
            "algorithm": r["algorithm"],
            "avg_waiting": r["averages"]["waiting"],
            "avg_turnaround": r["averages"]["turnaround"],
            "avg_response": r["averages"]["response"],
            "cpu_utilization": r["cpu_utilization"],
        }
        for r in results
    ]
    return jsonify({"results": results, "summary": summary})


if __name__ == "__main__":
    app.run(debug=True)
