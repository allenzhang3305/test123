"use client";

import { forwardRef } from "react";

interface AddSkuModalProps {
  skuInput: string;
  onSkuInputChange: (value: string) => void;
  onAdd: () => void;
  onClose: () => void;
}

export const AddSkuModal = forwardRef<HTMLDialogElement, AddSkuModalProps>(
  function AddSkuModal({ skuInput, onSkuInputChange, onAdd, onClose }, ref) {
    return (
      <dialog ref={ref} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">新增白點商品 SKU</h3>
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">SKU</span>
            </label>
            <input
              type="text"
              placeholder="輸入 SKU"
              className="input input-bordered w-full"
              value={skuInput}
              onChange={(e) => onSkuInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onAdd();
                }
              }}
              autoFocus
            />
          </div>
          <div className="modal-action">
            <form method="dialog">
              <button className="btn btn-ghost" onClick={onClose}>
                取消
              </button>
            </form>
            <button className="btn btn-primary" onClick={onAdd}>
              新增
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={onClose}>close</button>
        </form>
      </dialog>
    );
  }
);
