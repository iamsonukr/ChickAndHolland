"use client";

import { useState } from "react";

export default function ContactTableClient({ contacts }: any) {
  const [selected, setSelected] = useState<any>(null);

  return (
    <>
      {/* TABLE */}
      <tbody>
        {contacts.map((c: any) => (
          <tr key={c.id}>
            <td>{c.name}</td>

            <td>
              <p className="line-clamp-2 text-sm">{c.message}</p>

              <button
                onClick={() => setSelected(c)}
                className="text-xs text-blue-600 hover:underline mt-1"
              >
                View full message →
              </button>
            </td>
          </tr>
        ))}
      </tbody>

      {/* MODAL */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-white max-w-lg w-full rounded-xl p-6 relative">
            <button
              onClick={() => setSelected(null)}
              className="absolute top-3 right-3 text-gray-500"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold mb-2">{selected.subject}</h2>

            <p className="text-sm text-gray-600 mb-4">
              {selected.name} • {selected.email}
            </p>

            <div className="text-gray-800 whitespace-pre-wrap">
              {selected.message}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
