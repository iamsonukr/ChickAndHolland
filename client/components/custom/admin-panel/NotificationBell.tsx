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
//       {/* 🔔 Bell Button */}
//       <button
//         onClick={() => setOpen(!open)}
//         className="relative p-2 group"
//       >
//         <svg
//           className="w-6 h-6 text-amber-400 group-hover:text-yellow-300 transition-all"
//           fill="none"
//           stroke="currentColor"
//           strokeWidth="2.5"
//           viewBox="0 0 24 24"
//         >
//           <path
//             strokeLinecap="round"
//             strokeLinejoin="round"
//             d="M15 17h5l-1.4-1.4A2 2 0 0118 14V10a6 6 0 10-12 0v4a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1"
//           />
//         </svg>

//         {/* 🔴 Badge */}
//         {unreadCount > 0 && (
//           <span className="absolute -top-1 -right-1 bg-gradient-to-br from-red-600 to-red-400 text-white text-xs px-1.5 py-0.5 rounded-full animate-pulse shadow-lg">
//             {unreadCount}
//           </span>
//         )}
//       </button>

//       {/* 📩 Dropdown */}
//       {open && (
//         <div className="absolute right-0 mt-3 w-80 rounded-xl shadow-2xl border border-yellow-500/30 bg-gradient-to-b from-black via-gray-900 to-black backdrop-blur-md z-50 animate-fadeIn scale-100 origin-top-right">
//           <div className="px-4 py-3 font-semibold text-yellow-400 border-b border-yellow-500/20">
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
//                     className={`w-full text-left px-4 py-3 border-b border-yellow-500/20 hover:bg-yellow-500/10 transition-all ${
//                       msg.isRead ? "opacity-50" : "font-bold text-white"
//                     }`}
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
