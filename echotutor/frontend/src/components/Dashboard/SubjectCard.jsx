import { motion } from 'framer-motion'

export default function SubjectCard({ subject, index, onSelect, disabled }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      whileHover={{ y: -3, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={onSelect}
      disabled={disabled}
      className="relative flex flex-col items-center justify-center gap-2 p-4 bg-white rounded-2xl border-2 border-gray-100 hover:border-echo-200 shadow-sm hover:shadow-echo transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-center group"
      aria-label={`Start lesson on ${subject.name}`}
    >
      {/* Colour accent dot */}
      <div
        className="absolute top-3 right-3 w-2 h-2 rounded-full opacity-60 group-hover:opacity-100 transition-opacity"
        style={{ background: subject.color }}
      />

      <span
        className="text-3xl group-hover:scale-110 transition-transform duration-200"
        role="img" aria-hidden="true"
      >
        {subject.icon}
      </span>

      <div>
        <p className="font-semibold text-gray-800 text-sm leading-tight">{subject.name}</p>
        <p className="text-xs text-gray-400 mt-0.5 leading-tight">{subject.desc}</p>
      </div>
    </motion.button>
  )
}
