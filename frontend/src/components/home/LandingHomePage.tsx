import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Zap,
  ShieldCheck,
  Server,
  Database,
  Code2,
  Cpu,
  Rocket,
  ArrowRight,
  CheckCircle2,
  Bot,
  Plug,
  Globe,
  Terminal,
} from "lucide-react";
import TypewriterHero from "../ui/TypewriterHero";

export default function LandingHomePage() {
  const navigate = useNavigate();
  const [typingComplete, setTypingComplete] = useState(false);

  useEffect(() => {
    const scrollContainer = document.querySelector(".page");

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, {
      root: scrollContainer,
      threshold: 0.08,
      rootMargin: "0px 0px -20px 0px",
    });

    const viewportObserver = new IntersectionObserver(handleIntersect, {
      threshold: 0.08,
      rootMargin: "0px 0px -20px 0px",
    });

    const elements = document.querySelectorAll(".scroll-fade");
    elements.forEach((el) => {
      observer.observe(el);
      viewportObserver.observe(el);
    });

    return () => {
      observer.disconnect();
      viewportObserver.disconnect();
    };
  }, []);

  const FEATURES = [
    {
      icon: Code2,
      color: "#ffffff",
      title: "Prompt to 3-Part SDD Specs",
      desc: "Transforms high-level prompts into precise PRD requirements, PostgreSQL DDL schemas, and IBM Cloud service bindings.",
    },
    {
      icon: Server,
      color: "#ffffff",
      title: "IBM Code Engine Container Fleet",
      desc: "Deploys multi-container microservice fleets with automatic scaling from 0 to 10 replicas in seconds.",
    },
    {
      icon: ShieldCheck,
      color: "#ffffff",
      title: "watsonx Automated QA Inspector",
      desc: "Executes ESLint static code analysis, Pytest unit tests, secret leak auditing, and dependency CVE checks.",
    },
    {
      icon: Database,
      color: "#ffffff",
      title: "Instant Database Provisioning",
      desc: "Provisions isolated PostgreSQL multi-tenant schemas on IBM Cloud DB & Supabase in under 200ms.",
    },
    {
      icon: Plug,
      color: "#ffffff",
      title: "Model Context Protocol (MCP)",
      desc: "Provides standardized MCP tool endpoints enabling IBM Bob 2.0 subagents to inspect and control container state.",
    },
    {
      icon: Globe,
      color: "#ffffff",
      title: "Cloudflare Quick SSL Tunnel",
      desc: "Generates instant public HTTPS egress URLs for container endpoints without manual DNS configuration.",
    },
  ];

  const WORKFLOW_STEPS = [
    {
      step: "01",
      title: "Natural Language Prompt",
      desc: "Describe your application MVP in natural language.",
    },
    {
      step: "02",
      title: "Bob Spec Synthesis",
      desc: "IBM Bob 2.0 generates the 3-part SDD spec & architecture.",
    },
    {
      step: "03",
      title: "Subagent Execution",
      desc: "Parallel subagents synthesize code, database & QA audits.",
    },
    {
      step: "04",
      title: "Live Container Egress",
      desc: "Container fleet deployed with live Cloudflare tunnel URL.",
    },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 48,
        paddingBottom: 64,
        width: "100%",
        maxWidth: 1100,
        margin: "0 auto",
      }}
    >
      {/* ── Hero Section ────────────────────────────────────────────── */}
      <div className="hero-overview" style={{ padding: "24px 0 0 0" }}>
        <div
          className="trust-row anim"
          style={{ "--d": "0.05s" } as React.CSSProperties}
        >
          <div
            className="avatar-ring avatar-ring-1"
            title="IBM Cloud & Bob 2.0"
          >
            <div className="avatar-inner">
              <i className="fa-brands fa-ibm" style={{ fontSize: "16px" }} />
            </div>
          </div>
          <div
            className="avatar-ring avatar-ring-2"
            title="Docker Container Fleet"
          >
            <div className="avatar-inner">
              <i className="fa-brands fa-docker" style={{ fontSize: "15px" }} />
            </div>
          </div>
          <div
            className="avatar-ring avatar-ring-3"
            title="Cloudflare Quick Tunnel"
          >
            <div className="avatar-inner">
              <i
                className="fa-brands fa-cloudflare"
                style={{ fontSize: "15px" }}
              />
            </div>
          </div>
          <div className="trust-pill">
            <span className="trust-text">
              Powered by IBM Bob 2.0 &amp; Cloud Fleet
            </span>
          </div>
        </div>

        <TypewriterHero
          line1Text="FLASHMVP"
          line2Text="SPEC TO CONTAINER"
          onComplete={() => setTypingComplete(true)}
        />

        <p
          className={`subhead sequential-reveal ${typingComplete ? "sequential-reveal--visible" : ""}`}
          style={{ transitionDelay: "0.05s", maxWidth: 680, margin: "0 auto" }}
        >
          Autonomous agentic middleware proxy. Transform natural prompts into
          production-grade container fleets with automated 3-part SDD specs,
          instant IBM Cloud DB provisioning, and watsonx QA observability.
        </p>

        <div
          className={`sequential-reveal ${typingComplete ? "sequential-reveal--visible" : ""}`}
          style={{
            display: "flex",
            gap: 14,
            flexWrap: "wrap",
            justifyContent: "center",
            transitionDelay: "0.18s",
            marginTop: 20,
          }}
        >
          <button
            type="button"
            className="cta-btn"
            onClick={() => navigate("/login")}
          >
            <Zap
              size={16}
              style={{
                display: "inline-block",
                verticalAlign: "middle",
                marginRight: 6,
              }}
            />{" "}
            Get Started Now
          </button>
          <button
            type="button"
            className="cta-btn"
            style={{
              background: "rgba(255,255,255,0.08)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
            onClick={() => navigate("/login")}
          >
            Sign In to Dashboard →
          </button>
        </div>

        {/* Platform Stats Row */}
        <footer
          className={`stats sequential-reveal ${typingComplete ? "sequential-reveal--visible" : ""}`}
          aria-label="Platform Statistics"
          style={{
            marginTop: "clamp(28px, 4vh, 48px)",
            transitionDelay: "0.32s",
          }}
        >
          {[
            { icon: "<", value: "200", suffix: "ms", label: "DB Provisioning" },
            {
              icon: "%",
              value: "99.9",
              suffix: "%",
              label: "watsonx QA Reliability",
            },
            {
              icon: "*",
              value: "24",
              suffix: "/7",
              label: "Autonomous Container Fleet",
            },
            {
              icon: "#",
              value: "1",
              suffix: "-Click",
              label: "Spec-to-Deploy Cycle",
            },
          ].map((s) => (
            <div key={s.label} className="stat-item">
              <div className="stat-top">
                <span className="stat-icon">{s.icon}</span>
                <div className="stat-value-group">
                  <span className="stat-value">{s.value}</span>
                  <span className="stat-suffix">{s.suffix}</span>
                </div>
              </div>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </footer>
      </div>

      {/* ── Feature Capabilities Grid ───────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div className="scroll-fade" style={{ textAlign: "center" }}>
          <h2
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: "#fff",
              margin: "0 0 8px 0",
              letterSpacing: "-0.02em",
            }}
          >
            Built for Autonomous Agentic Development
          </h2>
          <p
            style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.6)",
              maxWidth: 580,
              margin: "0 auto",
            }}
          >
            FlashMVP bridges IBM Bob 2.0 subagent intelligence directly with IBM
            Cloud container infrastructure.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 20,
          }}
        >
          {FEATURES.map((feat, idx) => {
            const IconComponent = feat.icon;
            return (
              <div
                key={feat.title}
                className="scroll-fade"
                style={{
                  background: "rgba(15, 17, 26, 0.75)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: 16,
                  padding: 24,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  transition:
                    "border-color 0.25s, transform 0.25s, box-shadow 0.25s",
                  transitionDelay: `${0.04 + idx * 0.05}s`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor =
                    "rgba(255, 255, 255, 0.28)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(255, 255, 255, 0.04)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor =
                    "rgba(255, 255, 255, 0.08)";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconComponent size={22} color="#ffffff" />
                </div>
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#ffffff",
                    margin: 0,
                  }}
                >
                  {feat.title}
                </h3>
                <p
                  style={{
                    fontSize: 13,
                    color: "rgba(255, 255, 255, 0.65)",
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  {feat.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Workflow Architecture Pipeline ─────────────────────────── */}
      <div
        className="scroll-fade"
        style={{
          background: "rgba(15, 17, 26, 0.75)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: 16,
          padding: "24px 24px 22px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 18,
          transitionDelay: "0.08s",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#a1a1aa",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            }}
          >
            AGENTIC PIPELINE ARCHITECTURE
          </span>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#ffffff",
              margin: "4px 0 0 0",
              letterSpacing: "-0.01em",
            }}
          >
            How FlashMVP Executes Prompts to Container Fleets
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 14,
          }}
        >
          {WORKFLOW_STEPS.map((ws, idx) => (
            <div
              key={ws.step}
              className="scroll-fade"
              style={{
                background: "rgba(21, 24, 34, 0.75)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: 12,
                padding: "16px 18px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                position: "relative",
                transition: "border-color 0.2s, transform 0.2s",
                transitionDelay: `${0.12 + idx * 0.06}s`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.25)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#ffffff",
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, monospace",
                    letterSpacing: "0.05em",
                  }}
                >
                  STEP {ws.step}
                </span>
                {idx < WORKFLOW_STEPS.length - 1 && (
                  <ArrowRight
                    size={13}
                    style={{ color: "rgba(255, 255, 255, 0.35)" }}
                  />
                )}
              </div>
              <h4
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#ffffff",
                  margin: 0,
                }}
              >
                {ws.title}
              </h4>
              <p
                style={{
                  fontSize: 12.5,
                  color: "rgba(255, 255, 255, 0.65)",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {ws.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA Banner ──────────────────────────────────────────────── */}
      <div
        className="scroll-fade"
        style={{
          background: "rgba(15, 17, 26, 0.75)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: 16,
          padding: "36px 24px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
          transitionDelay: "0.15s",
        }}
      >
        <h2
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "#ffffff",
            margin: 0,
            letterSpacing: "-0.01em",
          }}
        >
          Ready to Deploy Your Autonomous MVP?
        </h2>
        <p
          style={{
            fontSize: 13.5,
            color: "rgba(255, 255, 255, 0.65)",
            margin: 0,
            maxWidth: 520,
            lineHeight: 1.5,
          }}
        >
          Sign in to access your active container fleets, live telemetry stats,
          and watsonx QA canvas.
        </p>
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="cta-btn"
          style={{
            marginTop: 6,
            background: "#ffffff",
            color: "#000000",
            fontWeight: 600,
            fontSize: 14,
            padding: "11px 26px",
            borderRadius: 9999,
            border: "none",
            cursor: "pointer",
            boxShadow:
              "0 0 0 1px rgba(255, 255, 255, 0.2), 0 0 24px rgba(255, 255, 255, 0.3)",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            transition: "transform 0.25s ease, box-shadow 0.25s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow =
              "0 0 0 1px rgba(255, 255, 255, 0.4), 0 0 32px rgba(255, 255, 255, 0.55)";
            e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow =
              "0 0 0 1px rgba(255, 255, 255, 0.2), 0 0 24px rgba(255, 255, 255, 0.3)";
            e.currentTarget.style.transform = "translateY(0) scale(1)";
          }}
        >
          <Zap size={15} fill="#000000" color="#000000" />
          <span>Launch Dashboard</span>
          <ArrowRight size={15} color="#000000" />
        </button>
      </div>
    </div>
  );
}
