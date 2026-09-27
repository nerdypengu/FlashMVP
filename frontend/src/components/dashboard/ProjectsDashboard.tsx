import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Square, Play, Trash2, X } from "lucide-react";
import initialProjects from "../../mocks/projects_mock.json";
import GitHubStarter from "../shell/GitHubStarter";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import { API_URL, DEMO_MODE } from "../../lib/person2Data";
import { findTemplate } from "../../data/templates";
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

function getStoredDemoProjects(): Project[] {
  try {
    return JSON.parse(localStorage.getItem('flashmvp_demo_projects') || '[]');
  } catch {
    return [];
  }
}

export default function ProjectsDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projectError, setProjectError] = useState("");
  const [projects, setProjects] = useState<Project[]>(
    DEMO_MODE ? [...getStoredDemoProjects(), ...(initialProjects as Project[])] : getStoredDemoProjects(),
  );
  async function fetchProjects(signal?: AbortSignal) {
    try {
      const token = (await supabase?.auth.getSession())?.data.session?.access_token;
      const response = await fetch(`${API_URL}/api/v1/github/projects`, {
        credentials: "include", signal,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error("Could not load your projects. Please reload the dashboard.");
      const published = await response.json();
      if (signal?.aborted) return;
      const created: Project[] = published.map((repo: { id: string; name: string; description: string; full_name: string; repo_url: string; template: string; branch: string; commit_sha: string }) => ({
        id: repo.id, name: repo.name, description: repo.description,
        repo: repo.full_name, repoUrl: repo.repo_url, status: "STOPPED",
        templateId: repo.template, templateName: findTemplate(repo.template).name,
        containers: 0, previewUrl: "", lastDeployed: "Not deployed",
        commit: repo.commit_sha.slice(0, 7), branch: repo.branch, ibmServices: [],
        cpuAllocated: "Unavailable", ramAllocated: "Unavailable", dbSchema: "Not provisioned",
      }));
      setProjects([...getStoredDemoProjects(), ...created, ...(DEMO_MODE ? initialProjects as Project[] : [])]);
      setProjectError("");
    } catch (error: any) {
      if (signal?.aborted) return;
      if (DEMO_MODE) {
        setProjects([...getStoredDemoProjects(), ...(initialProjects as Project[])]);
        setProjectError("");
      } else {
        setProjectError(error.message);
      }
    }
  }
  useEffect(() => {
    const controller = new AbortController();
    setProjects(DEMO_MODE ? [...getStoredDemoProjects(), ...(initialProjects as Project[])] : getStoredDemoProjects());
    fetchProjects(controller.signal).catch(error => {
      if (!controller.signal.aborted) {
        if (DEMO_MODE) {
          setProjects([...getStoredDemoProjects(), ...(initialProjects as Project[])]);
        } else {
          setProjectError(error.message);
        }
      }
    });
    return () => controller.abort();
  }, [user?.id]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "RUNNING" | "STOPPED"
  >("ALL");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(() =>
    new URLSearchParams(window.location.search).has("github"),
  );
  const [isClosingModal, setIsClosingModal] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);

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

  // Filter projects
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.repo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

  const runningCount = projects.filter((p) => p.status === "RUNNING").length;
  const capacityPercent =
    projects.length > 0
      ? ((runningCount / projects.length) * 100).toFixed(1)
      : "0";

  return (
    <div className="projects-dashboard">
      {projectError && <p role="alert">{projectError}</p>}
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
      {(isModalOpen || isClosingModal) && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Create project"
            style={{
              width: "100%",
              maxWidth: 540,
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#0D0F17",
              border: "1px solid rgba(15, 98, 254, 0.3)",
              borderRadius: 20,
              padding: 28,
              boxShadow:
                "0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(15, 98, 254, 0.2)",
            }}
          >
            <button
              type="button"
              className="btn btn--ghost"
              onClick={handleCloseModal}
              disabled={isDeploying}
              aria-label="Close create project"
              style={{ float: 'right' }}
            >
              <X size={18} />
            </button>
            <GitHubStarter onBusyChange={setIsDeploying} onCreated={async () => {
              await fetchProjects();
              setIsModalOpen(false);
              setIsClosingModal(false);
            }} />
          </div>
        </div>
      )}
    </div>
  );
}
