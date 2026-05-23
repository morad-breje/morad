/* Frontend controller for the CPU Scheduling Simulator. */
const processRows = document.getElementById("processRows");
const algorithmSelect = document.getElementById("algorithm");
const quantumGroup = document.getElementById("quantumGroup");
const quantumInput = document.getElementById("quantum");
const errorBox = document.getElementById("errorBox");
const ganttChart = document.getElementById("ganttChart");
const metricsRows = document.getElementById("metricsRows");
const compareSection = document.getElementById("compareSection");
const compareRows = document.getElementById("compareRows");
const resultTitle = document.getElementById("resultTitle");

const palette = ["#4f46e5", "#06b6d4", "#22c55e", "#f97316", "#ec4899", "#8b5cf6", "#14b8a6", "#eab308", "#ef4444"];

function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.add("show");
}

function clearError() {
  errorBox.textContent = "";
  errorBox.classList.remove("show");
}

function addProcessRow(process = {}) {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td><input class="pid" value="${process.pid ?? `P${processRows.children.length + 1}`}" /></td>
    <td><input class="arrival" type="number" min="0" value="${process.arrival ?? 0}" /></td>
    <td><input class="burst" type="number" min="1" value="${process.burst ?? 1}" /></td>
    <td><input class="priority" type="number" min="0" value="${process.priority ?? 1}" /></td>
    <td><button class="remove-btn" type="button">✕</button></td>
  `;
  row.querySelector(".remove-btn").addEventListener("click", () => {
    if (processRows.children.length > 1) row.remove();
  });
  processRows.appendChild(row);
}

function collectProcesses() {
  const rows = [...processRows.querySelectorAll("tr")];
  const processes = rows.map(row => ({
    pid: row.querySelector(".pid").value.trim(),
    arrival: Number(row.querySelector(".arrival").value),
    burst: Number(row.querySelector(".burst").value),
    priority: Number(row.querySelector(".priority").value),
  }));

  const ids = new Set();
  for (const p of processes) {
    if (!p.pid) throw new Error("Every process needs a Process ID.");
    if (ids.has(p.pid)) throw new Error(`Duplicate Process ID: ${p.pid}.`);
    ids.add(p.pid);
    if (!Number.isInteger(p.arrival) || p.arrival < 0) throw new Error(`${p.pid}: arrival must be a non-negative integer.`);
    if (!Number.isInteger(p.burst) || p.burst <= 0) throw new Error(`${p.pid}: burst must be a positive integer.`);
    if (!Number.isInteger(p.priority) || p.priority < 0) throw new Error(`${p.pid}: priority must be a non-negative integer.`);
  }
  return processes;
}

async function postJSON(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
}

function colorForPid(pid) {
  if (pid === "Idle") return "#94a3b8";
  let hash = 0;
  for (const char of pid) hash = char.charCodeAt(0) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

function renderGantt(gantt) {
  if (!gantt || gantt.length === 0) {
    ganttChart.textContent = "No timeline available.";
    ganttChart.classList.add("empty-state");
    return;
  }

  ganttChart.classList.remove("empty-state");
  const total = Math.max(...gantt.map(seg => seg.end));
  const unit = Math.max(34, Math.min(70, 720 / Math.max(total, 1)));
  const width = Math.max(620, total * unit + 40);
  const height = 116;

  let blocks = "";
  let ticks = "";
  const seenTicks = new Set();

  gantt.forEach(seg => {
    const x = seg.start * unit + 20;
    const w = Math.max((seg.end - seg.start) * unit, 26);
    const fill = colorForPid(seg.pid);
    blocks += `
      <rect x="${x}" y="24" width="${w}" height="46" rx="12" fill="${fill}"></rect>
      <text x="${x + w / 2}" y="53" text-anchor="middle" fill="white" font-weight="800" font-size="13">${seg.pid}</text>
    `;
    [seg.start, seg.end].forEach(t => {
      if (!seenTicks.has(t)) {
        seenTicks.add(t);
        ticks += `<text x="${t * unit + 20}" y="96" text-anchor="middle" fill="currentColor" font-size="12" font-weight="700">${t}</text>`;
      }
    });
  });

  ganttChart.innerHTML = `
    <svg class="gantt-svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Gantt chart timeline">
      ${blocks}
      <line x1="20" y1="78" x2="${total * unit + 20}" y2="78" stroke="currentColor" stroke-opacity="0.2"></line>
      ${ticks}
    </svg>
  `;
}

function renderMetrics(result) {
  resultTitle.textContent = result.algorithm;
  document.getElementById("avgWaiting").textContent = result.averages.waiting;
  document.getElementById("avgTurnaround").textContent = result.averages.turnaround;
  document.getElementById("avgResponse").textContent = result.averages.response;
  document.getElementById("cpuUtil").textContent = `${result.cpu_utilization}%`;

  metricsRows.innerHTML = result.processes.map(p => `
    <tr>
      <td><strong>${p.pid}</strong></td>
      <td>${p.arrival}</td>
      <td>${p.burst}</td>
      <td>${p.priority}</td>
      <td>${p.completion}</td>
      <td>${p.turnaround}</td>
      <td>${p.waiting}</td>
      <td>${p.response}</td>
    </tr>
  `).join("");
  renderGantt(result.gantt);
}

async function simulate() {
  clearError();
  compareSection.classList.add("hidden");
  try {
    const payload = {
      processes: collectProcesses(),
      algorithm: algorithmSelect.value,
      quantum: Number(quantumInput.value),
    };
    const result = await postJSON("/api/simulate", payload);
    renderMetrics(result);
  } catch (err) {
    showError(err.message);
  }
}

async function compareAll() {
  clearError();
  try {
    const payload = {
      processes: collectProcesses(),
      quantum: Number(quantumInput.value),
    };
    const data = await postJSON("/api/compare", payload);
    compareRows.innerHTML = data.summary.map(r => `
      <tr>
        <td><strong>${r.algorithm}</strong></td>
        <td>${r.avg_waiting}</td>
        <td>${r.avg_turnaround}</td>
        <td>${r.avg_response}</td>
        <td>${r.cpu_utilization}%</td>
      </tr>
    `).join("");
    compareSection.classList.remove("hidden");
    renderMetrics(data.results[0]);
  } catch (err) {
    showError(err.message);
  }
}

function generateRandomProcesses() {
  clearAll(false);
  const count = Math.floor(Math.random() * 4) + 4;
  for (let i = 1; i <= count; i++) {
    addProcessRow({
      pid: `P${i}`,
      arrival: Math.floor(Math.random() * 7),
      burst: Math.floor(Math.random() * 9) + 1,
      priority: Math.floor(Math.random() * 5) + 1,
    });
  }
}

function clearAll(addDefault = true) {
  clearError();
  processRows.innerHTML = "";
  metricsRows.innerHTML = "";
  compareRows.innerHTML = "";
  compareSection.classList.add("hidden");
  resultTitle.textContent = "Simulation Results";
  document.getElementById("avgWaiting").textContent = "--";
  document.getElementById("avgTurnaround").textContent = "--";
  document.getElementById("avgResponse").textContent = "--";
  document.getElementById("cpuUtil").textContent = "--";
  ganttChart.textContent = "Run a simulation to see the timeline.";
  ganttChart.classList.add("empty-state");
  if (addDefault) {
    addProcessRow({ pid: "P1", arrival: 0, burst: 5, priority: 2 });
    addProcessRow({ pid: "P2", arrival: 1, burst: 3, priority: 1 });
    addProcessRow({ pid: "P3", arrival: 2, burst: 8, priority: 3 });
  }
}

algorithmSelect.addEventListener("change", () => {
  quantumGroup.style.display = algorithmSelect.value === "rr" ? "grid" : "none";
});
document.getElementById("addProcess").addEventListener("click", () => addProcessRow());
document.getElementById("simulateBtn").addEventListener("click", simulate);
document.getElementById("compareBtn").addEventListener("click", compareAll);
document.getElementById("randomBtn").addEventListener("click", generateRandomProcesses);
document.getElementById("clearBtn").addEventListener("click", () => clearAll(true));
document.getElementById("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("cpu-theme", document.body.classList.contains("dark") ? "dark" : "light");
});

if (localStorage.getItem("cpu-theme") === "dark") document.body.classList.add("dark");
algorithmSelect.dispatchEvent(new Event("change"));
clearAll(true);
