// Frontend/src/components/Engagement/EngagementDashboard.jsx
import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  MegaphoneIcon,
  NewspaperIcon,
  CalendarDaysIcon,
  CakeIcon,
  SparklesIcon,
  TrophyIcon,
  ClipboardDocumentCheckIcon,
  ChatBubbleBottomCenterTextIcon,
  ArrowRightOnRectangleIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  XMarkIcon,
  HeartIcon,
  HandThumbUpIcon,
  ShareIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  ClockIcon,
  ArrowDownTrayIcon
} from "@heroicons/react/24/outline";
import {
  SAMPLE_ANNOUNCEMENTS,
  SAMPLE_NEWS,
  SAMPLE_EVENTS,
  SAMPLE_BIRTHDAYS,
  SAMPLE_ANNIVERSARIES,
  SAMPLE_REWARDS,
  SAMPLE_SURVEYS,
  SAMPLE_FEEDBACK,
  getPriorityClass
} from "./engagementData";

const ENGAGEMENT_TABS = [
  { id: "Overview", label: "1. Overview", shortName: "Overview", step: 1, icon: ArrowRightOnRectangleIcon },
  { id: "Announcements", label: "2. Announcements", shortName: "Announcements", step: 2, icon: MegaphoneIcon },
  { id: "News", label: "3. News", shortName: "News", step: 3, icon: NewspaperIcon },
  { id: "Events", label: "4. Events", shortName: "Events", step: 4, icon: CalendarDaysIcon },
  { id: "Birthday", label: "5. Birthday", shortName: "Birthday", step: 5, icon: CakeIcon },
  { id: "Work Anniversary", label: "6. Work Anniversary", shortName: "Work Anniversary", step: 6, icon: SparklesIcon },
  { id: "Rewards", label: "7. Rewards", shortName: "Rewards", step: 7, icon: TrophyIcon },
  { id: "Survey", label: "8. Survey", shortName: "Survey", step: 8, icon: ClipboardDocumentCheckIcon },
  { id: "Feedback", label: "9. Feedback", shortName: "Feedback", step: 9, icon: ChatBubbleBottomCenterTextIcon }
];

const EngagementDashboard = ({ selectedTab, activeTab: propActiveTab, user }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Resolve incoming tab parameter
  const resolveTab = (target) => {
    if (!target) return "Overview";
    const cleaned = target.trim().toLowerCase();
    if (cleaned.includes("dashboard") || cleaned === "overview") return "Overview";
    if (cleaned.includes("announcement")) return "Announcements";
    if (cleaned.includes("news")) return "News";
    if (cleaned.includes("event")) return "Events";
    if (cleaned.includes("birth")) return "Birthday";
    if (cleaned.includes("anniversar")) return "Work Anniversary";
    if (cleaned.includes("reward") || cleaned.includes("recognition")) return "Rewards";
    if (cleaned.includes("survey") || cleaned.includes("poll")) return "Survey";
    if (cleaned.includes("feedback")) return "Feedback";
    const found = ENGAGEMENT_TABS.find(t => t.id.toLowerCase() === cleaned || t.label.toLowerCase() === cleaned);
    return found ? found.id : "Overview";
  };

  const initialTab = resolveTab(selectedTab || propActiveTab || searchParams.get("tab"));
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync state if selectedTab or URL param changes
  useEffect(() => {
    const target = selectedTab || propActiveTab || searchParams.get("tab");
    if (target) {
      setActiveTab(resolveTab(target));
    }
  }, [selectedTab, propActiveTab, searchParams]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    const newParams = new URLSearchParams(searchParams);
    newParams.set("category", "ENGAGEMENT");
    newParams.set("tab", tabId);
    setSearchParams(newParams, { replace: true });
  };

  const currentStepIndex = Math.max(0, ENGAGEMENT_TABS.findIndex(t => t.id === activeTab));
  const prevTab = currentStepIndex > 0 ? ENGAGEMENT_TABS[currentStepIndex - 1] : null;
  const nextTab = currentStepIndex < ENGAGEMENT_TABS.length - 1 ? ENGAGEMENT_TABS[currentStepIndex + 1] : null;

  const goToNextStep = () => {
    if (nextTab) handleTabChange(nextTab.id);
  };

  const goToPrevStep = () => {
    if (prevTab) handleTabChange(prevTab.id);
  };

  // State for interactive features
  const [toastMessage, setToastMessage] = useState("");
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");

  // Announcements State
  const [announcements, setAnnouncements] = useState(SAMPLE_ANNOUNCEMENTS);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [newAnnouncementModal, setNewAnnouncementModal] = useState(false);
  const [newAnnouncementForm, setNewAnnouncementForm] = useState({
    title: "",
    category: "Corporate Broadcast",
    priority: "Normal",
    targetAudience: "All Departments",
    summary: "",
    content: ""
  });

  // News State
  const [newsList, setNewsList] = useState(SAMPLE_NEWS);
  const [selectedNews, setSelectedNews] = useState(null);

  // Events State
  const [eventsList, setEventsList] = useState(SAMPLE_EVENTS);
  const toggleRsvp = (eventId) => {
    setEventsList(prev =>
      prev.map(ev => {
        if (ev.id === eventId) {
          const nextGoing = !ev.isGoing;
          showToast(nextGoing ? `RSVP confirmed for "${ev.title}"!` : `RSVP cancelled for "${ev.title}".`);
          return {
            ...ev,
            isGoing: nextGoing,
            rsvps: nextGoing ? ev.rsvps + 1 : ev.rsvps - 1
          };
        }
        return ev;
      })
    );
  };

  // Birthday & Anniversary Wishes State
  const [birthdays, setBirthdays] = useState(SAMPLE_BIRTHDAYS);
  const [anniversaries, setAnniversaries] = useState(SAMPLE_ANNIVERSARIES);
  const [wishesModal, setWishesModal] = useState({ isOpen: false, recipient: "", type: "" });
  const [wishText, setWishText] = useState("");

  const handleSendWish = (e) => {
    e.preventDefault();
    if (wishesModal.type === "birthday") {
      setBirthdays(prev =>
        prev.map(b => b.employee === wishesModal.recipient ? { ...b, wishesCount: b.wishesCount + 1 } : b)
      );
    } else {
      setAnniversaries(prev =>
        prev.map(a => a.employee === wishesModal.recipient ? { ...a, kudosCount: a.kudosCount + 1 } : a)
      );
    }
    showToast(`Your warm wishes have been sent to ${wishesModal.recipient}! 🎉`);
    setWishesModal({ isOpen: false, recipient: "", type: "" });
    setWishText("");
  };

  // Rewards State
  const [rewards, setRewards] = useState(SAMPLE_REWARDS);
  const [nominateModal, setNominateModal] = useState(false);
  const [nominateForm, setNominateForm] = useState({
    recipient: "",
    awardName: "Star Performer of the Month",
    category: "Technical Excellence",
    citation: ""
  });

  const handleNominateSubmit = (e) => {
    e.preventDefault();
    const newReward = {
      id: Date.now(),
      recipient: nominateForm.recipient,
      recipientId: "EMP" + Math.floor(1000 + Math.random() * 900),
      department: "Cross-Functional",
      awardName: nominateForm.awardName,
      category: nominateForm.category,
      awardedBy: user?.name || "HR Admin",
      date: "Today",
      points: 1500,
      citation: nominateForm.citation
    };
    setRewards([newReward, ...rewards]);
    setNominateModal(false);
    showToast(`Nomination submitted successfully for ${newReward.recipient}!`);
  };

  // Surveys State
  const [surveys, setSurveys] = useState(SAMPLE_SURVEYS);
  const [surveyModal, setSurveyModal] = useState({ isOpen: false, survey: null, rating: 9, comment: "" });
  const handleSurveySubmit = (e) => {
    e.preventDefault();
    setSurveys(prev =>
      prev.map(s => s.id === surveyModal.survey?.id ? { ...s, responsesReceived: s.responsesReceived + 1 } : s)
    );
    showToast(`Thank you! Your feedback for "${surveyModal.survey?.title}" has been recorded.`);
    setSurveyModal({ isOpen: false, survey: null, rating: 9, comment: "" });
  };

  // Feedback State
  const [feedbacks, setFeedbacks] = useState(SAMPLE_FEEDBACK);
  const [feedbackModal, setFeedbackModal] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({ subject: "", category: "Infrastructure" });
  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    const newFb = {
      id: Date.now(),
      subject: feedbackForm.subject,
      category: feedbackForm.category,
      submittedBy: "Anonymous Employee",
      date: "Today",
      status: "Under Review",
      adminRemarks: "Assigned to department coordinator for assessment.",
      upvotes: 1
    };
    setFeedbacks([newFb, ...feedbacks]);
    setFeedbackModal(false);
    setFeedbackForm({ subject: "", category: "Infrastructure" });
    showToast("Feedback submitted to the employee forum anonymously.");
  };

  const handleUpvoteFeedback = (id) => {
    setFeedbacks(prev =>
      prev.map(f => f.id === id ? { ...f, upvotes: f.upvotes + 1 } : f)
    );
    showToast("Feedback upvoted!");
  };

  return (
    <div className="space-y-6 font-sans text-slate-800">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center justify-between text-xs font-bold animate-fade-in border border-emerald-500">
          <div className="flex items-center gap-2.5">
            <CheckCircleIcon className="w-5 h-5 text-white shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage("")} className="p-1 hover:bg-white/20 rounded-lg">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
        <span className="hover:text-slate-600 transition cursor-pointer" onClick={() => handleTabChange("Overview")}>
          Employee Engagement
        </span>
        <span>/</span>
        <span className="hover:text-slate-600 transition cursor-pointer" onClick={() => handleTabChange("Overview")}>
          Dashboard
        </span>
        <span>/</span>
        <span className="text-indigo-600 font-extrabold">{ENGAGEMENT_TABS[currentStepIndex]?.shortName}</span>
      </div>

      {/* Horizontal Nav Sub-Tabs (Sequential Series 1 to 9) */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {ENGAGEMENT_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all duration-150 ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-100 ring-2 ring-indigo-300"
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Series Stepper Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-3 px-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-slate-400 uppercase tracking-wider text-[10px]">
            Series Stage:
          </span>
          <span className="font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full text-xs">
            Step {currentStepIndex + 1} of {ENGAGEMENT_TABS.length} — {ENGAGEMENT_TABS[currentStepIndex]?.shortName}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevStep}
            disabled={!prevTab}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1 ${
              prevTab ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm" : "opacity-40 cursor-not-allowed bg-slate-50 border-slate-200 text-slate-400"
            }`}
          >
            <span>← Previous: {prevTab ? prevTab.shortName : "Start"}</span>
          </button>
          <button
            onClick={goToNextStep}
            disabled={!nextTab}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm ${
              nextTab ? "bg-indigo-600 text-white hover:bg-indigo-700" : "opacity-40 cursor-not-allowed bg-slate-200 text-slate-400"
            }`}
          >
            <span>Next: {nextTab ? nextTab.shortName : "End"} →</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. OVERVIEW PAGE */}
      {/* ========================================================================= */}
      {activeTab === "Overview" && (
        <div className="space-y-6">
          {/* Main Title & Action Bar */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                    People & Culture Hub
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">• Employee Engagement Lifecycle</span>
                </div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Employee Engagement Hub</h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Broadcast corporate circulars, celebrate milestones, organize townhalls, grant peer recognition, and evaluate satisfaction surveys.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setNewAnnouncementModal(true)}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-sm"
                >
                  <PlusIcon className="w-4 h-4 stroke-[2.5]" />
                  <span>+ Post Announcement</span>
                </button>
                <button
                  onClick={() => setNominateModal(true)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition flex items-center gap-1.5 shadow-sm"
                >
                  <TrophyIcon className="w-4 h-4 text-amber-500" />
                  <span>Recognize Peer</span>
                </button>
              </div>
            </div>
          </div>

          {/* 6 Summary KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {[
              { label: "Engagement Index", value: "88%", color: "border-indigo-200 bg-indigo-50/50 text-indigo-900" },
              { label: "Active Broadcasts", value: "12", color: "border-blue-200 bg-blue-50/50 text-blue-900" },
              { label: "Upcoming Events", value: "3", color: "border-purple-200 bg-purple-50/50 text-purple-900" },
              { label: "Celebrations", value: "28", color: "border-pink-200 bg-pink-50/50 text-pink-900" },
              { label: "Kudos Awarded", value: "142", color: "border-amber-200 bg-amber-50/50 text-amber-900" },
              { label: "Survey Participation", value: "84%", color: "border-emerald-200 bg-emerald-50/50 text-emerald-900" }
            ].map((c) => (
              <div key={c.label} className={`rounded-3xl p-4 border shadow-sm ${c.color}`}>
                <span className="text-[10px] font-black uppercase tracking-wider block opacity-70">{c.label}</span>
                <p className="text-2xl font-black mt-1 tracking-tight">{c.value}</p>
              </div>
            ))}
          </div>

          {/* Sequential Series Roadmap Grid (Steps 2 to 9) */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Sequential Engagement Lifecycle Series
              </h3>
              <p className="text-xs text-slate-400">Click any stage below to access dedicated modules directly.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {[
                { step: 2, id: "Announcements", title: "Announcements", desc: "Corporate broadcasts, leadership memos, and holiday circulars.", count: "3 Live", icon: MegaphoneIcon, color: "text-indigo-600 bg-indigo-50" },
                { step: 3, id: "News", title: "Company News", desc: "Quarterly milestones, tech innovation, and press releases.", count: "3 Articles", icon: NewspaperIcon, color: "text-blue-600 bg-blue-50" },
                { step: 4, id: "Events", title: "Events & Townhalls", desc: "Hackathons, wellness sessions, and sports leagues.", count: "3 Upcoming", icon: CalendarDaysIcon, color: "text-purple-600 bg-purple-50" },
                { step: 5, id: "Birthday", title: "Birthday Wall", desc: "Peer birthday wishes, greetings, and celebration alerts.", count: "4 This Month", icon: CakeIcon, color: "text-pink-600 bg-pink-50" },
                { step: 6, id: "Work Anniversary", title: "Work Anniversaries", desc: "Pillar milestones (1, 3, 5+ Years) and tenure honours.", count: "3 Celebrations", icon: SparklesIcon, color: "text-amber-600 bg-amber-50" },
                { step: 7, id: "Rewards", title: "Rewards & Recognition", desc: "Star performers, monthly awards, and peer appreciation points.", count: "3 Spotlighted", icon: TrophyIcon, color: "text-yellow-600 bg-yellow-50" },
                { step: 8, id: "Survey", title: "Pulse Surveys", desc: "eNPS score evaluation and workplace satisfaction audits.", count: "2 Active", icon: ClipboardDocumentCheckIcon, color: "text-emerald-600 bg-emerald-50" },
                { step: 9, id: "Feedback", title: "Feedback & Suggestions", desc: "Anonymous employee feedback box and issue resolutions.", count: "3 Threads", icon: ChatBubbleBottomCenterTextIcon, color: "text-rose-600 bg-rose-50" }
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.id}
                    onClick={() => handleTabChange(s.id)}
                    className="p-4 rounded-2xl border border-slate-200/80 hover:border-indigo-400 bg-slate-50/50 hover:bg-white transition cursor-pointer shadow-2xs hover:shadow-md flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${s.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                          Step {s.step}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-xs text-slate-900 group-hover:text-indigo-600 transition">
                        {s.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{s.desc}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-600">{s.count}</span>
                      <span className="text-indigo-600 font-black group-hover:translate-x-1 transition-transform">
                        Open →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ANNOUNCEMENTS PAGE */}
      {/* ========================================================================= */}
      {activeTab === "Announcements" && (
        <div className="space-y-5">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900">Corporate Announcements & Circulars</h2>
              <p className="text-xs text-slate-400 mt-0.5">Stay informed about leadership announcements, policy updates, and holiday schedules.</p>
            </div>
            <button
              onClick={() => setNewAnnouncementModal(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm shrink-0"
            >
              <PlusIcon className="w-4 h-4 stroke-[2.5]" />
              <span>+ Post Announcement</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {announcements.map((a) => (
              <div key={a.id} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {a.category}
                    </span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${getPriorityClass(a.priority)}`}>
                      {a.priority} Priority
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-slate-900 hover:text-indigo-600 transition cursor-pointer" onClick={() => setSelectedAnnouncement(a)}>
                    {a.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">{a.summary}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                  <span>Published: {a.publishDate}</span>
                  <button
                    onClick={() => setSelectedAnnouncement(a)}
                    className="text-indigo-600 font-bold hover:text-indigo-800"
                  >
                    Read More →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. NEWS PAGE */}
      {/* ========================================================================= */}
      {activeTab === "News" && (
        <div className="space-y-5">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-900">Company News & Achievements</h2>
            <p className="text-xs text-slate-400 mt-0.5">Explore the latest enterprise milestones, technological breakthroughs, and press highlights.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {newsList.map((n) => (
              <div key={n.id} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                    {n.imageTag}
                  </span>
                  <h3 className="text-sm font-black text-slate-900 mt-2">{n.title}</h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">{n.snippet}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{n.date} · {n.readTime}</span>
                  <button
                    onClick={() => setSelectedNews(n)}
                    className="text-indigo-600 font-bold hover:underline"
                  >
                    Full Story →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. EVENTS PAGE */}
      {/* ========================================================================= */}
      {activeTab === "Events" && (
        <div className="space-y-5">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900">Upcoming Company Events</h2>
              <p className="text-xs text-slate-400 mt-0.5">RSVP for townhalls, technical hackathons, cultural fests, and sports leagues.</p>
            </div>
            <button
              onClick={() => showToast("Event creation modal opened for HR organizers.")}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm"
            >
              <PlusIcon className="w-4 h-4 stroke-[2.5]" />
              <span>+ Create Event</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {eventsList.map((e) => (
              <div key={e.id} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                      {e.type}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">{e.rsvps} RSVPs</span>
                  </div>
                  <h3 className="text-sm font-black text-slate-900">{e.title}</h3>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{e.description}</p>

                  <div className="mt-4 space-y-1 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p><strong>Date:</strong> {e.date}</p>
                    <p><strong>Time:</strong> {e.time}</p>
                    <p><strong>Venue:</strong> {e.venue}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t flex justify-end">
                  <button
                    onClick={() => toggleRsvp(e.id)}
                    className={`w-full py-2 rounded-xl text-xs font-black transition ${
                      e.isGoing
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                        : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
                    }`}
                  >
                    {e.isGoing ? "✓ You are Going" : "+ RSVP (Going)"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. BIRTHDAY WALL */}
      {/* ========================================================================= */}
      {activeTab === "Birthday" && (
        <div className="space-y-5">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-900">Celebration Wall — Employee Birthdays</h2>
            <p className="text-xs text-slate-400 mt-0.5">Wish your colleagues a fantastic birthday and send custom appreciation greetings.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {birthdays.map((b) => (
              <div key={b.id} className={`p-5 rounded-2xl border shadow-sm transition hover:shadow-md flex flex-col justify-between ${
                b.isToday ? "bg-pink-50/40 border-pink-200" : "bg-white border-slate-200/80"
              }`}>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-sm">
                      {b.avatar}
                    </div>
                    {b.isToday && (
                      <span className="text-[10px] font-black uppercase text-pink-700 bg-pink-100 px-2 py-0.5 rounded-full border border-pink-200 animate-pulse">
                        🎂 Today!
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-black text-slate-900">{b.employee}</h3>
                  <p className="text-[11px] text-slate-500 font-semibold">{b.designation} · {b.department}</p>
                  <p className="text-xs font-extrabold text-indigo-600 mt-2">Birthday: {b.date}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 font-bold">{b.wishesCount} Wishes</span>
                  <button
                    onClick={() => {
                      setWishesModal({ isOpen: true, recipient: b.employee, type: "birthday" });
                      setWishText(`Happy Birthday, ${b.employee}! Wishing you a wonderful year ahead filled with success and happiness! 🎂🎉`);
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-2xs"
                  >
                    Send Wishes
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. WORK ANNIVERSARY */}
      {/* ========================================================================= */}
      {activeTab === "Work Anniversary" && (
        <div className="space-y-5">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-900">Work Anniversary & Tenure Milestones</h2>
            <p className="text-xs text-slate-400 mt-0.5">Celebrate the loyalty, dedication, and years of excellence of our esteemed team members.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {anniversaries.map((a) => (
              <div key={a.id} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                      {a.badge}
                    </span>
                    <span className="text-xs font-black text-slate-900">{a.yearsCompleted}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-600 text-white font-black text-xs flex items-center justify-center shadow-sm">
                      {a.avatar}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">{a.employee}</h3>
                      <p className="text-[11px] text-slate-400">{a.designation} · {a.department}</p>
                    </div>
                  </div>

                  <p className="text-xs font-bold text-slate-600 mt-3">Anniversary Date: {a.anniversaryDate}</p>
                </div>

                <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 font-bold">{a.kudosCount} Kudos Sent</span>
                  <button
                    onClick={() => {
                      setWishesModal({ isOpen: true, recipient: a.employee, type: "anniversary" });
                      setWishText(`Congratulations on completing ${a.yearsCompleted} at NIB, ${a.employee}! Thank you for your leadership and great contributions! 🌟`);
                    }}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-2xs"
                  >
                    Send Kudos 🌟
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. REWARDS & RECOGNITION */}
      {/* ========================================================================= */}
      {activeTab === "Rewards" && (
        <div className="space-y-5">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900">Rewards & Peer Recognition</h2>
              <p className="text-xs text-slate-400 mt-0.5">Acknowledge stellar achievements, celebrate value champions, and award redeemable bonus points.</p>
            </div>
            <button
              onClick={() => setNominateModal(true)}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm"
            >
              <TrophyIcon className="w-4 h-4 stroke-[2.5]" />
              <span>+ Nominate Peer</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {rewards.map((r) => (
              <div key={r.id} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      {r.awardName}
                    </span>
                    <span className="text-xs font-black text-indigo-600">+{r.points} Pts</span>
                  </div>

                  <h3 className="text-sm font-black text-slate-900">{r.recipient}</h3>
                  <p className="text-[11px] text-slate-400">{r.recipientId} · {r.department}</p>
                  <p className="text-xs text-slate-600 italic mt-3 bg-slate-50 p-3 rounded-xl border">
                    "{r.citation}"
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                  <span>Awarded by: {r.awardedBy}</span>
                  <span>{r.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. SURVEYS & POLLS */}
      {/* ========================================================================= */}
      {activeTab === "Survey" && (
        <div className="space-y-5">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-900">Pulse Surveys & Employee Net Promoter Score</h2>
            <p className="text-xs text-slate-400 mt-0.5">Share confidential insights to help leadership continuously elevate our work culture.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {surveys.map((s) => (
              <div key={s.id} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                      s.status === "Active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"
                    }`}>
                      {s.status}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">Takes ~{s.estimatedMinutes}</span>
                  </div>

                  <h3 className="text-sm font-black text-slate-900">{s.title}</h3>
                  <p className="text-[11px] text-slate-400 mt-1">{s.category} · Deadline: {s.deadline}</p>

                  {/* Progress */}
                  <div className="mt-4 space-y-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-slate-400">Participation</span>
                      <span className="text-indigo-600">{s.participationRate} ({s.responsesReceived}/{s.totalTarget})</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-2 rounded-full" style={{ width: s.participationRate }} />
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t flex justify-end">
                  {s.status === "Active" ? (
                    <button
                      onClick={() => setSurveyModal({ isOpen: true, survey: s, rating: 9, comment: "" })}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm"
                    >
                      Take Survey (Confidential)
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-slate-400 py-1">Survey Concluded</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. FEEDBACK & SUGGESTIONS */}
      {/* ========================================================================= */}
      {activeTab === "Feedback" && (
        <div className="space-y-5">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900">Employee Suggestion & Feedback Forum</h2>
              <p className="text-xs text-slate-400 mt-0.5">Submit suggestions anonymously, upvote community improvements, and monitor admin resolutions.</p>
            </div>
            <button
              onClick={() => setFeedbackModal(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm"
            >
              <PlusIcon className="w-4 h-4 stroke-[2.5]" />
              <span>+ Share Feedback</span>
            </button>
          </div>

          <div className="space-y-3">
            {feedbacks.map((f) => (
              <div key={f.id} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                      {f.category}
                    </span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                      f.status === "Implemented"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-blue-50 text-blue-700 border-blue-200"
                    }`}>
                      {f.status}
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900">{f.subject}</h4>
                  <p className="text-xs text-slate-500 italic">Admin Update: "{f.adminRemarks}"</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => handleUpvoteFeedback(f.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 text-slate-700 text-xs font-bold transition"
                  >
                    <HandThumbUpIcon className="w-4 h-4 text-indigo-600" />
                    <span>{f.upvotes} Upvotes</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* 1. Post Announcement Modal */}
      {newAnnouncementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in text-xs font-sans">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 w-full max-w-lg space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase">Post Corporate Announcement</h3>
              <button onClick={() => setNewAnnouncementModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const newA = {
                  id: Date.now(),
                  title: newAnnouncementForm.title,
                  category: newAnnouncementForm.category,
                  priority: newAnnouncementForm.priority,
                  publishDate: "Today",
                  effectiveDate: "Immediate",
                  author: user?.name || "Corporate Comms",
                  authorRole: "HR Admin",
                  targetAudience: newAnnouncementForm.targetAudience,
                  summary: newAnnouncementForm.summary,
                  content: newAnnouncementForm.summary,
                  readCount: 1,
                  attachment: null
                };
                setAnnouncements([newA, ...announcements]);
                setNewAnnouncementModal(false);
                showToast("Announcement published successfully to all staff!");
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Title *</label>
                <input
                  type="text"
                  value={newAnnouncementForm.title}
                  onChange={(e) => setNewAnnouncementForm({ ...newAnnouncementForm, title: e.target.value })}
                  placeholder="e.g. Q3 Town Hall & Executive Keynote"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Category *</label>
                  <select
                    value={newAnnouncementForm.category}
                    onChange={(e) => setNewAnnouncementForm({ ...newAnnouncementForm, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold"
                  >
                    <option value="Corporate Broadcast">Corporate Broadcast</option>
                    <option value="HR Policy">HR Policy</option>
                    <option value="Holiday Circular">Holiday Circular</option>
                    <option value="Security Alert">Security Alert</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Priority *</label>
                  <select
                    value={newAnnouncementForm.priority}
                    onChange={(e) => setNewAnnouncementForm({ ...newAnnouncementForm, priority: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold"
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Content & Summary *</label>
                <textarea
                  value={newAnnouncementForm.summary}
                  onChange={(e) => setNewAnnouncementForm({ ...newAnnouncementForm, summary: e.target.value })}
                  placeholder="Enter full announcement details..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold h-24"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setNewAnnouncementModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Publish Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Send Wishes Modal */}
      {wishesModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in text-xs font-sans">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 w-full max-w-md space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase">
              Send Warm Greetings to {wishesModal.recipient}
            </h3>
            <form onSubmit={handleSendWish} className="space-y-3">
              <textarea
                value={wishText}
                onChange={(e) => setWishText(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-semibold h-24"
                required
              />
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setWishesModal({ isOpen: false, recipient: "", type: "" })}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Send Greeting 🎉
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Nominate Peer Modal */}
      {nominateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in text-xs font-sans">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 w-full max-w-md space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase">Nominate Colleague for Recognition</h3>
            <form onSubmit={handleNominateSubmit} className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Colleague Name *</label>
                <input
                  type="text"
                  value={nominateForm.recipient}
                  onChange={(e) => setNominateForm({ ...nominateForm, recipient: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Award Title *</label>
                <select
                  value={nominateForm.awardName}
                  onChange={(e) => setNominateForm({ ...nominateForm, awardName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold"
                >
                  <option value="Star Performer of the Month">Star Performer of the Month</option>
                  <option value="Customer Delight Champion">Customer Delight Champion</option>
                  <option value="Innovation Hero Award">Innovation Hero Award</option>
                  <option value="Culture & Team Player">Culture & Team Player</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Citation / Why do they deserve this? *</label>
                <textarea
                  value={nominateForm.citation}
                  onChange={(e) => setNominateForm({ ...nominateForm, citation: e.target.value })}
                  placeholder="Describe their exceptional contribution..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold h-20"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setNominateModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Submit Nomination 🌟
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Survey Response Modal */}
      {surveyModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in text-xs font-sans">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 w-full max-w-md space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase">
              Confidential Survey: {surveyModal.survey?.title}
            </h3>
            <form onSubmit={handleSurveySubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-2">
                  How likely are you to recommend NIB as a great place to work? (1 to 10)
                </label>
                <div className="flex items-center justify-between gap-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setSurveyModal({ ...surveyModal, rating: num })}
                      className={`w-7 h-7 rounded-lg font-black text-xs transition ${
                        surveyModal.rating === num ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Additional Confidential Feedback</label>
                <textarea
                  value={surveyModal.comment}
                  onChange={(e) => setSurveyModal({ ...surveyModal, comment: e.target.value })}
                  placeholder="Share any thoughts on culture, leadership, or tools..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold h-20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setSurveyModal({ isOpen: false, survey: null, rating: 9, comment: "" })}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Submit Survey
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Feedback Submission Modal */}
      {feedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in text-xs font-sans">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 w-full max-w-md space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase">Share Anonymous Employee Feedback</h3>
            <form onSubmit={handleFeedbackSubmit} className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Category *</label>
                <select
                  value={feedbackForm.category}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, category: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold"
                >
                  <option value="Infrastructure">Infrastructure & Workplace</option>
                  <option value="Transport">Transport & Shuttles</option>
                  <option value="HR Policy">HR Policies & Benefits</option>
                  <option value="Cafeteria">Cafeteria & Snacks</option>
                  <option value="IT Tools">IT Tools & Software</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Suggestion / Feedback *</label>
                <textarea
                  value={feedbackForm.subject}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, subject: e.target.value })}
                  placeholder="Describe your suggestion constructively..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold h-24"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setFeedbackModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Post Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. View Announcement Detail Modal */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in text-xs font-sans">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 w-full max-w-lg space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                {selectedAnnouncement.category}
              </span>
              <button onClick={() => setSelectedAnnouncement(null)} className="text-slate-400 hover:text-slate-700 p-1">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <h2 className="text-base font-black text-slate-900">{selectedAnnouncement.title}</h2>
            <p className="text-xs text-slate-600 leading-relaxed">{selectedAnnouncement.content}</p>
            <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 space-y-1">
              <p><strong>Issued By:</strong> {selectedAnnouncement.author} ({selectedAnnouncement.authorRole})</p>
              <p><strong>Published:</strong> {selectedAnnouncement.publishDate} · <strong>Effective:</strong> {selectedAnnouncement.effectiveDate}</p>
              <p><strong>Target Audience:</strong> {selectedAnnouncement.targetAudience}</p>
            </div>
            <div className="flex justify-end pt-2 border-t">
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EngagementDashboard;
