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
      toast.error("必須提供 Token。");
      return;
    }

    setStoredToken(trimmedToken);
    toast.success("交叉銷售 Token 儲存成功。");
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
        返回Crosssell
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <ShieldCheckIcon className="w-9 h-9 text-primary" />
        <div>
          <h1 className="text-3xl font-semibold">Crosssell設定</h1>
          <p className="text-base-content/70">
            在此裝置上安全儲存您的 Bearer Token。它將用於Crosssell API 請求。
          </p>
        </div>
      </div>

      <div className="card bg-base-100 shadow">
        <div className="card-body gap-6">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Bearer Token</span>
              <span className="label-text-alt text-base-content/60">必填</span>
            </label>
            <div className="join w-full">
              <input
                type={showToken ? "text" : "password"}
                value={tokenInput}
                onChange={handleTokenInputChange}
                placeholder="貼上 Bearer Token"
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
                從 M2 登入取得的 Bearer Token
              </span>
            </label>
          </div>

          <button
            type="button"
            className="btn btn-primary gap-2 self-start"
            onClick={handleSaveToken}
          >
            <SaveIcon className="w-4 h-4" />
            儲存 Token
          </button>
        </div>
      </div>
    </main>
  );
};

export default CrosssellSettingsPage;

