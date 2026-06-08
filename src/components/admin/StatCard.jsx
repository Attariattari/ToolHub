import { FaArrowUp, FaArrowDown } from "react-icons/fa"

export default function StatCard({ title, value, icon, change, changeType, footer }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
        </div>
        <div className="p-3 rounded-full bg-blue-50">{icon}</div>
      </div>
      <div className="flex items-center mt-4">
        <span
          className={`inline-flex items-center text-xs font-medium ${changeType === "increase" ? "text-green-600" : "text-blue-600"
            }`}
        >
          {changeType === "increase" ? (
            <FaArrowUp className="mr-1" size={10} />
          ) : (
            <FaArrowDown className="mr-1" size={10} />
          )}
          {change}
        </span>
        <span className="text-xs font-medium text-gray-500 ml-2">{footer}</span>
      </div>
    </div>
  )
}
