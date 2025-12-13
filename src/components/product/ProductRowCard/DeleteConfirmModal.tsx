"use client";

import { forwardRef } from "react";

interface DeleteConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmModal = forwardRef<HTMLDialogElement, DeleteConfirmModalProps>(
  function DeleteConfirmModal({ onConfirm, onCancel }, ref) {
    return (
      <dialog ref={ref} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg text-error">確認刪除</h3>
          <p className="py-4">確定要刪除這個主商品嗎？此操作無法還原。</p>
          <div className="modal-action">
            <form method="dialog">
              <button className="btn btn-ghost" onClick={onCancel}>
                取消
              </button>
            </form>
            <button className="btn btn-error" onClick={onConfirm}>
              刪除
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
