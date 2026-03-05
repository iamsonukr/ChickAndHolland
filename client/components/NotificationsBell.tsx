// "use client";

// import { useState, useEffect, useRef } from "react";
// import { getCookie } from "@/lib/utils";
// import { API_URL } from "@/lib/constants";

// export default function NotificationBell() {
//   const [messages, setMessages] = useState<any[]>([]);
//   const [open, setOpen] = useState(false);
//   const ref = useRef<HTMLDivElement>(null);

//   const fetchMessages = async () => {
//     try {
//       const res = await fetch(`${API_URL}/contactus`, {
//         headers: {
//           Authorization: `Bearer ${getCookie("token")}`,
//         },
//       });
//       const data = await res.json();
//       setMessages(Array.isArray(data) ? data : []);
//     } catch {
//       setMessages([]);
//     }
//   };

//   useEffect(() => {
//     fetchMessages();
//     const interval = setInterval(fetchMessages, 10000);
//     return () => clearInterval(interval);
//   }, []);

//   useEffect(() => {
//     const handleOutside = (e: any) => {
//       if (ref.current && !ref.current.contains(e.target)) {
//         setOpen(false);
//       }
//     };
//     document.addEventListener("click", handleOutside);
//     return () => document.removeEventListener("click", handleOutside);
//   }, []);

//   const unreadCount = messages.filter((n) => !n.isRead).length;

//   const markAllRead = async () => {
//     await fetch(`${API_URL}/contactus/mark-read`, {
//       method: "PATCH",
//       headers: { Authorization: `Bearer ${getCookie("token")}` },
//     });
//     fetchMessages();
//     setOpen(false);
//     window.location.href = "/admin-panel/contactus";
//   };

//   return (
//     <div ref={ref} className="relative">
//       <button onClick={() => setOpen(!open)} className="relative p-2">
//         <svg className="w-6 h-6 text-black dark:text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
//           <path strokeLinecap="round" strokeLinejoin="round"
//             d="M15 17h5l-1.4-1.4A2 2 0 0118 14V10a6 6 0 10-12 0v4a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1" />
//         </svg>

//         {unreadCount > 0 && (
//           <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-full animate-pulse">
//             {unreadCount}
//           </span>
//         )}
//       </button>

//       {open && (
//         <div className="absolute right-0 mt-2 w-80 bg-[#1f1f1f] text-white rounded-xl shadow-xl border border-gray-700 z-50">
//           <div className="px-4 py-3 font-semibold border-b border-gray-700">
//             Notifications ({unreadCount})
//           </div>

//           {messages.length === 0 ? (
//             <p className="text-gray-400 text-center py-6">No new messages</p>
//           ) : (
//             <ul className="max-h-80 overflow-y-auto">
//               {messages.slice(0, 5).map((msg) => (
//                 <li key={msg.id}>
//                   <button
//                     onClick={markAllRead}
//                     className={`w-full text-left px-4 py-3 border-b border-gray-800 hover:bg-gray-800 ${msg.isRead ? "opacity-60" : "font-bold"}`}
//                   >
//                     {msg.name} — {msg.subject}
//                     <br />
//                     <span className="text-xs text-gray-400">
//                       {new Date(msg.createdAt).toLocaleString()}
//                     </span>
//                   </button>
//                 </li>
//               ))}
//             </ul>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }

