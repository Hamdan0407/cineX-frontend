import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ClerkProvider } from "@clerk/react";
import { BrowserRouter } from "react-router-dom";
import { ApiAuthSetup } from "./components/ApiAuthSetup";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  console.error(
    "[CineX] Missing VITE_CLERK_PUBLISHABLE_KEY. Please configure VITE_CLERK_PUBLISHABLE_KEY in your environment variables (e.g. Vercel)."
  );
  createRoot(document.getElementById("root")!).render(
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0B0D12",
        color: "#FFFFFF",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        textAlign: "center",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div
        style={{
          backgroundColor: "#151922",
          border: "1px solid #2C3444",
          borderRadius: "16px",
          padding: "40px 32px",
          maxWidth: "520px",
          width: "100%",
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
        }}
      >
        <h1 style={{ color: "#E50914", fontSize: "1.75rem", fontWeight: "800", marginBottom: "12px", letterSpacing: "1px" }}>
          CINEX
        </h1>
        <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "16px", color: "#F3F4F6" }}>
          Configuration Required
        </h2>
        <p style={{ color: "#9CA3AF", fontSize: "0.95rem", lineHeight: "1.6", marginBottom: "20px" }}>
          Missing <code style={{ color: "#F87171", backgroundColor: "#1F2937", padding: "3px 8px", borderRadius: "6px", fontSize: "0.875rem" }}>VITE_CLERK_PUBLISHABLE_KEY</code> environment variable.
        </p>
        <div style={{ backgroundColor: "#1C2230", borderRadius: "10px", padding: "16px", textAlign: "left", border: "1px solid #2C3444", fontSize: "0.875rem", color: "#D1D5DB" }}>
          <p style={{ margin: "0 0 8px 0", fontWeight: "600", color: "#FFFFFF" }}>How to fix on Vercel:</p>
          <ol style={{ margin: 0, paddingLeft: "20px", lineHeight: "1.6" }}>
            <li>Go to Vercel Dashboard &rarr; Project Settings &rarr; Environment Variables.</li>
            <li>Add variable name: <code style={{ color: "#6EE7B7" }}>VITE_CLERK_PUBLISHABLE_KEY</code></li>
            <li>Add your Clerk key value (starts with <code style={{ color: "#6EE7B7" }}>pk_test_</code> or <code style={{ color: "#6EE7B7" }}>pk_live_</code>).</li>
            <li>Redeploy your application.</li>
          </ol>
        </div>
      </div>
    </div>
  );
} else {
  const keyLooksValid = PUBLISHABLE_KEY.startsWith("pk_") && !PUBLISHABLE_KEY.includes("your_clerk");
  if (!keyLooksValid) {
    console.error(
      "[CineX] Invalid VITE_CLERK_PUBLISHABLE_KEY. Replace the placeholder in Vercel environment variables with a real pk_test_… key from https://dashboard.clerk.com and redeploy."
    );
  }

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
        <BrowserRouter>
          <ApiAuthSetup>
            <App />
          </ApiAuthSetup>
        </BrowserRouter>
      </ClerkProvider>
    </StrictMode>
  );
}
