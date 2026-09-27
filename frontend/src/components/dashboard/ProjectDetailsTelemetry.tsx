import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import TelemetryCharts from "../telemetry/TelemetryCharts";
import type { Project } from "../../lib/person2Data";
import projectsMock from "../../mocks/projects_mock.json";

export default function ProjectDetailsTelemetry({
  project,
}: {
  project?: Project;
}) {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId?: string }>();
  const projectName = project?.app_name ?? projectsMock.find((item) => item.id === projectId)?.name;

  return (
    <div className="telemetry-layout">
      <h1>{projectName ? `${projectName} observability` : "Container observability"}</h1>
      <TelemetryCharts project={project} projectId={projectId} />
    </div>
  );
}
