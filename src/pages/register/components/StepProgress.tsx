const STEPS = ['School Info', 'Director', 'Choose Plan', 'Review'];

interface Props {
  current: number; // 0-indexed
}

export default function StepProgress({ current }: Props) {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between relative">
        {/* connector line */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 -z-0"></div>
        <div
          className="absolute top-4 left-0 h-0.5 bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500 -z-0"
          style={{ width: `${(current / (STEPS.length - 1)) * 100}%` }}
        ></div>

        {STEPS.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <div key={i} className="flex flex-col items-center gap-2 z-10">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${
                done
                  ? 'bg-teal-500 border-teal-500 text-white'
                  : active
                  ? 'bg-white border-teal-500 text-teal-600'
                  : 'bg-white border-gray-300 text-gray-400'
              }`}>
                {done ? <i className="ri-check-line text-sm"></i> : i + 1}
              </div>
              <span className={`text-xs font-medium whitespace-nowrap hidden sm:block ${active ? 'text-teal-600' : done ? 'text-gray-600' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
