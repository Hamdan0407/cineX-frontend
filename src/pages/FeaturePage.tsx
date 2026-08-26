import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, ArrowLeft, ShieldCheck, Zap, Bell } from "lucide-react";
import { toast } from "sonner";

interface FeaturePageProps {
  title: string;
  category: string;
  icon: React.ReactNode;
  description: string;
  heroGradient?: string;
  previewItems?: { title: string; subtitle: string; badge: string; tag: string }[];
}

export const FeaturePage: React.FC<FeaturePageProps> = ({
  title,
  category,
  icon,
  description,
  heroGradient = "linear-gradient(135deg, rgba(229,9,20,0.15) 0%, rgba(11,13,18,0.9) 100%)",
  previewItems = [
    { title: "VIP Early Access Pass", subtitle: "Priority booking window before public release", badge: "Exclusive", tag: "4K IMAX" },
    { title: "CineX Premier Rewards", subtitle: "Earn 5x loyalty points on every transaction", badge: "Live Soon", tag: "Platinum" },
    { title: "Curated Showcase", subtitle: "Handpicked selection tailored to your taste profile", badge: "Preview", tag: "Dolby Atmos" }
  ]
}) => {
  return (
    <div style={{ minHeight: "85vh", padding: "3rem 4rem", color: "#F5F7FA" }}>
      {/* Back Navigation */}
      <div style={{ marginBottom: "2rem" }}>
        <Link
          to="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "#B8C0CC",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: "0.95rem",
            background: "rgba(255,255,255,0.05)",
            padding: "0.6rem 1.2rem",
            borderRadius: "50px",
            border: "1px solid rgba(255,255,255,0.1)",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#B8C0CC")}
        >
          <ArrowLeft className="w-4 h-4" /> Back to Movies & Shows
        </Link>
      </div>

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          background: heroGradient,
          border: "1px solid rgba(229, 9, 20, 0.3)",
          borderRadius: "24px",
          padding: "3.5rem",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "1rem" }}>
          <span style={{
            background: "rgba(229, 9, 20, 0.2)",
            color: "#FF3D5A",
            padding: "0.4rem 1rem",
            borderRadius: "50px",
            fontSize: "0.8rem",
            fontWeight: 800,
            letterSpacing: "1px",
            textTransform: "uppercase",
            border: "1px solid rgba(229, 9, 20, 0.4)",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem"
          }}>
            <Sparkles className="w-3.5 h-3.5" /> {category}
          </span>
          <span style={{
            background: "rgba(255, 209, 102, 0.15)",
            color: "#FFD166",
            padding: "0.4rem 1rem",
            borderRadius: "50px",
            fontSize: "0.8rem",
            fontWeight: 700,
            border: "1px solid rgba(255, 209, 102, 0.3)"
          }}>
            🚧 Under Active Development
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "2rem" }}>
          <div style={{ maxWidth: "650px" }}>
            <h1 style={{ fontSize: "3rem", fontWeight: 900, lineHeight: 1.1, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ background: "rgba(255,255,255,0.1)", padding: "1rem", borderRadius: "20px", display: "flex" }}>
                {icon}
              </div>
              {title}
            </h1>
            <p style={{ fontSize: "1.15rem", color: "#B8C0CC", lineHeight: 1.6, marginBottom: "2rem" }}>
              {description}
            </p>
            
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <button
                onClick={() => toast.success("Notification set!", { description: `We will notify you via VIP Toast the moment ${title} launches!` })}
                style={{
                  background: "#E50914",
                  color: "#fff",
                  border: "none",
                  padding: "0.85rem 1.8rem",
                  borderRadius: "12px",
                  fontWeight: 700,
                  fontSize: "1rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  boxShadow: "0 10px 20px -5px rgba(229, 9, 20, 0.5)"
                }}
              >
                <Bell className="w-4 h-4" /> Notify Me at Launch
              </button>
              <Link
                to="/"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  color: "#fff",
                  textDecoration: "none",
                  padding: "0.85rem 1.8rem",
                  borderRadius: "12px",
                  fontWeight: 700,
                  fontSize: "1rem",
                  border: "1px solid rgba(255,255,255,0.15)"
                }}
              >
                Explore Live Movies →
              </Link>
            </div>
          </div>

          <div style={{
            background: "rgba(11, 13, 18, 0.6)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "16px",
            padding: "1.5rem",
            minWidth: "280px",
            backdropFilter: "blur(10px)"
          }}>
            <h4 style={{ fontSize: "0.9rem", color: "#64748B", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "1rem" }}>
              Engineering Roadmap Status
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", fontSize: "0.95rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#10B981" }}>
                <ShieldCheck className="w-4 h-4" /> Architecture & Spec Approved
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#FFD166" }}>
                <Zap className="w-4 h-4" /> Backend Microservice Scaffolding
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#B8C0CC" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#E50914", marginLeft: "4px" }} /> UI & Animation Polish (In Progress)
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Preview Showcase Grid */}
      <div style={{ marginTop: "3.5rem" }}>
        <h3 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <Sparkles className="w-5 h-5 text-[#FFD166]" /> Upcoming Feature Preview
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
          {previewItems.map((item, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -5 }}
              style={{
                background: "rgba(18, 22, 31, 0.8)",
                border: "1px solid #2A3242",
                borderRadius: "16px",
                padding: "1.8rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <span style={{ background: "rgba(255,255,255,0.08)", color: "#FFD166", padding: "0.25rem 0.7rem", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 700 }}>
                    {item.badge}
                  </span>
                  <span style={{ color: "#64748B", fontSize: "0.8rem", fontWeight: 600 }}>
                    {item.tag}
                  </span>
                </div>
                <h4 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.6rem", color: "#fff" }}>
                  {item.title}
                </h4>
                <p style={{ color: "#B8C0CC", fontSize: "0.9rem", lineHeight: 1.5 }}>
                  {item.subtitle}
                </p>
              </div>
              <div style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "flex-end" }}>
                <span style={{ color: "#FF3D5A", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer" }} onClick={() => toast.info("Coming Soon to CineX!")}>
                  Preview Prototype →
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
