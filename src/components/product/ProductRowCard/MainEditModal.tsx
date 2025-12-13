"use client";

import { forwardRef } from "react";

export interface MainEditFormData {
  prodName: string;
  productSku: string;
  url: string;
  img: string;
}

interface MainEditModalProps {
  formData: MainEditFormData;
  onFormChange: (data: Partial<MainEditFormData>) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export const MainEditModal = forwardRef<HTMLDialogElement, MainEditModalProps>(
  function MainEditModal({ formData, onFormChange, onSubmit, onCancel }, ref) {
    return (
      <dialog ref={ref} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">編輯主商品</h3>
          <div className="space-y-3">
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">商品名稱</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={formData.prodName}
                onChange={(e) => onFormChange({ prodName: e.target.value })}
              />
            </div>
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">SKU</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={formData.productSku}
                onChange={(e) => onFormChange({ productSku: e.target.value })}
              />
            </div>
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">網址（選填）</span>
              </label>
              <input
                type="url"
                className="input input-bordered w-full"
                value={formData.url}
                onChange={(e) => onFormChange({ url: e.target.value })}
              />
            </div>
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">圖片網址（選填）</span>
              </label>
              <input
                type="url"
                className="input input-bordered w-full"
                value={formData.img}
                onChange={(e) => onFormChange({ img: e.target.value })}
                placeholder="https://..."
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
              disabled={!formData.prodName.trim() || !formData.productSku.trim()}
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
