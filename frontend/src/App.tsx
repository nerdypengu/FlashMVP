import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { Zap } from "lucide-react";
import QACanvas from "./components/qa/QACanvas";
import RunHistoryTable, { type Run } from "./components/qa/RunHistoryTable";
import PlaygroundWindow from "./components/playground/PlaygroundWindow";
import TemplateSelector, {
  TEMPLATES,
  type Template,
} from "./components/shell/TemplateSelector";
import SpecReviewer, { type SpecData } from "./components/sdd/SpecReviewer";
import AppCatalog from "./components/portal/AppCatalog";
import ProjectsDashboard from "./components/dashboard/ProjectsDashboard";
import ProjectDetailsPage from "./components/dashboard/ProjectDetailsPage";
import ProjectDetailsTelemetry from "./components/dashboard/ProjectDetailsTelemetry";
import EnvironmentConfigPage from "./components/config/EnvironmentConfigPage";
import SkillPackageInspector from "./components/sdd/SkillPackageInspector";
import LandingHomePage from "./components/home/LandingHomePage";
import LoginPage from "./components/auth/LoginPage";
import RequireAuth from "./components/auth/RequireAuth";
import DashboardLayout from "./components/shell/DashboardLayout";
import BinaryCanvasBackground from "./components/ui/BinaryCanvasBackground";
import { useAuth } from "./context/AuthContext";
import demoProjects from "./mocks/projects_mock.json";
import {
  DEMO_MODE,
  errorMessage,
  loadProjects,
  loadRuns,
  type Project,
} from "./lib/person2Data";

const DEFAULT_SPEC: SpecData = {
  projectId: "proj_8f92a",
  template: TEMPLATES[0],
  prompt: "E-commerce store with Supabase auth & Stripe checkout",
  status: "DRAFT",
  requirements:
    "# FlashStore\n\nBuyers browse products and check out; admins manage inventory.",
  architecture: "React frontend → FastAPI backend → PostgreSQL",
  ibmBindings: [
    {
      tool: "IBM Code Engine",
      purpose: "Container deployment",
      status: "Ready",
    },
    { tool: "IBM Cloud DB", purpose: "PostgreSQL", status: "Ready" },
  ],
  tasks: [
    {
      id: "TSK-01",
      title: "Provision the application",
      subagent: "Bob",
      estimate: "Pending",
    },
  ],
};

function ProjectTelemetry({ project }: { project?: Project }) {
  const { projectId } = useParams();
  return (
    <ProjectDetailsTelemetry
      key={projectId}
      project={
        project?.project_id === projectId || project?.id === projectId
          ? project
          : undefined
      }
    />
  );
}

function ProjectWorkflow({
  view,
  projects,
  runsByProject,
  setRunsByProject,
  loadingProjects,
  projectError,
}: {
  view: "qa" | "history";
  projects: Project[];
  runsByProject: Record<string, Run[]>;
  setRunsByProject: Dispatch<SetStateAction<Record<string, Run[]>>>;
  loadingProjects: boolean;
  projectError: string;
}) {
  const { projectId } = useParams();
  const demoProject = DEMO_MODE
    ? demoProjects.find((item) => item.id === projectId)
    : undefined;
  const liveProject = !DEMO_MODE
    ? projects.find(
        (item) => item.project_id === projectId || item.id === projectId,
      )
    : undefined;
  const [loadingRuns, setLoadingRuns] = useState(false);
  const [runError, setRunError] = useState("");

  useEffect(() => {
    if (!projectId || (!DEMO_MODE && !liveProject)) return;
    let active = true;
    setLoadingRuns(true);
    setRunError("");
    loadRuns(DEMO_MODE ? projectId : liveProject!.id)
      .then((rows) => {
        if (active)
          setRunsByProject((previous) => ({ ...previous, [projectId]: rows }));
      })
      .catch((error) => {
        if (active) setRunError(errorMessage(error));
      })
      .finally(() => {
        if (active) setLoadingRuns(false);
      });
    return () => {
      active = false;
    };
  }, [projectId, liveProject?.id, setRunsByProject]);

  if (!projectId || (!demoProject && !liveProject))
    return (
      <p role={loadingProjects ? "status" : "alert"}>
        {loadingProjects
          ? "Loading project…"
          : projectError || "Project not found or access denied."}
      </p>
    );
  if (loadingRuns) return <p role="status">Loading runs…</p>;
  if (runError) return <p role="alert">{runError}</p>;

  const runs = runsByProject[projectId] ?? [];
  if (view === "history")
    return (
      <RunHistoryTable
        key={projectId}
        runs={runs}
        projectName={demoProject?.name ?? liveProject?.app_name}
      />
    );
  return (
    <QACanvas
      key={projectId}
      projectId={projectId}
      runs={runs}
      onRunComplete={(run) =>
        setRunsByProject((previous) => ({
          ...previous,
          [projectId]: [run, ...(previous[projectId] ?? [])],
        }))
      }
    />
  );
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [runsByProject, setRunsByProject] = useState<Record<string, Run[]>>({});
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState("");
  const [reload, setReload] = useState(0);
  const [spec, setSpec] = useState<SpecData>(DEFAULT_SPEC);
  const project = projects.find((item) => item.id === projectId);
  const scopedProjectId = location.pathname.startsWith("/project/")
    ? location.pathname.split("/")[2]
    : undefined;
  const scopedProject = projects.find(
    (item) =>
      item.project_id === scopedProjectId || item.id === scopedProjectId,
  );
  const projectPage = ["/playground", "/telemetry"].includes(location.pathname);

  useEffect(() => {
    if (DEMO_MODE) return;
    let active = true;
    setProjects([]);
    setProjectId("");
    setRunsByProject({});
    setDataError("");
    if (!user) return;
    setDataLoading(true);
    loadProjects()
      .then((rows) => {
        if (active) {
          setProjects(rows);
          setProjectId(rows[0]?.id ?? "");
        }
      })
      .catch((error) => {
        if (active) setDataError(errorMessage(error));
      })
      .finally(() => {
        if (active) setDataLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user?.id, reload]);

  const dashboard = (content: React.ReactNode) => (
    <RequireAuth>
      <DashboardLayout>
        {scopedProjectId &&
        !(DEMO_MODE
          ? demoProjects.some((item) => item.id === scopedProjectId)
          : scopedProject) ? (
          <p role={dataLoading ? "status" : "alert"}>
            {dataLoading
              ? "Loading project…"
              : dataError || "Project not found or access denied."}
          </p>
        ) : !DEMO_MODE && projectPage ? (
          <>
            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <label htmlFor="workspace-project">Project</label>
              <select
                id="workspace-project"
                className="modal-input"
                value={projectId}
                disabled={dataLoading || !projects.length}
                onChange={(event) => {
                  setProjectId(event.target.value);
                  setDataError("");
                }}
              >
                {!projects.length && (
                  <option value="">
                    {dataLoading ? "Loading…" : "No accessible projects"}
                  </option>
                )}
                {projects.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.app_name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setReload((value) => value + 1)}
              >
                Refresh
              </button>
            </div>
            {dataError && <p role="alert">{dataError}</p>}
            {dataLoading ? (
              <p role="status">Loading projects…</p>
            ) : project ? (
              content
            ) : (
              <p>
                No project data is available. Create a project or ask its owner
                to add you as a member.
              </p>
            )}
          </>
        ) : (
          content
        )}
      </DashboardLayout>
    </RequireAuth>
  );

  const card = (content: React.ReactNode) =>
    dashboard(
      <div className="workspace-card glass-card page-enter">{content}</div>,
    );
  const workflowProps = {
    projects,
    runsByProject,
    setRunsByProject,
    loadingProjects: dataLoading,
    projectError: dataError,
  };
  const legacyProjectId = DEMO_MODE ? demoProjects[0]?.id : project?.project_id;
  const generateSpec = (template: Template, prompt: string) => {
    setSpec((previous) => ({
      ...previous,
      projectId: scopedProjectId ?? previous.projectId,
      template,
      prompt,
      status: "DRAFT",
    }));
    navigate(scopedProjectId ? `/project/${scopedProjectId}/specs` : "/specs");
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="app-shell">
            <BinaryCanvasBackground />
            <div className="page">
              <header className="header">
                <button
                  type="button"
                  className="logo-btn"
                  onClick={() => navigate("/")}
                  title="FlashMVP — Home"
                >
                  <img
                    src="/assets/logo.webp"
                    alt="FlashMVP"
                    width="52"
                    height="52"
                  />
                </button>
                <nav className="nav-pill" aria-label="Main Navigation">
                  <button type="button" className="nav-link active">
                    Home
                  </button>
                </nav>
                <button
                  type="button"
                  className="sign-in-btn"
                  onClick={() => navigate(user ? "/dashboard" : "/login")}
                >
                  <Zap size={14} /> {user ? "Dashboard" : "Sign In"}
                </button>
              </header>
              <main className="hero-workspace">
                <LandingHomePage />
              </main>
            </div>
          </div>
        }
      />
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />
      <Route path="/dashboard" element={dashboard(<ProjectsDashboard />)} />
      <Route
        path="/project/:projectId/details"
        element={dashboard(<ProjectDetailsPage />)}
      />
      <Route
        path="/project/:projectId/telemetry"
        element={card(<ProjectTelemetry project={scopedProject} />)}
      />
      <Route
        path="/project/:projectId/qa"
        element={card(<ProjectWorkflow {...workflowProps} view="qa" />)}
      />
      <Route
        path="/project/:projectId/history"
        element={card(<ProjectWorkflow {...workflowProps} view="history" />)}
      />
      <Route
        path="/project/:projectId/playground"
        element={card(
          DEMO_MODE && scopedProjectId !== demoProjects[0]?.id ? (
            <p>Playground demo is not configured for this project.</p>
          ) : (
            <PlaygroundWindow key={scopedProjectId} project={scopedProject} />
          ),
        )}
      />
      <Route
        path="/project/:projectId/starter"
        element={card(<TemplateSelector onGenerate={generateSpec} />)}
      />
      <Route
        path="/project/:projectId/specs"
        element={card(
          <SpecReviewer
            spec={{ ...spec, projectId: scopedProjectId ?? spec.projectId }}
            onApprove={() => {
              setSpec((previous) => ({ ...previous, status: "APPROVED" }));
              navigate(`/project/${scopedProjectId}/qa`);
            }}
            onRevise={(feedback) =>
              setSpec((previous) => ({
                ...previous,
                status: "CHANGES_REQUESTED",
                requirements: `${previous.requirements}\n\n## Revision Request\n- ${feedback}`,
              }))
            }
          />,
        )}
      />
      <Route
        path="/project/:projectId/skill-pack"
        element={card(
          <SkillPackageInspector
            key={scopedProjectId}
            repository={
              demoProjects.find((item) => item.id === scopedProjectId)?.repo ??
              ""
            }
          />,
        )}
      />
      <Route
        path="/project/:projectId/hub"
        element={card(
          <AppCatalog
            onOpenPlayground={() =>
              navigate(`/project/${scopedProjectId}/playground`)
            }
          />,
        )}
      />
      <Route
        path="/project/:projectId/env-config"
        element={card(
          <EnvironmentConfigPage
            key={scopedProjectId}
            dbSchema={
              scopedProject?.db_schema ??
              demoProjects.find((item) => item.id === scopedProjectId)
                ?.dbSchema ??
              "Not configured"
            }
          />,
        )}
      />
      <Route
        path="/project/:projectId"
        element={dashboard(<ProjectDetailsPage />)}
      />
      <Route path="/env-config" element={card(<EnvironmentConfigPage />)} />
      <Route path="/skill-pack" element={card(<SkillPackageInspector />)} />
      <Route
        path="/starter"
        element={card(<TemplateSelector onGenerate={generateSpec} />)}
      />
      <Route
        path="/specs"
        element={card(
          <SpecReviewer
            spec={spec}
            onApprove={() => {
              setSpec((previous) => ({ ...previous, status: "APPROVED" }));
              navigate(`/project/${spec.projectId}/qa`);
            }}
            onRevise={(feedback) =>
              setSpec((previous) => ({
                ...previous,
                status: "CHANGES_REQUESTED",
                requirements: `${previous.requirements}\n\n## Revision Request\n- ${feedback}`,
              }))
            }
          />,
        )}
      />
      <Route
        path="/qa"
        element={
          dataLoading ? (
            card(<p role="status">Loading projects…</p>)
          ) : legacyProjectId ? (
            <RequireAuth>
              <Navigate to={`/project/${legacyProjectId}/qa`} replace />
            </RequireAuth>
          ) : (
            card(<p>No accessible projects.</p>)
          )
        }
      />
      <Route
        path="/history"
        element={
          dataLoading ? (
            card(<p role="status">Loading projects…</p>)
          ) : legacyProjectId ? (
            <RequireAuth>
              <Navigate to={`/project/${legacyProjectId}/history`} replace />
            </RequireAuth>
          ) : (
            card(<p>No accessible projects.</p>)
          )
        }
      />
      <Route
        path="/playground"
        element={card(<PlaygroundWindow key={projectId} project={project} />)}
      />
      <Route
        path="/telemetry"
        element={
          dataLoading ? (
            card(<p role="status">Loading projects…</p>)
          ) : !DEMO_MODE && !project ? (
            card(<p>{dataError || "No project data is available."}</p>)
          ) : (
            <RequireAuth>
              <Navigate
                to={`/project/${project?.project_id || "proj_8f92a"}/telemetry`}
                replace
              />
            </RequireAuth>
          )
        }
      />
      <Route
        path="/hub"
        element={card(
          <AppCatalog onOpenPlayground={() => navigate("/playground")} />,
        )}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
