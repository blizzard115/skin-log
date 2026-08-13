"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteSkinRecord } from "./actions";

type DeleteRecordButtonProps = {
  recordId: number;
};

export function DeleteRecordButton({ recordId }: DeleteRecordButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleDelete = async () => {
    if (isDeleting) {
      return;
    }

    const confirmed = window.confirm(
      "この肌記録を削除します。削除すると元に戻せません。本当に削除しますか？",
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setErrorMessage("");

    try {
      const result = await deleteSkinRecord(recordId);

      if (result.success) {
        router.push(result.redirectTo);
        router.refresh();
        return;
      }

      setErrorMessage(result.message);
    } catch {
      setErrorMessage(
        "肌記録を削除できませんでした。時間をおいてもう一度お試しください。",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 sm:p-5">
      <div className="space-y-2">
        <h2 className="text-base font-semibold text-red-800">危険な操作</h2>
        <p className="text-sm leading-6 text-red-700">
          この肌記録を削除すると元に戻せません。
        </p>
      </div>

      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting}
        className="mt-4 flex h-12 w-full items-center justify-center rounded-lg bg-red-600 px-6 text-base font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-fit"
      >
        {isDeleting ? "削除中..." : "削除する"}
      </button>

      {errorMessage ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-700">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
