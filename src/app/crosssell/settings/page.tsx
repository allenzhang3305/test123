"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import toast from "react-hot-toast";
import {
  ArrowLeft as ArrowLeftIcon,
  Save as SaveIcon,
  ShieldCheck as ShieldCheckIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
} from "lucide-react";

const STORAGE_KEY = "crosssell-token";

const CrosssellSettingsPage = () => {
  const [storedToken, setStoredToken] = useLocalStorage<string>(STORAGE_KEY, "");
  const [tokenInput, setTokenInput] = useState("");
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    setTokenInput(storedToken);
  }, [storedToken]);

  const handleSaveToken = () => {
    const trimmedToken = tokenInput.trim();

    if (!trimmedToken) {
      toast.error("Token is required.");
      return;
    }

    setStoredToken(trimmedToken);
    toast.success("Crosssell token saved successfully.");
  };

  const handleTokenInputChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setTokenInput(event.target.value);
  };

  const handleToggleShowToken = (): void => {
    setShowToken((prev) => !prev);
  };

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <Link href="/crosssell" className="btn btn-ghost gap-2 mb-6">
        <ArrowLeftIcon className="w-4 h-4" />
        Back to Crosssell
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <ShieldCheckIcon className="w-9 h-9 text-primary" />
        <div>
          <h1 className="text-3xl font-semibold">Crosssell Settings</h1>
          <p className="text-base-content/70">
            Store your bearer token securely on this device. It will be used for crosssell API requests.
          </p>
        </div>
      </div>

      <div className="card bg-base-100 shadow">
        <div className="card-body gap-6">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Bearer Token</span>
              <span className="label-text-alt text-base-content/60">Required</span>
            </label>
            <div className="join w-full">
              <input
                type={showToken ? "text" : "password"}
                value={tokenInput}
                onChange={handleTokenInputChange}
                placeholder="Paste bearer token"
                className="input input-bordered join-item w-full"
                autoComplete="off"
              />
              <button
                type="button"
                className="btn join-item"
                onClick={handleToggleShowToken}
              >
                {showToken ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
              </button>
            </div>
            <label className="label">
              <span className="label-text-alt text-base-content/60">
                Bear token get from login M2
              </span>
            </label>
          </div>

          <button
            type="button"
            className="btn btn-primary gap-2 self-start"
            onClick={handleSaveToken}
          >
            <SaveIcon className="w-4 h-4" />
            Save Token
          </button>
        </div>
      </div>
    </main>
  );
};

export default CrosssellSettingsPage;

