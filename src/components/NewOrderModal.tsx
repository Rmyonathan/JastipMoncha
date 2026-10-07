"use client";

import { Modal } from "@/components/Modal";
import { OrderForm } from "@/components/OrderForm";
import { useState } from "react";

type Props = {
  onSaved?: () => void | Promise<void>;
};

export function NewOrderModal({ onSaved }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-[#2F5496] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#244170]"
      >
        + New jastip order
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="New jastip order">
        <p className="mb-4 text-sm text-slate-500">
          Customer, shipping, items, and profit in one form — like your Calculations sheet.
        </p>
        <OrderForm
          onClose={() => setOpen(false)}
          onSaved={async () => {
            setOpen(false);
            await onSaved?.();
          }}
        />
      </Modal>
    </>
  );
}
