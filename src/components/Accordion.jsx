import React, { useState, useRef, useEffect } from "react";

/**
 * Simple, accessible accordion.
 * Props:
 *  - title: string|node
 *  - subtitle?: string|node
 *  - right?: node (right side of header)
 *  - defaultOpen?: boolean
 *  - onToggle?(open:boolean)
 *  - id?: string (for anchor/scroll)
 */
export default function Accordion({ title, subtitle, right, defaultOpen=false, onToggle, id, children }){
  const [open, setOpen] = useState(defaultOpen);
  const ref = useRef(null);

  useEffect(() => { if (typeof onToggle === "function") onToggle(open); }, [open]);

  return (
    <section id={id} ref={ref} className="rounded-2xl overflow-hidden border border-white/10">
      <button
        type="button"
        className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 transition"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-controls={id ? id + "-panel" : undefined}
      >
        <div className="flex flex-col items-start text-left">
          <div className="font-semibold">{title}</div>
          {subtitle ? <div className="text-xs opacity-75">{subtitle}</div> : null}
        </div>
        <div className="flex items-center gap-3">
          {right}
          <span className="text-xl select-none">{open ? "▾" : "▸"}</span>
        </div>
      </button>
      <div
        id={id ? id + "-panel" : undefined}
        role="region"
        className={`transition-[grid-template-rows] grid ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </section>
  );
}
