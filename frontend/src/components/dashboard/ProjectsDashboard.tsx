import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Square,
  Play,
  Trash2,
  Bot,
  Rocket,
  X,
} from "lucide-react";
import initialProjects from "../../mocks/projects_mock.json";
import { TEMPLATES } from "../shell/TemplateSelector";
import "./ProjectsDashboard.css";

export interface Project {
  id: string;
  name: string;
  description: string;
  repo: string;
  repoUrl: string;
  status: "RUNNING" | "STOPPED" | "DEPLOYING";
  templateId: string;
  templateName: string;
  containers: number;
  previewUrl: string;
  containerUrl?: string;
  backendUrl?: string;
  dbUrl?: string;
  mcpUrl?: string;
  region?: string;
  cpuAllocated?: string;
  ramAllocated?: string;
  dbSchema?: string;
  lastDeployed: string;
  commit: string;
  branch: string;
  ibmServices: string[];
}

export default function ProjectsDashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>(
    initialProjects as Project[],
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "RUNNING" | "STOPPED"
  >("ALL");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClosingModal, setIsClosingModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [newRepoName, setNewRepoName] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState(TEMPLATES[0].id);
  const [isPrivateRepo, setIsPrivateRepo] = useState(true);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStep, setDeployStep] = useState(0);

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setIsClosingModal(false);
  };

  const handleCloseModal = () => {
    if (isDeploying) return;
    setIsClosingModal(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setIsClosingModal(false);
    }, 230);
  };

  const handleToggleModal = () => {
    if (isModalOpen) {
      handleCloseModal();
    } else {
      handleOpenModal();
    }
  };

  // Animation state for start/stop toggle transition
  const [transitioningProjects, setTransitioningProjects] = useState<
    Record<string, "starting" | "stopping">
  >({});
  const [stopIcons, setStopIcons] = useState<Record<string, boolean>>({});

  const deployStepsText = [
    "Initializing GitHub repository via OAuth...",
    "Injecting starter template & flashmvp.json manifest...",
    "Registering IBM Bob 2.0 Environment Skills...",
    "Provisioning IBM Cloud DB & Code Engine container fleet...",
  ];

  // Filter projects
  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.repo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Toggle project status (Start/Stop container fleet with morph animation)
  const handleToggleStatus = (id: string) => {
    if (transitioningProjects[id]) return;

    const targetProject = projects.find((p) => p.id === id);
    if (!targetProject) return;

    if (targetProject.status === "STOPPED") {
      // 1. Start shrinking the button ("semakin lama pendek")
      setTransitioningProjects((prev) => ({ ...prev, [id]: "starting" }));

      // 2. Icon morphs into stop square right as it reaches 30px ("terus jadi logo stop")
      setTimeout(() => {
        setStopIcons((prev) => ({ ...prev, [id]: true }));
      }, 280);

      // 3. Finalize status in state
      setTimeout(() => {
        setProjects((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: "RUNNING" } : p)),
        );
        setTransitioningProjects((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        setStopIcons((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }, 500);
    } else {
      // 1. Start expanding the button
      setTransitioningProjects((prev) => ({ ...prev, [id]: "stopping" }));

      // 2. Switch icon back to play icon early
      setTimeout(() => {
        setStopIcons((prev) => ({ ...prev, [id]: false }));
      }, 100);

      // 3. Finalize status in state
      setTimeout(() => {
        setProjects((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: "STOPPED" } : p)),
        );
        setTransitioningProjects((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }, 450);
    }
  };

  // Delete project
  const handleDeleteProject = (id: string) => {
    if (
      confirm(
        "Are you sure you want to delete this project and stop its IBM Code Engine container fleet?",
      )
    ) {
      setProjects((prev) => prev.filter((p) => p.id !== id));
    }
  };

  // Handle project creation
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setIsDeploying(true);
    setDeployStep(0);

    // Simulate multi-step injection & deployment
    const stepInterval = setInterval(() => {
      setDeployStep((step) => {
        if (step >= deployStepsText.length - 1) {
          clearInterval(stepInterval);

          // Finish creation
          const chosenTemplate =
            TEMPLATES.find((t) => t.id === selectedTemplateId) || TEMPLATES[0];
          const createdRepo =
            newRepoName.trim() ||
            `ibmbob-dev/${newProjectName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
          const id = `proj_${Math.random().toString(36).substring(2, 7)}`;

          const newProj: Project = {
            id,
            name: newProjectName,
            description:
              newProjectDesc || "Created with IBM Bob 2.0 Environment Skills.",
            repo: createdRepo,
            repoUrl: `https://github.com/${createdRepo}`,
            status: "RUNNING",
            templateId: chosenTemplate.id,
            templateName: `${chosenTemplate.name} (${chosenTemplate.description})`,
            containers: 2,
            previewUrl: `https://app-${id}.trycloudflare.com`,
            containerUrl: `https://app-${id}.trycloudflare.com`,
            backendUrl: `http://localhost:8001/docs`,
            dbUrl: `https://supabase.com/dashboard/project/${id}`,
            mcpUrl: `http://localhost:8001/mcp`,
            region: "us-south (Dallas)",
            cpuAllocated: "0.5 vCPU",
            ramAllocated: "1024 MB",
            dbSchema: `app_${id}`,
            lastDeployed: "Just now",
            commit: "c9f8e7d",
            branch: "main",
            ibmServices: [
              "IBM Code Engine",
              "IBM Cloud DB",
              "watsonx QA",
              "Secrets Manager",
            ],
          };

          setProjects((prev) => [newProj, ...prev]);
          setIsDeploying(false);
          setIsClosingModal(true);
          setTimeout(() => {
            setIsModalOpen(false);
            setIsClosingModal(false);
            setNewProjectName("");
            setNewProjectDesc("");
            setNewRepoName("");
          }, 230);
          return 0;
        }
        return step + 1;
      });
    }, 700);
  };

  const runningCount = projects.filter((p) => p.status === "RUNNING").length;
  const capacityPercent =
    projects.length > 0
      ? ((runningCount / projects.length) * 100).toFixed(1)
      : "0";

  return (
    <div className="projects-dashboard">
      {/* ── Top Header Section ───────────────────────────────────────── */}
      <header className="dash-header">
        <div>
          <div className="dash-title-row">
            <h1 className="dash-title">Projects Dashboard</h1>
            <span className="dash-badge">
              <span className="dash-status-dot-green" />
              IBM Bob 2.0 Connected
            </span>
          </div>
          <p className="dash-subtitle">
            Manage active container fleets, connected GitHub repositories,
            application endpoint links, and IBM Cloud deployment pipelines with
            zero-downtime rollouts.
          </p>
        </div>

        <div className="dash-create-wrapper">
          <button
            type="button"
            className="dash-create-btn"
            onClick={handleToggleModal}
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>Create New Project</span>
          </button>

          {/* ── Create New Project Popover Card (Emerges from Button) ── */}
          {(isModalOpen || isClosingModal) && (
            <>
              <div
                className={`dash-popover-backdrop ${isClosingModal ? "is-closing" : ""}`}
                onClick={handleCloseModal}
              />
              <div
                className={`dash-popover-card ${isClosingModal ? "is-closing" : ""}`}
              >
                <span className="dash-popover-arrow" />
                {isDeploying ? (
                  /* Deployment Progress View */
                  <div style={{ textAlign: "center", padding: "24px 0" }}>
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        margin: "0 auto 20px auto",
                        borderRadius: "50%",
                        background: "rgba(52, 211, 153, 0.12)",
                        border: "2px solid #34d399",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Bot size={28} color="#34d399" />
                    </div>
                    <h3
                      className="dash-modal-title"
                      style={{ margin: "0 0 8px 0" }}
                    >
                      IBM Bob 2.0 Provisioning Fleet
                    </h3>
                    <p
                      style={{
                        color: "#38bdf8",
                        fontSize: 13,
                        margin: "0 0 24px 0",
                        minHeight: 20,
                      }}
                    >
                      {deployStepsText[deployStep]}
                    </p>

                    {/* Progress bar */}
                    <div
                      style={{
                        height: 6,
                        background: "#1c1f26",
                        borderRadius: 4,
                        overflow: "hidden",
                        maxWidth: 360,
                        margin: "0 auto",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          background: "#34d399",
                          width: `${((deployStep + 1) / deployStepsText.length) * 100}%`,
                          transition: "width 0.5s ease",
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  /* Input Form View */
                  <form
                    onSubmit={handleCreateProject}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 18,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <Rocket size={18} color="#34d399" />
                        <h2 className="dash-modal-title">Create New Project</h2>
                      </div>
                      <button
                        type="button"
                        onClick={handleCloseModal}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#7e8490",
                          cursor: "pointer",
                          padding: 4,
                        }}
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#d1d5db",
                          marginBottom: 6,
                        }}
                      >
                        Project Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Payments Microservice"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        className="dash-modal-input"
                      />
                    </div>

                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#d1d5db",
                          marginBottom: 6,
                        }}
                      >
                        Target GitHub Repository (OAuth Linked)
                      </label>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 13,
                            color: "#626773",
                            fontFamily: "monospace",
                          }}
                        >
                          github.com/ibmbob-dev/
                        </span>
                        <input
                          type="text"
                          placeholder={
                            newProjectName
                              ? newProjectName
                                .toLowerCase()
                                .replace(/[^a-z0-9]/g, "-")
                              : "repo-name"
                          }
                          value={newRepoName}
                          onChange={(e) => setNewRepoName(e.target.value)}
                          className="dash-modal-input"
                          style={{ flex: 1, fontFamily: "monospace" }}
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#d1d5db",
                          marginBottom: 6,
                        }}
                      >
                        Starter Template
                      </label>
                      <select
                        value={selectedTemplateId}
                        onChange={(e) => setSelectedTemplateId(e.target.value)}
                        className="dash-modal-input"
                        style={{ background: "#0f1013" }}
                      >
                        {TEMPLATES.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} — {t.description}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#d1d5db",
                          marginBottom: 6,
                        }}
                      >
                        Description
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Brief summary of your application..."
                        value={newProjectDesc}
                        onChange={(e) => setNewProjectDesc(e.target.value)}
                        className="dash-modal-input"
                        style={{ resize: "vertical" }}
                      />
                    </div>

                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <input
                        type="checkbox"
                        id="private-repo-check"
                        checked={isPrivateRepo}
                        onChange={(e) => setIsPrivateRepo(e.target.checked)}
                        style={{
                          accentColor: "#34d399",
                          width: 16,
                          height: 16,
                          cursor: "pointer",
                        }}
                      />
                      <label
                        htmlFor="private-repo-check"
                        style={{
                          fontSize: 13,
                          color: "#9ca3af",
                          cursor: "pointer",
                        }}
                      >
                        Create as Private GitHub Repository
                      </label>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        justifyContent: "flex-end",
                        marginTop: 8,
                      }}
                    >
                      <button
                        type="button"
                        onClick={handleCloseModal}
                        style={{
                          padding: "9px 16px",
                          borderRadius: 9999,
                          border: "1px solid #282c35",
                          background: "transparent",
                          color: "#9ca3af",
                          fontSize: 13,
                          cursor: "pointer",
                        }}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="dash-create-btn">
                        Create &amp; Inject Repo
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </>
          )}
        </div>
      </header>

      {/* ── Summary Cards Bar ────────────────────────────────────────── */}
      <section
        className="dash-metrics-grid"
        aria-label="Dashboard Overview Metrics"
      >
        <div className="dash-metric-card">
          <span className="dash-metric-label">TOTAL PROJECTS</span>
          <div className="dash-metric-content">
            <span className="dash-metric-number">{projects.length}</span>
            <span className="dash-metric-subtext">registered containers</span>
          </div>
        </div>

        <div className="dash-metric-card">
          <span className="dash-metric-label">RUNNING CONTAINER FLEETS</span>
          <div className="dash-metric-content">
            <span className="dash-metric-number is-green">{runningCount}</span>
          </div>
        </div>

        <div className="dash-metric-card">
          <span className="dash-metric-label">IBM CODE ENGINE STATUS</span>
          <div className="dash-metric-content">
            <div className="dash-status-operational">
              <span className="dash-status-dot-green" />
              <span>Operational</span>
            </div>
            <span className="dash-tag-region">us-south</span>
          </div>
        </div>
      </section>

      {/* ── Toolbar / Filter Bar ────────────────────────────────────── */}
      <div className="dash-toolbar">
        {/* Search */}
        <div className="dash-search-box">
          <span className="dash-search-icon">
            <Search size={14} />
          </span>
          <input
            type="text"
            className="dash-search-input"
            placeholder="Search projects, repositories, or endpoints..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter Pills Capsule */}
        <div className="dash-filters-capsule">
          <button
            type="button"
            className={`dash-filter-btn ${statusFilter === "ALL" ? "is-active" : ""}`}
            onClick={() => setStatusFilter("ALL")}
          >
            All Projects
          </button>
          <button
            type="button"
            className={`dash-filter-btn ${statusFilter === "RUNNING" ? "is-active" : ""}`}
            onClick={() => setStatusFilter("RUNNING")}
          >
            <span className="dash-filter-dot-green" />
            <span>Running</span>
          </button>
          <button
            type="button"
            className={`dash-filter-btn ${statusFilter === "STOPPED" ? "is-active" : ""}`}
            onClick={() => setStatusFilter("STOPPED")}
          >
            <span className="dash-filter-dot-red" />
            <span>Stopped</span>
          </button>
        </div>
      </div>

      {/* ── Project Cards Grid ───────────────────────────────────────── */}
      {filteredProjects.length === 0 ? (
        <div className="dash-empty-state">
          <p
            style={{
              color: "var(--dash-text-muted)",
              fontSize: 14,
              margin: "0 0 16px 0",
            }}
          >
            No projects found matching your search.
          </p>
          <button
            type="button"
            className="dash-create-btn"
            onClick={handleOpenModal}
          >
            Create New Project
          </button>
        </div>
      ) : (
        <div className="dash-cards-grid">
          {filteredProjects.map((project) => {
            const isRunning = project.status === "RUNNING";

            return (
              <div
                key={project.id}
                className="dash-project-card"
                onClick={() => navigate(`/project/${project.id}/details`)}
              >
                {/* Card Top Info */}
                <div>
                  <div className="dash-card-header">
                    <div>
                      <h3 className="dash-card-title">{project.name}</h3>
                      <span className="dash-card-stack">
                        {project.templateName}
                      </span>
                    </div>

                    {/* Status Pill */}
                    <div
                      className={`dash-status-pill ${isRunning ? "is-running" : "is-stopped"}`}
                    >
                      <span>{project.status}</span>
                    </div>
                  </div>

                  <p className="dash-card-desc">{project.description}</p>

                  {/* Linked GitHub Repo Badge */}
                  <div className="dash-repo-badge">
                    <a
                      href={project.repoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="dash-repo-link"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <i
                        className="fa-brands fa-github"
                        style={{ fontSize: 13, color: "#7e8490" }}
                      />
                      <span>{project.repo}</span>
                    </a>
                    <span className="dash-repo-branch">
                      {project.branch} @ {project.commit}
                    </span>
                  </div>

                  {/* Specs Row */}
                  <div className="dash-specs-row">
                    <span>
                      Hardware:{" "}
                      <strong>
                        {project.cpuAllocated || "0.5 vCPU"} /{" "}
                        {project.ramAllocated || "1024 MB"}
                      </strong>
                    </span>
                    <span>
                      Schema:{" "}
                      <strong className="dash-schema-val">
                        {project.dbSchema || "app_default"}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="dash-card-footer">
                  <div
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    <button
                      type="button"
                      className="dash-btn-details"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/project/${project.id}/details`);
                      }}
                    >
                      Project Details
                    </button>
                    <button
                      type="button"
                      className="dash-btn-telemetry"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/project/${project.id}/telemetry`);
                      }}
                    >
                      <span
                        className={`dash-btn-telemetry-dot ${isRunning ? "is-green" : "is-gray"}`}
                      />
                      <span>Telemetry</span>
                    </button>
                  </div>

                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    {/* Unified Toggle Start/Stop Button with Morph Animation */}
                    {(() => {
                      const trans = transitioningProjects[project.id];
                      const isCollapsing = trans === "starting";
                      const isExpanding = trans === "stopping";
                      const showStop = isRunning
                        ? trans !== "stopping"
                        : trans === "starting" && stopIcons[project.id];

                      let toggleClass = "dash-fleet-toggle ";
                      if (isCollapsing) {
                        toggleClass += "is-collapsing";
                      } else if (isExpanding) {
                        toggleClass += "is-expanding";
                      } else if (isRunning) {
                        toggleClass += "is-running";
                      } else {
                        toggleClass += "is-stopped";
                      }

                      return (
                        <button
                          type="button"
                          className={toggleClass}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStatus(project.id);
                          }}
                        >
                          <span
                            key={showStop ? "stop" : "play"}
                            className={`dash-fleet-toggle-icon ${showStop ? "dash-icon-stop-pop" : "dash-icon-play-pop"}`}
                          >
                            {showStop ? (
                              <Square
                                size={11}
                                strokeWidth={2.5}
                                color="#ef4444"
                              />
                            ) : (
                              <Play size={10} fill="#34d399" color="#34d399" />
                            )}
                          </span>
                          <span className="dash-fleet-toggle-text">Start</span>
                        </button>
                      );
                    })()}

                    <button
                      type="button"
                      className="dash-btn-icon is-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProject(project.id);
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create New Project Modal ─────────────────────────────────── */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            width: '100%', maxWidth: 540,
            background: '#0D0F17',
            border: '1px solid rgba(15, 98, 254, 0.3)',
            borderRadius: 20,
            padding: 28,
            boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(15, 98, 254, 0.2)',
          }}>
            {isDeploying ? (
              /* Deployment Progress View */
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{
                  width: 56, height: 56, margin: '0 auto 20px auto', borderRadius: '50%',
                  background: 'rgba(15, 98, 254, 0.15)', border: '2px solid #0F62FE',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Bot size={28} color="#0F62FE" />
                </div>
                <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: '0 0 8px 0' }}>
                  IBM Bob 2.0 Provisioning Fleet
                </h3>
                <p style={{ color: '#60A5FA', fontSize: 13, margin: '0 0 24px 0', minHeight: 20 }}>
                  {deployStepsText[deployStep]}
                </p>

                {/* Progress bar */}
                <div style={{
                  height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 4,
                  overflow: 'hidden', maxWidth: 360, margin: '0 auto'
                }}>
                  <div style={{
                    height: '100%', background: '#0F62FE',
                    width: `${((deployStep + 1) / deployStepsText.length) * 100}%`,
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>
            ) : (
              /* Input Form View */
              <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Rocket size={20} color="#0F62FE" />
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0 }}>
                      Create New Project
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 4 }}
                  >
                    <X size={18} />
                  </button>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 6 }}>
                    Project Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Payments Microservice"
                    value={newProjectName}
                    onChange={e => setNewProjectName(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 8,
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                      color: '#fff', fontSize: 13, outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 6 }}>
                    Target GitHub Repository (OAuth Linked)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
                      github.com/ibmbob-dev/
                    </span>
                    <input
                      type="text"
                      placeholder={newProjectName ? newProjectName.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'repo-name'}
                      value={newRepoName}
                      onChange={e => setNewRepoName(e.target.value)}
                      style={{
                        flex: 1, padding: '10px 12px', borderRadius: 8,
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                        color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'monospace'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 6 }}>
                    Starter Template
                  </label>
                  <select
                    value={selectedTemplateId}
                    onChange={e => setSelectedTemplateId(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 8,
                      background: '#161922', border: '1px solid rgba(255,255,255,0.12)',
                      color: '#fff', fontSize: 13, outline: 'none',
                    }}
                  >
                    {TEMPLATES.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} — {t.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 6 }}>
                    Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Brief summary of your application..."
                    value={newProjectDesc}
                    onChange={e => setNewProjectDesc(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 8,
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                      color: '#fff', fontSize: 13, outline: 'none', resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="checkbox"
                    id="private-repo-check"
                    checked={isPrivateRepo}
                    onChange={e => setIsPrivateRepo(e.target.checked)}
                    style={{ accentColor: '#0F62FE', width: 16, height: 16, cursor: 'pointer' }}
                  />
                  <label htmlFor="private-repo-check" style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', cursor: 'pointer' }}>
                    Create as Private GitHub Repository
                  </label>
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    style={{
                      padding: '10px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
                      background: 'transparent', color: 'rgba(255,255,255,0.7)', fontSize: 13, cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '10px 20px', borderRadius: 8, border: 'none',
                      background: '#0F62FE', color: '#fff', fontWeight: 600, fontSize: 13,
                      cursor: 'pointer', boxShadow: '0 4px 14px rgba(15,98,254,0.4)'
                    }}
                  >
                    Create
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
