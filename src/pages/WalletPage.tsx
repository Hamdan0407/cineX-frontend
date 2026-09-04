import { useEffect, useState } from "react";
import { useClerk, useUser } from "@clerk/react";
import { useNavigate } from "react-router-dom";
import { ArrowDownLeft, ArrowLeft, ArrowUpRight, CreditCard, Gift, ShieldCheck, WalletCards } from "lucide-react";
import { api, getApiErrorMessage } from "../api/apiClient";
import { CinexLogo } from "../components/CinexLogo";

type Wallet = { walletId: number | null; balance: number; currency: string };
type WalletTransaction = { id: number; type: "CREDIT" | "DEBIT"; amount: number; description: string; createdAt: string };
const money = (amount: number, currency = "INR") => new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);

export function WalletPage({ onClaimCoupon }: { onClaimCoupon: () => void }) {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!isSignedIn) return;
    Promise.all([api.get<Wallet>("/api/wallet"), api.get<WalletTransaction[]>("/api/wallet/transactions")])
      .then(([w, t]) => { setWallet(w.data); setTransactions(t.data || []); })
      .catch((err) => setError(getApiErrorMessage(err, "Unable to load your wallet. Please try again.")));
  }, [isSignedIn]);
  if (isLoaded && !isSignedIn) return <div className="cx-page wallet-auth"><WalletCards size={36} /><h1>Welcome to CineX Wallet</h1><p>Sign in to view your secure CineX balance and transaction history.</p><button className="cx-btn-signin" onClick={() => openSignIn()}>Sign In</button></div>;
  return <div className="cx-page wallet-page">
    <div style={{ marginBottom: "1.5rem" }}>
      <button
        type="button"
        onClick={() => {
          if (window.history.length > 1) {
            navigate(-1);
          } else {
            navigate("/");
          }
        }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          color: "#B8C0CC",
          background: "rgba(255,255,255,0.05)",
          padding: "0.6rem 1.2rem",
          borderRadius: "50px",
          border: "1px solid rgba(255,255,255,0.1)",
          cursor: "pointer",
          fontWeight: 600,
          fontSize: "0.95rem",
          transition: "all 0.2s ease"
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#B8C0CC")}
        aria-label="Go back to previous screen"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
    </div>
    <section className="wallet-hero"><div><span className="wallet-eyebrow">CINEX WALLET</span><h1>Your movie money, ready when you are.</h1><p>Credits and payments are recorded securely for every CineX experience.</p></div><ShieldCheck size={42} /></section>
    {error && <div className="cx-error-banner">{error}</div>}
    <section className="wallet-balance-card"><div className="wallet-brand"><CinexLogo height={20} /> <span style={{ marginLeft: "0.25rem", letterSpacing: "1px" }}>WALLET</span></div><span className="wallet-balance-label">AVAILABLE BALANCE</span><strong>{wallet ? money(wallet.balance, wallet.currency) : "Loading..."}</strong><div className="wallet-card-footer"><span>Secure CineX balance</span><CreditCard size={18} /></div></section>
    <section className="wallet-claim-card"><div><span className="wallet-eyebrow">EXCLUSIVE OFFER</span><h2>Have a CineX coupon?</h2><p>Claim eligible wallet rewards securely.</p></div><button type="button" className="btn-outline wallet-claim-button" onClick={onClaimCoupon}><Gift size={16} /> Claim Coupon</button></section>
    <section className="wallet-ledger"><div className="wallet-ledger-head"><div><span className="wallet-eyebrow">ACTIVITY</span><h2>Transaction history</h2></div><span>{transactions.length} transaction{transactions.length === 1 ? "" : "s"}</span></div>
      {transactions.length === 0 ? <div className="wallet-empty"><WalletCards size={30} /><p>No wallet transactions yet.</p><span>Future CineX credits and payments will appear here.</span></div> : <div>{transactions.map((transaction) => { const credit = transaction.type === "CREDIT"; return <article key={transaction.id} className="wallet-transaction"><div className={`wallet-transaction-icon ${credit ? "credit" : "debit"}`}>{credit ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}</div><div><strong>{transaction.description}</strong><span>{new Date(transaction.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span></div><strong className={credit ? "wallet-credit" : "wallet-debit"}>{credit ? "+" : "-"}{money(transaction.amount)}</strong></article>; })}</div>}
    </section>
  </div>;
}
