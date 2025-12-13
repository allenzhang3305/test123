"use client";

import { X as XIcon, Plus as PlusIcon } from "lucide-react";
import type { ChangeEvent } from "react";

interface AddMainProductModalProps {
  isOpen: boolean;
  mainProductSku: string;
  mainProductImage: string;
  dotSkuInputs: string[];
  onClose: () => void;
  onSave: () => void;
  onAddDotSkuInput: () => void;
  onMainProductSkuChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onMainProductImageChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onDotSkuChange: (index: number, event: ChangeEvent<HTMLInputElement>) => void;
}

export function AddMainProductModal({
  isOpen,
  mainProductSku,
  mainProductImage,
  dotSkuInputs,
  onClose,
  onSave,
  onAddDotSkuInput,
  onMainProductSkuChange,
  onMainProductImageChange,
  onDotSkuChange,
}: AddMainProductModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal modal-open" role="dialog">
      <div className="modal-box">
        <button
          className="btn btn-sm btn-circle absolute right-2 top-2"
          onClick={onClose}
          aria-label="Close modal"
        >
          <XIcon className="w-4 h-4" />
        </button>
        <h3 className="font-bold text-lg mb-4">新增主商品</h3>
        <div className="form-control mb-4">
          <label className="label">
            <span className="label-text">主商品 SKU</span>
          </label>
          <input
            type="text"
            placeholder="輸入 SKU"
            className="input input-bordered w-full"
            value={mainProductSku}
            onChange={onMainProductSkuChange}
          />
        </div>
        <div className="form-control mb-4">
          <label className="label">
            <span className="label-text">主商品圖片 URL (選填)</span>
          </label>
          <input
            type="text"
            placeholder="https://..."
            className="input input-bordered w-full"
            value={mainProductImage}
            onChange={onMainProductImageChange}
          />
        </div>
        <div className="form-control mb-4">
          <label className="label">
            <span className="label-text">白點商品 SKUs</span>
          </label>
          {dotSkuInputs.map((sku, index) => (
            <input
              key={index}
              type="text"
              placeholder={`白點商品 ${index + 1} SKU`}
              className="input input-bordered w-full mb-2"
              value={sku}
              onChange={(e) => onDotSkuChange(index, e)}
            />
          ))}
          <button
            type="button"
            className="btn btn-outline btn-sm gap-2"
            onClick={onAddDotSkuInput}
          >
            <PlusIcon className="w-4 h-4" />
            Add more dot SKU
          </button>
        </div>
        <div className="modal-action">
          <button className="btn btn-ghost" onClick={onClose}>
            取消
          </button>
          <button className="btn btn-primary" onClick={onSave}>
            新增
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </div>
  );
}
