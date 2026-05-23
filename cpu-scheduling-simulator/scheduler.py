"""CPU scheduling algorithms and metric calculation utilities.

Each scheduler returns a normalized payload used by the Flask API:
{
    "algorithm": str,
    "processes": [ ... per-process metrics ... ],
    "gantt": [ ... timeline segments ... ],
    "averages": { ... },
    "cpu_utilization": float,
    "total_time": int
}
"""
from __future__ import annotations

from collections import deque
from copy import deepcopy
from typing import Dict, List, Tuple

Process = Dict[str, int | str]
Segment = Dict[str, int | str]


def _normalize_processes(processes: List[Process]) -> List[Process]:
    """Return a copied and type-safe process list sorted by arrival then PID."""
    normalized = []
    for p in processes:
        normalized.append(
            {
                "pid": str(p["pid"]).strip(),
                "arrival": int(p["arrival"]),
                "burst": int(p["burst"]),
                "priority": int(p.get("priority", 0)),
            }
        )
    return sorted(normalized, key=lambda x: (int(x["arrival"]), str(x["pid"])))


def _merge_gantt(gantt: List[Segment]) -> List[Segment]:
    """Merge adjacent timeline segments that belong to the same process."""
    if not gantt:
        return []

    merged = [deepcopy(gantt[0])]
    for seg in gantt[1:]:
        last = merged[-1]
        if last["pid"] == seg["pid"] and last["end"] == seg["start"]:
            last["end"] = seg["end"]
        else:
            merged.append(deepcopy(seg))
    return merged


def _calculate_metrics(processes: List[Process], gantt: List[Segment], algorithm: str) -> Dict:
    """Compute waiting, turnaround, response, completion, averages, and CPU utilization."""
    by_pid = {str(p["pid"]): p for p in processes}
    first_start: Dict[str, int] = {}
    completion: Dict[str, int] = {}
    busy_time = 0

    for seg in gantt:
        pid = str(seg["pid"])
        start = int(seg["start"])
        end = int(seg["end"])
        if pid != "Idle":
            busy_time += end - start
            first_start.setdefault(pid, start)
            completion[pid] = end

    result_processes = []
    for pid, p in by_pid.items():
        arrival = int(p["arrival"])
        burst = int(p["burst"])
        finish = completion.get(pid, arrival)
        turnaround = finish - arrival
        waiting = turnaround - burst
        response = first_start.get(pid, arrival) - arrival

        result_processes.append(
            {
                "pid": pid,
                "arrival": arrival,
                "burst": burst,
                "priority": int(p["priority"]),
                "completion": finish,
                "turnaround": turnaround,
                "waiting": waiting,
                "response": response,
            }
        )

    result_processes.sort(key=lambda x: x["pid"])
    n = len(result_processes) or 1
    total_time = max((int(seg["end"]) for seg in gantt), default=0)
    first_time = min((int(seg["start"]) for seg in gantt), default=0)
    elapsed = max(total_time - first_time, 1)

    return {
        "algorithm": algorithm,
        "processes": result_processes,
        "gantt": _merge_gantt(gantt),
        "averages": {
            "waiting": round(sum(p["waiting"] for p in result_processes) / n, 2),
            "turnaround": round(sum(p["turnaround"] for p in result_processes) / n, 2),
            "response": round(sum(p["response"] for p in result_processes) / n, 2),
        },
        "cpu_utilization": round((busy_time / elapsed) * 100, 2),
        "total_time": total_time,
    }


def fcfs(processes: List[Process]) -> Dict:
    """First-Come, First-Served scheduling."""
    procs = _normalize_processes(processes)
    time = 0
    gantt: List[Segment] = []

    for p in procs:
        arrival = int(p["arrival"])
        burst = int(p["burst"])
        if time < arrival:
            gantt.append({"pid": "Idle", "start": time, "end": arrival})
            time = arrival
        gantt.append({"pid": p["pid"], "start": time, "end": time + burst})
        time += burst

    return _calculate_metrics(procs, gantt, "FCFS")


def sjf_non_preemptive(processes: List[Process]) -> Dict:
    """Shortest Job First, non-preemptive."""
    procs = _normalize_processes(processes)
    remaining = procs[:]
    time = 0
    gantt: List[Segment] = []

    while remaining:
        available = [p for p in remaining if int(p["arrival"]) <= time]
        if not available:
            next_arrival = min(int(p["arrival"]) for p in remaining)
            gantt.append({"pid": "Idle", "start": time, "end": next_arrival})
            time = next_arrival
            continue

        current = min(available, key=lambda p: (int(p["burst"]), int(p["arrival"]), str(p["pid"])))
        remaining.remove(current)
        burst = int(current["burst"])
        gantt.append({"pid": current["pid"], "start": time, "end": time + burst})
        time += burst

    return _calculate_metrics(procs, gantt, "SJF Non-Preemptive")


def srtf(processes: List[Process]) -> Dict:
    """Shortest Remaining Time First, preemptive SJF."""
    procs = _normalize_processes(processes)
    remaining_time = {str(p["pid"]): int(p["burst"]) for p in procs}
    completed = 0
    time = 0
    n = len(procs)
    gantt: List[Segment] = []

    while completed < n:
        available = [p for p in procs if int(p["arrival"]) <= time and remaining_time[str(p["pid"])] > 0]
        if not available:
            future_arrivals = [int(p["arrival"]) for p in procs if remaining_time[str(p["pid"])] > 0]
            next_time = min(future_arrivals)
            gantt.append({"pid": "Idle", "start": time, "end": next_time})
            time = next_time
            continue

        current = min(
            available,
            key=lambda p: (remaining_time[str(p["pid"])], int(p["arrival"]), str(p["pid"])),
        )
        pid = str(current["pid"])
        gantt.append({"pid": pid, "start": time, "end": time + 1})
        remaining_time[pid] -= 1
        time += 1

        if remaining_time[pid] == 0:
            completed += 1

    return _calculate_metrics(procs, gantt, "SRTF Preemptive")


def priority_scheduling(processes: List[Process]) -> Dict:
    """Non-preemptive priority scheduling. Lower priority number means higher priority."""
    procs = _normalize_processes(processes)
    remaining = procs[:]
    time = 0
    gantt: List[Segment] = []

    while remaining:
        available = [p for p in remaining if int(p["arrival"]) <= time]
        if not available:
            next_arrival = min(int(p["arrival"]) for p in remaining)
            gantt.append({"pid": "Idle", "start": time, "end": next_arrival})
            time = next_arrival
            continue

        current = min(
            available,
            key=lambda p: (int(p["priority"]), int(p["arrival"]), str(p["pid"])),
        )
        remaining.remove(current)
        burst = int(current["burst"])
        gantt.append({"pid": current["pid"], "start": time, "end": time + burst})
        time += burst

    return _calculate_metrics(procs, gantt, "Priority Scheduling")


def round_robin(processes: List[Process], quantum: int) -> Dict:
    """Round Robin scheduling with configurable time quantum."""
    if quantum <= 0:
        raise ValueError("Time quantum must be greater than 0.")

    procs = _normalize_processes(processes)
    remaining_time = {str(p["pid"]): int(p["burst"]) for p in procs}
    arrivals = sorted(procs, key=lambda p: (int(p["arrival"]), str(p["pid"])))
    queue: deque[Process] = deque()
    gantt: List[Segment] = []
    time = 0
    index = 0
    completed = 0
    n = len(procs)

    while completed < n:
        while index < n and int(arrivals[index]["arrival"]) <= time:
            queue.append(arrivals[index])
            index += 1

        if not queue:
            next_arrival = int(arrivals[index]["arrival"])
            gantt.append({"pid": "Idle", "start": time, "end": next_arrival})
            time = next_arrival
            continue

        current = queue.popleft()
        pid = str(current["pid"])
        run_time = min(quantum, remaining_time[pid])
        gantt.append({"pid": pid, "start": time, "end": time + run_time})
        time += run_time
        remaining_time[pid] -= run_time

        while index < n and int(arrivals[index]["arrival"]) <= time:
            queue.append(arrivals[index])
            index += 1

        if remaining_time[pid] > 0:
            queue.append(current)
        else:
            completed += 1

    return _calculate_metrics(procs, gantt, f"Round Robin (q={quantum})")


def simulate(processes: List[Process], algorithm: str, quantum: int = 2) -> Dict:
    """Route a simulation request to the selected scheduling algorithm."""
    algorithm = algorithm.lower().strip()
    if algorithm == "fcfs":
        return fcfs(processes)
    if algorithm == "sjf":
        return sjf_non_preemptive(processes)
    if algorithm == "srtf":
        return srtf(processes)
    if algorithm == "priority":
        return priority_scheduling(processes)
    if algorithm == "rr":
        return round_robin(processes, quantum)
    raise ValueError(f"Unsupported algorithm: {algorithm}")


def compare_all(processes: List[Process], quantum: int = 2) -> List[Dict]:
    """Run all supported algorithms and return summary-friendly results."""
    return [
        fcfs(processes),
        sjf_non_preemptive(processes),
        srtf(processes),
        priority_scheduling(processes),
        round_robin(processes, quantum),
    ]
