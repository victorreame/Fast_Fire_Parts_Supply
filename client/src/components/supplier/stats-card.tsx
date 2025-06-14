import React, { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: number | string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: ReactNode;
  iconBgColor: string;
  iconColor: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  changeType = "neutral",
  icon,
  iconBgColor,
  iconColor,
}) => {
  const getChangeColor = () => {
    switch (changeType) {
      case "positive":
        return "text-green-600";
      case "negative":
        return "text-red-600";
      default:
        return "text-yellow-600";
    }
  };

  const getChangeIcon = () => {
    switch (changeType) {
      case "positive":
        return <i className="fas fa-arrow-up mr-1"></i>;
      case "negative":
        return <i className="fas fa-arrow-down mr-1"></i>;
      default:
        return <i className="fas fa-minus mr-1"></i>;
    }
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-neutral-200">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-neutral-500 text-xs sm:text-sm">{title}</p>
          <h3 className="text-xl sm:text-2xl font-bold mt-1">{value}</h3>
          {change && (
            <p className={`${getChangeColor()} text-xs sm:text-sm mt-1 flex items-center`}>
              {getChangeIcon()}
              <span className="hidden xs:inline">{change}</span>
              <span className="inline xs:hidden">{change.split(' ')[0]}</span>
            </p>
          )}
        </div>
        <div className={`${iconBgColor} p-2 sm:p-3 rounded-full`}>
          <span className={`${iconColor} text-sm sm:text-base`}>{icon}</span>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
