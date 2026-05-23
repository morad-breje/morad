# CPU Scheduling Simulator

CPU Scheduling Simulator is a Flask-based web application that simulates and compares common operating system CPU scheduling algorithms. It helps users understand how scheduling affects waiting time, turnaround time, response time, and CPU utilization.

## Project Overview

This project was developed to demonstrate understanding of operating systems concepts, algorithm implementation, backend API design, and interactive web-based simulation.

## Supported Scheduling Algorithms

- First Come First Served (FCFS)
- Shortest Job First (SJF) - Non-preemptive
- Shortest Remaining Time First (SRTF)
- Priority Scheduling
- Round Robin (RR)

## Key Features

- Add multiple processes with arrival time, burst time, and priority
- Validate process inputs before simulation
- Simulate one selected scheduling algorithm
- Compare all supported algorithms together
- Display average waiting time, turnaround time, response time, and CPU utilization
- API-based backend using Flask
- Single-page interactive frontend

## Technologies Used

- Python
- Flask
- HTML5
- CSS3
- JavaScript
- Operating Systems Algorithms
- REST APIs

## Folder Structure

```text
cpu-scheduling-simulator/
├── app.py
├── scheduler.py
├── requirements.txt
├── templates/
│   └── index.html
└── static/
    ├── style.css
    └── script.js
```

## How to Run Locally

1. Clone the repository:

```bash
git clone https://github.com/YOUR-USERNAME/cpu-scheduling-simulator.git
cd cpu-scheduling-simulator
```

2. Create and activate a virtual environment:

```bash
python -m venv venv
venv\Scripts\activate
```

On macOS/Linux:

```bash
source venv/bin/activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Run the app:

```bash
python app.py
```

5. Open the app:

```text
http://localhost:5000
```

## API Endpoints

| Endpoint | Method | Description |
|---|---:|---|
| `/api/simulate` | POST | Runs one selected scheduling algorithm |
| `/api/compare` | POST | Runs all algorithms and returns comparison metrics |

## Example Request

```json
{
  "algorithm": "rr",
  "quantum": 2,
  "processes": [
    {"pid": "P1", "arrival": 0, "burst": 5, "priority": 1},
    {"pid": "P2", "arrival": 1, "burst": 3, "priority": 2}
  ]
}
```

## Screenshots

Add screenshots here after uploading the project to GitHub:

```text
/screenshots/simulator.png
/screenshots/comparison.png
```

## What I Learned

- Implementing CPU scheduling algorithms in Python
- Comparing algorithms using performance metrics
- Building Flask APIs for algorithm simulation
- Connecting backend logic to an interactive frontend
- Presenting academic concepts through a real software project

## Author

Morad Khalil  
Computer Science Student | Backend Developer | AI & Web Developer
