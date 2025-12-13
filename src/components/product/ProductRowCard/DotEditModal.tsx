"use client";

import { forwardRef } from "react";

export interface DotEditFormData {
  index: number;
  sku: string;
  top: string;
  left: string;
}

interface DotEditModalProps {
  formData: DotEditFormData | null;
  onFormChange: (data: Partial<DotEditFormData>) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export const DotEditModal = forwardRef<HTMLDialogElement, DotEditModalProps>(
  function DotEditModal({ formData, onFormChange, onSubmit, onCancel }, ref) {
    return (
      <dialog ref={ref} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">編輯白點商品</h3>
          <div className="space-y-3">
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">SKU</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={formData?.sku ?? ""}
                onChange={(e) => onFormChange({ sku: e.target.value })}
              />
            </div>
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Top 位置</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={formData?.top ?? ""}
                onChange={(e) => onFormChange({ top: e.target.value })}
                placeholder="e.g. 50%"
              />
            </div>
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Left 位置</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={formData?.left ?? ""}
                onChange={(e) => onFormChange({ left: e.target.value })}
                placeholder="e.g. 30%"
              />
            </div>
          </div>
          <div className="modal-action">
            <form method="dialog">
              <button className="btn btn-ghost" onClick={onCancel}>
                取消
              </button>
            </form>
            <button
              className="btn btn-primary"
              onClick={onSubmit}
              disabled={!formData?.sku?.trim()}
            >
              儲存
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={onCancel}>close</button>
        </form>
      </dialog>
    );
  }
);
