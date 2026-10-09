import { useState, useRef, useEffect, ChangeEvent } from "react";
import { Search, Bell, Moon, Sun, ChevronDown, Keyboard, Menu, LogOut, ShieldCheck, Zap } from "lucide-react";
import { motion } from "motion/react";
import { Language, translations } from "../lib/translations";
import { useAuth } from "@/hooks/useAuth";

interface HeaderProps {
  language: Language;
  onSearch: (query: string) => void;
  onSelectView: (view: string) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onToggleShortcuts: () => void;
  onToggleSidebar: () => void;
}

export default function Header({
  language,
  onSearch,
  onSelectView,
  isDarkMode,
  onToggleTheme,
  onToggleShortcuts,
  onToggleSidebar,
}: HeaderProps) {
  const [searchVal, setSearchVal] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const t = translations[language];

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchVal(val);
    onSearch(val);
  };

  const notifications = [
    {
      id: 1,
      title: "Critical Risk Found",
      titleHi: "गंभीर जोखिम की पहचान",
      description: "Net-90 payment terms detected in Freelance Agreement.",
      descHi: "Freelance अनुबंध में भुगतान अवधि की पहचान।",
      time: "25 min ago",
      unread: true,
      severity: "critical"
    },
    {
      id: 2,
      title: "Handoff Accepted",
      titleHi: "हैंडऑफ स्वीकार किया गया",
      description: "Sarah Jenkins accepted review on Globex NDA 2024.",
      descHi: "सरह जेनकिंस ने समीक्षा स्वीकार की।",
      time: "2h ago",
      unread: false,
      severity: "info"
    },
    {
      id: 3,
      title: "Analysis Complete",
      titleHi: "विश्लेषण पूर्ण",
      description: "IP Retention Audit Log completed successfully.",
      descHi: "IP डेटा विश्लेषण पुरा हो चुका है।",
      time: "1d ago",
      unread: false,
      severity: "success"
    }
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  const IconBtn = ({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) => (
    <motion.button
      onClick={onClick}
      title={title}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      transition={{ type: "spring", stiffness: 450, damping: 18 }}
      className="p-2 text-slate-500 hover:text-slate-200 rounded-xl hover:bg-white/5 transition-colors outline-none will-change-transform"
    >
      {children}
    </motion.button>
  );

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 flex items-center justify-between h-14 px-4 md:px-6 border-b border-white/[0.06] bg-[#0B0F17]/90 backdrop-blur-xl shrink-0"
    >
      {/* Subtle bottom emerald accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/15 to-transparent pointer-events-none" />

      {/* Left — menu toggle + search */}
      <div className="flex items-center gap-2.5 flex-1 max-w-md">
        <motion.button
          onClick={onToggleSidebar}
          title="Toggle Navigation"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 text-slate-500 hover:text-white rounded-xl hover:bg-white/5 transition-all outline-none will-change-transform shrink-0"
        >
          <Menu className="w-4 h-4" />
        </motion.button>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600 pointer-events-none" />
          <input
            type="text"
            value={searchVal}
            onChange={handleInputChange}
            placeholder={language === "hi" ? "अनुबंध खोजें..." : "Search contracts..."}
            className="w-full bg-white/[0.04] border border-white/[0.08] text-slate-200 placeholder-slate-600 text-xs rounded-xl pl-9 pr-4 py-2 transition-all font-sans focus:bg-white/[0.06]"
          />
        </div>
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-1">
        <IconBtn onClick={onToggleShortcuts} title={language === "hi" ? "कीबोर्ड शॉर्टकट" : "Keyboard Shortcuts"}>
          <Keyboard className="w-4 h-4" />
        </IconBtn>

        <IconBtn onClick={onToggleTheme} title={language === "hi" ? "थीम बदलें" : "Toggle Theme"}>
          {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </IconBtn>

        {/* Notifications */}
        <div className="relative">
          <motion.button
            onClick={() => { setNotificationsOpen(!notificationsOpen); setUserMenuOpen(false); }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: "spring", stiffness: 450, damping: 18 }}
            className="relative p-2 text-slate-500 hover:text-slate-200 rounded-xl hover:bg-white/5 transition-colors outline-none will-change-transform"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-emerald-pulse" />
            )}
          </motion.button>

          {notificationsOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-slate-700/70 bg-[#0F1522] shadow-2xl shadow-black/50 overflow-hidden z-[9999]">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <Bell className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-semibold text-white">
                    {language === "hi" ? "लीगल-लेंस अलर्ट" : "LegalLens Alerts"}
                  </span>
                </div>
                <span className="px-2 py-0.5 text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                  {unreadCount} {language === "hi" ? "नए" : "New"}
                </span>
              </div>
              {/* Items */}
              <div className="divide-y divide-white/[0.04]">
                {notifications.map((notif) => (
                  <div key={notif.id} className={`px-4 py-3 hover:bg-white/[0.03] transition-colors cursor-pointer ${notif.unread ? "bg-emerald-500/[0.03]" : ""}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {notif.unread && <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shrink-0 mt-0.5" />}
                        <p className={`text-xs font-semibold truncate ${notif.unread ? "text-slate-100" : "text-slate-400"}`}>
                          {language === "hi" ? notif.titleHi : notif.title}
                        </p>
                      </div>
                      <span className="text-[9px] text-slate-600 font-mono shrink-0">{notif.time}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-relaxed pl-3.5">
                      {language === "hi" ? notif.descHi : notif.description}
                    </p>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2.5 border-t border-white/[0.06] bg-white/[0.02]">
                <button className="text-[10px] text-emerald-400 hover:text-emerald-300 transition-colors font-medium">
                  {language === "hi" ? "सभी देखें →" : "View all alerts →"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="w-px h-5 bg-white/[0.08] mx-1" />

        {/* User profile */}
        <div className="relative">
          <motion.button
            onClick={() => { setUserMenuOpen(!userMenuOpen); setNotificationsOpen(false); }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 hover:bg-white/5 px-2 py-1.5 rounded-xl transition-all outline-none"
          >
            <div className="w-7 h-7 rounded-full border border-emerald-500/25 overflow-hidden bg-slate-800 flex items-center justify-center shrink-0">
              {user?.avatar ? (
                <img referrerPolicy="no-referrer" src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] font-bold text-emerald-400">
                  {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="hidden sm:block text-left min-w-0">
              <p className="text-[11px] font-semibold text-slate-200 max-w-[120px] truncate leading-none">
                {user?.name || user?.email || "Account"}
              </p>
              <p className="text-[9px] text-emerald-600 font-mono mt-0.5 leading-none">
                {language === "hi" ? "सत्यापित" : "Verified"}
              </p>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-600 hidden sm:block shrink-0" />
          </motion.button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-slate-700/70 bg-[#0F1522] shadow-2xl shadow-black/50 overflow-hidden z-[9999]">
              {/* User info header */}
              <div className="px-4 py-3 border-b border-white/[0.06]">
                <p className="text-xs font-semibold text-slate-200 truncate">{user?.name || "Account"}</p>
                <p className="text-[10px] text-slate-500 truncate mt-0.5">{user?.email}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span className="text-[9px] text-emerald-500 font-mono">{language === "hi" ? "सत्यापित खाता" : "Verified Account"}</span>
                </div>
              </div>
              {/* Menu items */}
              <div className="p-2 space-y-0.5">
                <button
                  onClick={() => { setUserMenuOpen(false); onSelectView("settings"); }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                >
                  {language === "hi" ? "⚙️ सेटिंग्स" : "⚙️ Settings"}
                </button>
                <button
                  onClick={() => logout()}
                  className="w-full text-left px-3 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/8 rounded-xl transition-all flex items-center gap-2"
                >
                  <LogOut className="w-3 h-3" />
                  {language === "hi" ? "साइन आउट" : "Sign out"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
