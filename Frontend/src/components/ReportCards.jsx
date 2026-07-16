import {
  UsersIcon,
  UserGroupIcon,
  CalendarIcon,
  BriefcaseIcon,
} from "@heroicons/react/24/outline";

const ReportCards = () => {
  const cards = [
    {
      title: "Total Employees",
      value: "120",
      icon: UsersIcon,
      color: "text-blue-600",
    },
    {
      title: "Active Employees",
      value: "95",
      icon: UserGroupIcon,
      color: "text-green-600",
    },
    {
      title: "Leave Requests",
      value: "18",
      icon: CalendarIcon,
      color: "text-yellow-600",
    },
    {
      title: "Open Jobs",
      value: "12",
      icon: BriefcaseIcon,
      color: "text-purple-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className="bg-white rounded-xl shadow p-6 flex items-center justify-between"
          >
            <div>
              <p className="text-gray-500 font-medium">{card.title}</p>
              <h2 className="text-3xl font-bold mt-2">{card.value}</h2>
            </div>

            <Icon className={`w-12 h-12 ${card.color}`} />
          </div>
        );
      })}
    </div>
  );
};

export default ReportCards;