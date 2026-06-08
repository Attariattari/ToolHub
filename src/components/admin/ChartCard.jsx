export default function ChartCard({ title, children, actions }) {
  return (
    <div className="bg-white rounded-lg h-full shadow-sm border border-gray-200 overflow-hidden transition-all hover:shadow-md">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        {actions && <div>{actions}</div>}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}
