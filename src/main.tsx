import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ClerkProvider } from "@clerk/react";
import { BrowserRouter } from "react-router-dom";
import { ApiAuthSetup } from "./components/ApiAuthSetup";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

const keyLooksValid = PUBLISHABLE_KEY.startsWith("pk_") && !PUBLISHABLE_KEY.includes("your_clerk");
if (!keyLooksValid) {
  console.error(
    "[CineX] Invalid VITE_CLERK_PUBLISHABLE_KEY. Replace the placeholder in cinex-ui/.env.local with a real pk_test_… key from https://dashboard.clerk.com and restart Vite. Until then, Clerk isLoaded stays false and Sign In / seat locking cannot work."
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
