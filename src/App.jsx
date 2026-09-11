import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, ChevronDown, Building2, Download, Upload, BarChart3 } from "lucide-react";
import * as XLSX from "xlsx";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

// ---------- Sample data (synthetic — for demo purposes) ----------

const INITIAL_EMPLOYEES = [
  { id: "e1", name: "Ahmed Al Farsi", role: "Site Engineer", initials: "AF" },
  { id: "e2", name: "Fatima Noor", role: "MEP Engineer", initials: "FN" },
  { id: "e3", name: "Rakesh Iyer", role: "Draftsman", initials: "RI" },
  { id: "e4", name: "Sara Haddad", role: "Interior Designer", initials: "SH" },
  { id: "e5", name: "Omar Youssef", role: "Procurement Officer", initials: "OY" },
  { id: "e6", name: "Priya Nair", role: "Architect", initials: "PN" },
  { id: "e7", name: "Khalid Rahimi", role: "Site Supervisor", initials: "KR" },
  { id: "e8", name: "Layla Mansour", role: "Project Manager", initials: "LM" },
];

const initials = (name) =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join("");

const INITIAL_PROJECTS = [
  { id: "p1", code: "VRB", name: "Villa Renovation", location: "Al Barsha" },
  { id: "p2", code: "RFA", name: "Retail Fitout", location: "Dubai Mall Annex" },
  { id: "p3", code: "WHJ", name: "Warehouse Extension", location: "JAFZA" },
  { id: "p4", code: "BOD", name: "Boutique Office", location: "DIFC" },
];

const codeFromName = (name, existingCodes) => {
  let base = name.trim().split(/\s+/).map((w) => w[0]).join("").toUpperCase().slice(0, 4) || "PRJ";
  let code = base;
  let n = 1;
  while (existingCodes.includes(code)) { n += 1; code = base + n; }
  return code;
};

const PHASES = ["Design", "Approvals", "Procurement", "Site Execution", "Handover"];
const STATUSES = ["Not Started", "In Progress", "In Review", "Blocked", "Done"];

const INITIAL_TASKS = [
  { id: "VRB-001", project: "p1", phase: "Design", title: "Finalize structural drawings", assignee: "e6", status: "In Progress", due: "Thu 11 Sep" },
  { id: "VRB-002", project: "p1", phase: "Design", title: "MEP layout coordination", assignee: "e2", status: "Not Started", due: "Mon 15 Sep" },
  { id: "VRB-003", project: "p1", phase: "Approvals", title: "Submit to Dubai Municipality", assignee: "e8", status: "Blocked", due: "Fri 12 Sep" },
  { id: "VRB-004", project: "p1", phase: "Procurement", title: "Tile & finishes quotation", assignee: "e5", status: "In Review", due: "Wed 17 Sep" },
  { id: "VRB-005", project: "p1", phase: "Site Execution", title: "Demolition — ground floor", assignee: "e7", status: "Done", due: "Mon 08 Sep" },

  { id: "RFA-001", project: "p2", phase: "Design", title: "Storefront concept revision", assignee: "e4", status: "In Review", due: "Fri 12 Sep" },
  { id: "RFA-002", project: "p2", phase: "Approvals", title: "Mall landlord sign-off", assignee: "e8", status: "In Progress", due: "Tue 16 Sep" },
  { id: "RFA-003", project: "p2", phase: "Procurement", title: "Joinery vendor selection", assignee: "e5", status: "Not Started", due: "Thu 18 Sep" },
  { id: "RFA-004", project: "p2", phase: "Site Execution", title: "Electrical first fix", assignee: "e1", status: "Blocked", due: "Mon 15 Sep" },

  { id: "WHJ-001", project: "p3", phase: "Design", title: "Steel structure drawings", assignee: "e6", status: "Done", due: "Fri 05 Sep" },
  { id: "WHJ-002", project: "p3", phase: "Approvals", title: "JAFZA civil defense approval", assignee: "e8", status: "In Progress", due: "Wed 10 Sep" },
  { id: "WHJ-003", project: "p3", phase: "Procurement", title: "Steel supplier PO", assignee: "e5", status: "In Progress", due: "Thu 11 Sep" },
  { id: "WHJ-004", project: "p3", phase: "Site Execution", title: "Foundation pour — Bay 3", assignee: "e7", status: "Not Started", due: "Mon 22 Sep" },
  { id: "WHJ-005", project: "p3", phase: "Site Execution", title: "Site safety audit", assignee: "e1", status: "Blocked", due: "Fri 12 Sep" },

  { id: "BOD-001", project: "p4", phase: "Design", title: "Workspace layout options", assignee: "e4", status: "In Progress", due: "Tue 16 Sep" },
  { id: "BOD-002", project: "p4", phase: "Design", title: "Lighting plan", assignee: "e3", status: "Not Started", due: "Fri 19 Sep" },
  { id: "BOD-003", project: "p4", phase: "Procurement", title: "Furniture package quote", assignee: "e5", status: "Not Started", due: "Wed 24 Sep" },
];

const employeeById = (list, id) => list.find((e) => e.id === id);
const projectById = (list, id) => list.find((p) => p.id === id);
const findEmployeeByText = (list, text) => {
  if (!text) return null;
  const t = text.toLowerCase();
  return (
    list.find((e) => e.name.toLowerCase() === t) ||
    list.find((e) => e.name.toLowerCase().includes(t) || t.includes(e.name.toLowerCase().split(" ")[0])) ||
    null
  );
};
const findProjectByText = (list, text) => {
  if (!text) return null;
  const t = text.toLowerCase();
  return (
    list.find((p) => p.code.toLowerCase() === t) ||
    list.find((p) => t.includes(p.name.toLowerCase()) || t.includes(p.location.toLowerCase()) || p.name.toLowerCase().includes(t)) ||
    null
  );
};
const findTask = (tasks, taskId, titleMatch, projectHint) => {
  if (taskId) {
    const byId = tasks.find((t) => t.id.toLowerCase() === String(taskId).toLowerCase());
    if (byId) return byId;
  }
  if (titleMatch) {
    const tm = titleMatch.toLowerCase();
    const pool = projectHint ? tasks.filter((t) => t.project === projectHint) : tasks;
    return pool.find((t) => t.title.toLowerCase().includes(tm)) || null;
  }
  return null;
};
const nextTaskId = (tasks, projectCode) => {
  const nums = tasks
    .filter((t) => t.id.startsWith(projectCode + "-"))
    .map((t) => parseInt(t.id.split("-")[1], 10))
    .filter((n) => !isNaN(n));
  const n = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${projectCode}-${String(n).padStart(3, "0")}`;
};

const statusStyle = (status) => {
  switch (status) {
    case "Not Started": return { color: "#5B564C", bg: "#EFEBE2", border: "#CFC9BC" };
    case "In Progress": return { color: "#FFFFFF", bg: "#33536B", border: "#33536B" };
    case "In Review": return { color: "#5B4416", bg: "#F0D28E", border: "#C98A1B" };
    case "Blocked": return { color: "#FFFFFF", bg: "#FF6A1F", border: "#FF6A1F" };
    case "Done": return { color: "#FFFFFF", bg: "#3F5D45", border: "#3F5D45" };
    default: return { color: "#5B564C", bg: "#EFEBE2", border: "#CFC9BC" };
  }
};

const SUGGESTIONS = [
  "What's blocked on Villa Renovation?",
  "Assign the lighting plan review to Rakesh",
  "Who has the most work right now?",
  "Mark WHJ-003 as done",
];

export default function AlpangoOpsAgent() {
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [employees, setEmployees] = useState(INITIAL_EMPLOYEES);
  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [selectedProjectId, setSelectedProjectId] = useState("p1");
  const [activity, setActivity] = useState([
    { id: 1, text: "Board initialized with 4 active projects.", time: "08:02" },
  ]);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi, I'm the Alpango ops agent. Tell me who should pick up a task, or ask what's blocked, and I'll update the board.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [newEmpName, setNewEmpName] = useState("");
  const [newEmpRole, setNewEmpRole] = useState("");
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProjName, setNewProjName] = useState("");
  const [newProjLocation, setNewProjLocation] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importNote, setImportNote] = useState("");
  const [page, setPage] = useState("dashboard");
  const [phaseFilter, setPhaseFilter] = useState(null);
  const [employeeFilter, setEmployeeFilter] = useState(null);
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;
  const employeesRef = useRef(employees);
  employeesRef.current = employees;
  const projectsRef = useRef(projects);
  projectsRef.current = projects;
  const chatEndRef = useRef(null);

  const addEmployee = (name, role) => {
    const id = "e" + (employeesRef.current.length + 1) + "-" + Date.now().toString(36).slice(-4);
    const emp = { id, name, role: role || "Team Member", initials: initials(name) };
    setEmployees((prev) => [...prev, emp]);
    employeesRef.current = [...employeesRef.current, emp];
    logActivity(`${name} added to the team roster as ${emp.role}.`);
    return emp;
  };

  const addProject = (name, location) => {
    const id = "p" + (projectsRef.current.length + 1) + "-" + Date.now().toString(36).slice(-4);
    const code = codeFromName(name, projectsRef.current.map((p) => p.code));
    const proj = { id, code, name, location: location || "" };
    setProjects((prev) => [...prev, proj]);
    projectsRef.current = [...projectsRef.current, proj];
    logActivity(`Project "${name}" added (${code}).`);
    return proj;
  };

  const resetDemo = () => {
    setTasks(INITIAL_TASKS);
    setEmployees(INITIAL_EMPLOYEES);
    setProjects(INITIAL_PROJECTS);
    tasksRef.current = INITIAL_TASKS;
    employeesRef.current = INITIAL_EMPLOYEES;
    projectsRef.current = INITIAL_PROJECTS;
    setSelectedProjectId("p1");
    setPhaseFilter(null);
    setEmployeeFilter(null);
    setMessages([{
      role: "assistant",
      text: "Hi, I'm the Alpango ops agent. Tell me who should pick up a task, or ask what's blocked, and I'll update the board.",
    }]);
  };

  const exportToExcel = () => {
    const projSheet = projectsRef.current.map((p) => ({ Code: p.code, Name: p.name, Location: p.location }));
    const empSheet = employeesRef.current.map((e) => ({ Name: e.name, Role: e.role }));
    const taskSheet = tasksRef.current.map((t) => ({
      "Task ID": t.id,
      Project: projectById(projectsRef.current, t.project)?.name || "",
      Phase: t.phase,
      Title: t.title,
      Assignee: t.assignee ? (employeeById(employeesRef.current, t.assignee)?.name || "") : "Unassigned",
      Status: t.status,
      Due: t.due,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(projSheet), "Projects");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(empSheet), "Employees");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(taskSheet), "Tasks");
    XLSX.writeFile(wb, "alpango-ops-data.xlsx");
    logActivity("Exported current data to Excel.");
  };

  const importFromExcel = () => {
    const lines = importText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      setImportNote("Paste a header row plus at least one data row.");
      return;
    }
    const delim = lines[0].includes("\t") ? "\t" : ",";
    const header = lines[0].split(delim).map((h) => h.trim().toLowerCase());
    const projectCol = header.findIndex((h) => h.includes("project"));
    const empCol = header.findIndex((h) => h.includes("employee") || h.includes("assignee") || h.includes("name"));
    const roleCol = header.findIndex((h) => h.includes("role"));
    if (projectCol === -1 && empCol === -1) {
      setImportNote("Couldn't find a Project or Employee column — the first row should have headers like \"Project\" and \"Employee\".");
      return;
    }
    let addedProjects = 0;
    let addedEmployees = 0;
    for (const line of lines.slice(1)) {
      const cells = line.split(delim).map((c) => c.trim());
      const projName = projectCol !== -1 ? cells[projectCol] : "";
      const empName = empCol !== -1 ? cells[empCol] : "";
      const role = roleCol !== -1 ? cells[roleCol] : "";
      if (projName && !findProjectByText(projectsRef.current, projName)) {
        addProject(projName, "");
        addedProjects += 1;
      }
      if (empName && !findEmployeeByText(employeesRef.current, empName)) {
        addEmployee(empName, role);
        addedEmployees += 1;
      }
    }
    logActivity(`Imported ${addedProjects} project(s) and ${addedEmployees} employee(s) from pasted data.`);
    setImportNote(`Added ${addedProjects} new project(s) and ${addedEmployees} new employee(s).`);
    setImportText("");
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, loading]);

  const logActivity = (text) => {
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setActivity((a) => [{ id: Date.now(), text, time }, ...a].slice(0, 8));
  };

  const cycleStatus = (taskId) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const idx = STATUSES.indexOf(t.status);
        const next = STATUSES[(idx + 1) % STATUSES.length];
        logActivity(`${t.id} moved to "${next}".`);
        return { ...t, status: next };
      })
    );
  };

  const applyAction = (action) => {
    if (!action || action.type === "none" || !action.type) return null;

    if (action.type === "add_employee") {
      if (!action.name) return null;
      const existing = findEmployeeByText(employeesRef.current, action.name);
      if (existing) return existing;
      return addEmployee(action.name, action.role);
    }

    if (action.type === "add_project") {
      if (!action.name) return null;
      const existing = findProjectByText(projectsRef.current, action.name);
      if (existing) return existing;
      return addProject(action.name, action.location);
    }

    if (action.type === "create_task") {
      const project = findProjectByText(projectsRef.current, action.project) || projectById(projectsRef.current, selectedProjectId);
      let assignee = findEmployeeByText(employeesRef.current, action.assignee);
      if (!assignee && action.assignee) assignee = addEmployee(action.assignee, action.assigneeRole);
      const phase = PHASES.includes(action.phase) ? action.phase : "Design";
      const id = nextTaskId(tasksRef.current, project.code);
      const newTask = {
        id,
        project: project.id,
        phase,
        title: action.title || "New task",
        assignee: assignee ? assignee.id : null,
        status: "Not Started",
        due: action.dueDate || "TBD",
      };
      setTasks((prev) => [...prev, newTask]);
      setSelectedProjectId(project.id);
      logActivity(`${id} created and assigned to ${assignee ? assignee.name : "unassigned"}.`);
      return newTask;
    }

    if (action.type === "update_status") {
      const task = findTask(tasksRef.current, action.taskId, action.titleMatch, selectedProjectId) ||
        findTask(tasksRef.current, action.taskId, action.titleMatch, null);
      if (!task) return null;
      const status = STATUSES.includes(action.status) ? action.status : task.status;
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status } : t)));
      logActivity(`${task.id} moved to "${status}".`);
      return task;
    }

    if (action.type === "reassign") {
      const task = findTask(tasksRef.current, action.taskId, action.titleMatch, selectedProjectId) ||
        findTask(tasksRef.current, action.taskId, action.titleMatch, null);
      let assignee = findEmployeeByText(employeesRef.current, action.assignee);
      if (!assignee && action.assignee) assignee = addEmployee(action.assignee, action.assigneeRole);
      if (!task || !assignee) return null;
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, assignee: assignee.id } : t)));
      logActivity(`${task.id} reassigned to ${assignee.name}.`);
      return task;
    }

    return null;
  };

  const askAgent = async (userText) => {
    const compactTasks = tasksRef.current.map((t) => ({
      id: t.id,
      project: projectById(projectsRef.current, t.project)?.code || "",
      phase: t.phase,
      title: t.title,
      assignee: t.assignee ? (employeeById(employeesRef.current, t.assignee)?.name || "Unassigned") : "Unassigned",
      status: t.status,
      due: t.due,
    }));

    const system = `You are the internal ops agent for Alpango Design and Build, a Dubai design-and-build construction company.
Projects (code — name — location): ${projectsRef.current.map((p) => `${p.code} — ${p.name} — ${p.location}`).join("; ")}.
Team: ${employeesRef.current.map((e) => `${e.name} (${e.role})`).join("; ")}.
Phases, in order: ${PHASES.join(", ")}.
Current tasks: ${JSON.stringify(compactTasks)}.

A staff member will send you a message. Reply with ONLY a single JSON object, no markdown fences, no text outside the JSON, in exactly this shape:
{"reply": "<plain sentence-case reply, under 35 words, no markdown, no emoji>", "action": null}

If the message asks to create or assign a new task, instead set action to:
{"type":"create_task","project":"<project code>","phase":"<one of the phase names, best guess>","title":"<short task title>","assignee":"<team member name, closest match if given>","assigneeRole":"<only if assignee isn't in the team list — a sensible guessed role>","dueDate":"<short date string if mentioned, else empty>"}

If it asks to change a task's status (e.g. done, blocked, in progress), set action to:
{"type":"update_status","taskId":"<task id if known, else empty>","titleMatch":"<a distinctive fragment of the task title if id unknown>","status":"<Not Started|In Progress|In Review|Blocked|Done>"}

If it asks to reassign an existing task, set action to:
{"type":"reassign","taskId":"<task id if known, else empty>","titleMatch":"<distinctive fragment of the title if id unknown>","assignee":"<team member name>","assigneeRole":"<only if assignee isn't in the team list>"}

If the message is purely introducing a new team member with no task attached (e.g. "Zaid just joined as a draftsman"), set action to:
{"type":"add_employee","name":"<person's name>","role":"<their role, best guess>"}

If the message introduces a brand-new project with no task attached, set action to:
{"type":"add_project","name":"<project name>","location":"<location if mentioned, else empty>"}

If a task mentions a project not in the list above, treat it as new — the create_task action will add it automatically, you don't need a separate add_project action for that case.

The team and project lists above are not fixed — if someone or something is mentioned that isn't on the list, treat it as real and proceed (the system will add it automatically), rather than refusing or asking to add it first.

For questions or status summaries (what's blocked, who's overloaded, status of a project, etc.), answer directly from the task data above in "reply" and set "action" to null. Base counts and facts only on the data given.`;

    const history = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .slice(-8)
      .map((m) => ({ role: m.role, content: m.text }));

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system,
        messages: [...history, { role: "user", content: userText }],
      }),
    });

    const data = await res.json();
    const textBlock = (data.content || []).find((c) => c.type === "text");
    const raw = (textBlock?.text || "").trim();
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return parsed;
  };

  const handleSend = async (textOverride) => {
    const text = (textOverride ?? input).trim();
    if (!text || loading) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setLoading(true);
    try {
      const parsed = await askAgent(text);
      applyAction(parsed.action);
      setMessages((m) => [...m, { role: "assistant", text: parsed.reply || "Done." }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "Couldn't reach the agent just now — mind trying that again?" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const activeTasks = tasks.filter((t) =>
    (employeeFilter ? t.assignee === employeeFilter : t.project === selectedProjectId) &&
    (phaseFilter ? t.phase === phaseFilter : true)
  );
  const visiblePhases = phaseFilter ? [phaseFilter] : PHASES;
  const workload = employees.map((e) => ({
    ...e,
    count: tasks.filter((t) => t.assignee === e.id && t.status !== "Done").length,
  })).sort((a, b) => b.count - a.count);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#E7E3DA", minHeight: "100%", color: "#22201B" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .mono { font-family: 'IBM Plex Mono', monospace; }
        .disp { font-family: 'Space Grotesk', sans-serif; }
        .scrollbar-thin::-webkit-scrollbar { height: 6px; width: 6px; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #CFC9BC; border-radius: 3px; }
        button:focus-visible, select:focus-visible, input:focus-visible { outline: 2px solid #33536B; outline-offset: 2px; }
        .task-card { transition: border-color 0.15s ease, transform 0.1s ease; }
        .task-card:hover { border-color: #22201B; }
        .chat-msg { animation: fadeIn 0.2s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(3px);} to { opacity: 1; transform: translateY(0);} }
        @media (prefers-reduced-motion: reduce) { .chat-msg { animation: none; } }
        @media (max-width: 700px) { .alpango-agent { max-width: 100% !important; border-left: none !important; border-right: none !important; } }
      `}</style>

      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid #CFC9BC", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 6, background: "#22201B", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Building2 size={18} color="#E7E3DA" />
          </div>
          <div>
            <div className="disp" style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em" }}>Alpango Design and Build — Employee Tracker</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", background: "#EFEBE2", borderRadius: 8, padding: 3, gap: 2 }}>
            <button
              onClick={() => setPage("dashboard")}
              style={{
                fontSize: 13, padding: "7px 14px", borderRadius: 6, border: "none", cursor: "pointer",
                fontFamily: "'Inter', sans-serif", fontWeight: 500,
                background: page === "dashboard" ? "#22201B" : "transparent",
                color: page === "dashboard" ? "#E7E3DA" : "#5B564C",
              }}
            >Dashboard</button>
            <button
              onClick={() => setPage("insights")}
              style={{
                fontSize: 13, padding: "7px 14px", borderRadius: 6, border: "none", cursor: "pointer",
                fontFamily: "'Inter', sans-serif", fontWeight: 500,
                background: page === "insights" ? "#22201B" : "transparent",
                color: page === "insights" ? "#E7E3DA" : "#5B564C",
                display: "flex", alignItems: "center", gap: 6,
              }}
            ><BarChart3 size={13} />Insights</button>
            <button
              onClick={() => setPage("agent")}
              style={{
                fontSize: 13, padding: "7px 14px", borderRadius: 6, border: "none", cursor: "pointer",
                fontFamily: "'Inter', sans-serif", fontWeight: 500,
                background: page === "agent" ? "#22201B" : "transparent",
                color: page === "agent" ? "#E7E3DA" : "#5B564C",
                display: "flex", alignItems: "center", gap: 6,
              }}
            ><Sparkles size={13} />Agent</button>
          </div>

          {page === "dashboard" && (
            <div style={{ position: "relative" }}>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                style={{
                  appearance: "none", background: "#FBFAF7", border: "1px solid #CFC9BC", borderRadius: 6,
                  padding: "8px 34px 8px 12px", fontSize: 14, fontFamily: "'Inter', sans-serif", color: "#22201B", cursor: "pointer",
                }}
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} — {p.location}</option>
                ))}
              </select>
              <ChevronDown size={14} style={{ position: "absolute", right: 12, top: 11, pointerEvents: "none", color: "#5B564C" }} />
            </div>
          )}

          <button
            onClick={() => { if (window.confirm("Reset the demo back to its starting data?")) resetDemo(); }}
            style={{ fontSize: 12.5, padding: "7px 12px", borderRadius: 6, border: "1px solid #CFC9BC", background: "transparent", color: "#8A8578", cursor: "pointer" }}
          >Reset</button>
        </div>
      </div>

      {page === "dashboard" && (
      <>

      {/* Toolbar */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, padding: "12px 24px", borderBottom: "1px solid #CFC9BC" }}>
        {!showAddProject ? (
          <button onClick={() => setShowAddProject(true)} style={{
            fontSize: 13, padding: "7px 12px", borderRadius: 6, border: "1px dashed #8A8578",
            background: "transparent", color: "#5B564C", cursor: "pointer",
          }}>+ Add project</button>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              value={newProjName}
              onChange={(e) => setNewProjName(e.target.value)}
              placeholder="Project name"
              style={{ fontSize: 12.5, padding: "6px 8px", borderRadius: 6, border: "1px solid #CFC9BC", width: 150, fontFamily: "'Inter', sans-serif" }}
            />
            <input
              value={newProjLocation}
              onChange={(e) => setNewProjLocation(e.target.value)}
              placeholder="Location"
              style={{ fontSize: 12.5, padding: "6px 8px", borderRadius: 6, border: "1px solid #CFC9BC", width: 130, fontFamily: "'Inter', sans-serif" }}
            />
            <button
              onClick={() => {
                if (!newProjName.trim()) return;
                const p = addProject(newProjName.trim(), newProjLocation.trim());
                setSelectedProjectId(p.id);
                setNewProjName(""); setNewProjLocation(""); setShowAddProject(false);
              }}
              style={{ fontSize: 12.5, padding: "6px 10px", borderRadius: 6, border: "none", background: "#33536B", color: "#fff", cursor: "pointer" }}
            >Add</button>
            <button
              onClick={() => { setShowAddProject(false); setNewProjName(""); setNewProjLocation(""); }}
              style={{ fontSize: 12.5, padding: "6px 8px", borderRadius: 6, border: "1px solid #CFC9BC", background: "transparent", color: "#5B564C", cursor: "pointer" }}
            >Cancel</button>
          </div>
        )}

        <button onClick={() => { setShowImport((v) => !v); setImportNote(""); }} style={{
          display: "flex", alignItems: "center", gap: 6, fontSize: 13, padding: "7px 12px", borderRadius: 6,
          border: "1px solid #CFC9BC", background: "#FBFAF7", color: "#5B564C", cursor: "pointer",
        }}><Upload size={13} />Import from Excel</button>

        <button onClick={exportToExcel} style={{
          display: "flex", alignItems: "center", gap: 6, fontSize: 13, padding: "7px 12px", borderRadius: 6,
          border: "1px solid #CFC9BC", background: "#FBFAF7", color: "#5B564C", cursor: "pointer",
        }}><Download size={13} />Download Excel</button>
      </div>

      {showImport && (
        <div style={{ padding: "14px 24px", borderBottom: "1px solid #CFC9BC", background: "#EFEBE2" }}>
          <div style={{ fontSize: 13, marginBottom: 8, color: "#5B564C" }}>
            Copy rows from your Excel/Google Sheet (with header names like "Project" and "Employee") and paste them below.
          </div>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder={"Project\tEmployee\nVilla Renovation\tAhmed Al Farsi\nRetail Fitout\tSara Haddad"}
            rows={5}
            style={{
              width: "100%", fontSize: 13, padding: 10, borderRadius: 6, border: "1px solid #CFC9BC",
              fontFamily: "'IBM Plex Mono', monospace", background: "#FFFFFF", color: "#22201B", resize: "vertical",
            }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
            <button onClick={importFromExcel} style={{
              fontSize: 13, padding: "7px 14px", borderRadius: 6, border: "none", background: "#33536B", color: "#fff", cursor: "pointer",
            }}>Import</button>
            <button onClick={() => { setShowImport(false); setImportText(""); setImportNote(""); }} style={{
              fontSize: 13, padding: "7px 12px", borderRadius: 6, border: "1px solid #CFC9BC", background: "transparent", color: "#5B564C", cursor: "pointer",
            }}>Close</button>
            {importNote && <span style={{ fontSize: 12.5, color: "#5B564C" }}>{importNote}</span>}
          </div>
        </div>
      )}

      {/* Workload strip */}
      <div className="scrollbar-thin" style={{ display: "flex", gap: 10, padding: "12px 24px", overflowX: "auto", borderBottom: "1px solid #CFC9BC" }}>
        {workload.map((e) => (
          <button key={e.id} onClick={() => setEmployeeFilter((cur) => (cur === e.id ? null : e.id))} style={{
            display: "flex", alignItems: "center", gap: 8, padding: "6px 10px 6px 6px",
            background: employeeFilter === e.id ? "#22201B" : "#FBFAF7",
            border: `1px solid ${employeeFilter === e.id ? "#22201B" : e.count >= 3 ? "#FF6A1F" : "#CFC9BC"}`,
            borderRadius: 20, flexShrink: 0, cursor: "pointer", fontFamily: "'Inter', sans-serif",
          }}>
            <div className="mono" style={{
              width: 24, height: 24, borderRadius: "50%",
              background: employeeFilter === e.id ? "#E7E3DA" : "#22201B",
              color: employeeFilter === e.id ? "#22201B" : "#E7E3DA",
              fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 500,
            }}>{e.initials}</div>
            <span style={{ fontSize: 13, color: employeeFilter === e.id ? "#E7E3DA" : "#22201B" }}>{e.name.split(" ")[0]}</span>
            <span className="mono" style={{ fontSize: 12, color: employeeFilter === e.id ? "#E7E3DA" : e.count >= 3 ? "#FF6A1F" : "#5B564C" }}>{e.count}</span>
          </button>
        ))}
        {!showAddEmployee ? (
          <button onClick={() => setShowAddEmployee(true)} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 20,
            border: "1px dashed #8A8578", background: "transparent", color: "#5B564C", fontSize: 13, cursor: "pointer", flexShrink: 0,
          }}>+ Add employee</button>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <input
              value={newEmpName}
              onChange={(e) => setNewEmpName(e.target.value)}
              placeholder="Name"
              style={{ fontSize: 12.5, padding: "6px 8px", borderRadius: 6, border: "1px solid #CFC9BC", width: 110, fontFamily: "'Inter', sans-serif" }}
            />
            <input
              value={newEmpRole}
              onChange={(e) => setNewEmpRole(e.target.value)}
              placeholder="Role"
              style={{ fontSize: 12.5, padding: "6px 8px", borderRadius: 6, border: "1px solid #CFC9BC", width: 110, fontFamily: "'Inter', sans-serif" }}
            />
            <button
              onClick={() => {
                if (!newEmpName.trim()) return;
                addEmployee(newEmpName.trim(), newEmpRole.trim());
                setNewEmpName(""); setNewEmpRole(""); setShowAddEmployee(false);
              }}
              style={{ fontSize: 12.5, padding: "6px 10px", borderRadius: 6, border: "none", background: "#33536B", color: "#fff", cursor: "pointer" }}
            >Add</button>
            <button
              onClick={() => { setShowAddEmployee(false); setNewEmpName(""); setNewEmpRole(""); }}
              style={{ fontSize: 12.5, padding: "6px 8px", borderRadius: 6, border: "1px solid #CFC9BC", background: "transparent", color: "#5B564C", cursor: "pointer" }}
            >Cancel</button>
          </div>
        )}
      </div>

      {/* Board */}
      <div className="scrollbar-thin" style={{ overflowX: "auto", padding: 20, height: "calc(100% - 113px)", minHeight: 560 }}>
        {(phaseFilter || employeeFilter) && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, fontSize: 13, color: "#5B564C" }}>
            <span>Showing:</span>
            {employeeFilter && (
              <span className="mono" style={{ background: "#EFEBE2", borderRadius: 12, padding: "4px 10px" }}>
                {employeeById(employees, employeeFilter)?.name} — all projects
              </span>
            )}
            {phaseFilter && (
              <span className="mono" style={{ background: "#EFEBE2", borderRadius: 12, padding: "4px 10px" }}>{phaseFilter}</span>
            )}
            <button onClick={() => { setPhaseFilter(null); setEmployeeFilter(null); }} style={{
              fontSize: 12.5, padding: "4px 10px", borderRadius: 12, border: "1px solid #CFC9BC", background: "transparent", color: "#5B564C", cursor: "pointer",
            }}>Clear</button>
          </div>
        )}
        <div style={{ display: "flex", gap: 14, minWidth: 900 }}>
          {visiblePhases.map((phase) => {
            const phaseTasks = activeTasks.filter((t) => t.phase === phase);
            return (
              <div key={phase} style={{ flex: "1 0 200px", minWidth: 200 }}>
                <div
                  onClick={() => setPhaseFilter((cur) => (cur === phase ? null : phase))}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, cursor: "pointer" }}
                >
                  <span className="disp" style={{ fontSize: 13, fontWeight: 600, textDecoration: phaseFilter === phase ? "underline" : "none" }}>{phase}</span>
                  <span className="mono" style={{ fontSize: 11, color: "#5B564C" }}>{phaseTasks.length}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {phaseTasks.map((t) => {
                    const s = statusStyle(t.status);
                    const emp = t.assignee ? employeeById(employees, t.assignee) : null;
                    return (
                      <div key={t.id} className="task-card" style={{
                        background: "#FBFAF7", border: "1px solid #CFC9BC", borderRadius: 4, padding: 10,
                      }}>
                        <div className="mono" style={{ fontSize: 10, color: "#5B564C", marginBottom: 4 }}>{t.id}</div>
                        <div style={{ fontSize: 13, lineHeight: 1.35, marginBottom: 8 }}>{t.title}</div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          {emp ? (
                            <div className="mono" style={{
                              width: 20, height: 20, borderRadius: "50%", background: "#22201B", color: "#E7E3DA",
                              fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center",
                            }} title={emp.name}>{emp.initials}</div>
                          ) : <span style={{ fontSize: 11, color: "#8A8578" }}>Unassigned</span>}
                          <button
                            onClick={() => cycleStatus(t.id)}
                            style={{
                              fontSize: 10, padding: "3px 8px", borderRadius: 3, border: `1px solid ${s.border}`,
                              background: s.bg, color: s.color, cursor: "pointer", fontFamily: "'Inter', sans-serif",
                            }}
                          >{t.status}</button>
                        </div>
                        <div className="mono" style={{ fontSize: 10, color: "#8A8578", marginTop: 6 }}>Due {t.due}</div>
                      </div>
                    );
                  })}
                  {phaseTasks.length === 0 && (
                    <div style={{ fontSize: 12, color: "#8A8578", padding: "8px 2px" }}>Nothing here yet</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      </>
      )}

      {page === "insights" && (() => {
        const statusData = STATUSES.map((s) => ({ name: s, value: tasks.filter((t) => t.status === s).length, fill: statusStyle(s).bg }));
        const phaseData = PHASES.map((p) => ({ name: p, value: tasks.filter((t) => t.phase === p).length }));
        const loadData = employees
          .map((e) => ({ name: e.name.split(" ")[0], value: tasks.filter((t) => t.assignee === e.id && t.status !== "Done").length }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 8);
        const projectProgress = projects.map((p) => {
          const pt = tasks.filter((t) => t.project === p.id);
          const done = pt.filter((t) => t.status === "Done").length;
          return { ...p, total: pt.length, done, pct: pt.length ? Math.round((done / pt.length) * 100) : 0 };
        });
        const blockedCount = tasks.filter((t) => t.status === "Blocked").length;
        const doneCount = tasks.filter((t) => t.status === "Done").length;

        const tileStyle = { flex: "1 0 140px", background: "#FBFAF7", border: "1px solid #CFC9BC", borderRadius: 6, padding: "14px 16px" };
        const cardStyle = { background: "#FBFAF7", border: "1px solid #CFC9BC", borderRadius: 6, padding: "16px 18px" };
        const axisStyle = { fontSize: 11, fill: "#5B564C", fontFamily: "'Inter', sans-serif" };

        return (
          <div className="scrollbar-thin" style={{ overflowY: "auto", padding: 20, height: "calc(100% - 73px)", minHeight: 560 }}>
            {/* Summary tiles */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
              <div style={tileStyle}>
                <div className="mono" style={{ fontSize: 22, fontWeight: 500 }}>{tasks.length}</div>
                <div style={{ fontSize: 12.5, color: "#5B564C" }}>Total tasks</div>
              </div>
              <div style={tileStyle}>
                <div className="mono" style={{ fontSize: 22, fontWeight: 500, color: "#FF6A1F" }}>{blockedCount}</div>
                <div style={{ fontSize: 12.5, color: "#5B564C" }}>Blocked</div>
              </div>
              <div style={tileStyle}>
                <div className="mono" style={{ fontSize: 22, fontWeight: 500, color: "#3F5D45" }}>{doneCount}</div>
                <div style={{ fontSize: 12.5, color: "#5B564C" }}>Done</div>
              </div>
              <div style={tileStyle}>
                <div className="mono" style={{ fontSize: 22, fontWeight: 500 }}>{projects.length}</div>
                <div style={{ fontSize: 12.5, color: "#5B564C" }}>Active projects</div>
              </div>
              <div style={tileStyle}>
                <div className="mono" style={{ fontSize: 22, fontWeight: 500 }}>{employees.length}</div>
                <div style={{ fontSize: 12.5, color: "#5B564C" }}>Team members</div>
              </div>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 16 }}>
              <div style={{ ...cardStyle, flex: "1 1 320px" }}>
                <div className="disp" style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Tasks by status</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={statusData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#DDD8CB" vertical={false} />
                    <XAxis dataKey="name" tick={axisStyle} interval={0} angle={-20} textAnchor="end" height={50} />
                    <YAxis tick={axisStyle} allowDecimals={false} />
                    <Tooltip contentStyle={{ fontFamily: "'Inter', sans-serif", fontSize: 12, border: "1px solid #CFC9BC" }} />
                    <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                      {statusData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ ...cardStyle, flex: "1 1 320px" }}>
                <div className="disp" style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Tasks by phase</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={phaseData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#DDD8CB" vertical={false} />
                    <XAxis dataKey="name" tick={axisStyle} interval={0} angle={-20} textAnchor="end" height={50} />
                    <YAxis tick={axisStyle} allowDecimals={false} />
                    <Tooltip contentStyle={{ fontFamily: "'Inter', sans-serif", fontSize: 12, border: "1px solid #CFC9BC" }} />
                    <Bar dataKey="value" fill="#33536B" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
              <div style={{ ...cardStyle, flex: "1 1 320px" }}>
                <div className="disp" style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Open workload by person</div>
                <ResponsiveContainer width="100%" height={Math.max(180, loadData.length * 32)}>
                  <BarChart data={loadData} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#DDD8CB" horizontal={false} />
                    <XAxis type="number" tick={axisStyle} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={axisStyle} width={70} />
                    <Tooltip contentStyle={{ fontFamily: "'Inter', sans-serif", fontSize: 12, border: "1px solid #CFC9BC" }} />
                    <Bar dataKey="value" fill="#22201B" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ ...cardStyle, flex: "1 1 320px" }}>
                <div className="disp" style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Project completion</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {projectProgress.map((p) => (
                    <div key={p.id}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                        <span>{p.name}</span>
                        <span className="mono" style={{ color: "#5B564C" }}>{p.done}/{p.total} · {p.pct}%</span>
                      </div>
                      <div style={{ height: 8, borderRadius: 4, background: "#EFEBE2", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${p.pct}%`, background: "#3F5D45", borderRadius: 4 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {page === "agent" && (
      <div className="alpango-agent" style={{ display: "flex", flexDirection: "column", height: "calc(100% - 73px)", minHeight: 560, maxWidth: 640, margin: "0 auto", background: "#FBFAF7", borderLeft: "1px solid #CFC9BC", borderRight: "1px solid #CFC9BC" }}>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid #CFC9BC", display: "flex", alignItems: "center", gap: 8 }}>
          <Sparkles size={15} color="#33536B" />
          <span className="disp" style={{ fontSize: 14, fontWeight: 600 }}>Ops agent</span>
        </div>

        <div className="scrollbar-thin" style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          {messages.map((m, i) => (
            <div key={i} className="chat-msg" style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "80%", fontSize: 14, lineHeight: 1.5,
              background: m.role === "user" ? "#22201B" : "#EFEBE2",
              color: m.role === "user" ? "#E7E3DA" : "#22201B",
              borderRadius: 8, padding: "9px 12px",
            }}>{m.text}</div>
          ))}
          {loading && (
            <div className="chat-msg" style={{ alignSelf: "flex-start", fontSize: 13, color: "#8A8578", padding: "9px 12px" }}>
              Agent is thinking…
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div style={{ padding: "10px 16px", display: "flex", flexWrap: "wrap", gap: 6, borderTop: "1px solid #CFC9BC" }}>
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => handleSend(s)} disabled={loading} style={{
              fontSize: 12, padding: "5px 10px", borderRadius: 14, border: "1px solid #CFC9BC",
              background: "#FBFAF7", color: "#5B564C", cursor: loading ? "default" : "pointer",
            }}>{s}</button>
          ))}
        </div>

        <div style={{ padding: 16, borderTop: "1px solid #CFC9BC", display: "flex", gap: 8 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Assign a task, or ask a question…"
            disabled={loading}
            style={{
              flex: 1, fontSize: 14, padding: "10px 12px", borderRadius: 6, border: "1px solid #CFC9BC",
              fontFamily: "'Inter', sans-serif", background: "#FFFFFF", color: "#22201B",
            }}
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            style={{
              width: 38, height: 38, borderRadius: 6, border: "none", background: "#33536B",
              color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
              cursor: loading || !input.trim() ? "default" : "pointer", opacity: loading || !input.trim() ? 0.5 : 1,
            }}
          >
            <Send size={15} />
          </button>
        </div>
      </div>
      )}
    </div>
  );
}
