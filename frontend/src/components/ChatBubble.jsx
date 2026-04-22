export default function ChatBubble() {
  return (
    <div className="flex w-full max-w-2xl flex-col gap-4 p-4">
      {/* Pesan dari User / Siswa */}
      <div className="self-end rounded-2xl rounded-tr-none bg-blue-600 px-5 py-3 text-white shadow-sm">
        <p>Bagaimana cara menyelesaikan persamaan linear ini?</p>
      </div>

      {/* Pesan Balasan / Feedback AI (misal: SocraMind) */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 font-bold text-white shadow-sm">
          SM
        </div>
        <div className="self-start rounded-2xl rounded-tl-none border border-gray-200 bg-white px-5 py-3 text-gray-800 shadow-sm">
          <p className="font-semibold text-emerald-600 mb-1">SocraMind Tutor</p>
          <p>
            Mari kita pecahkan bersama! Langkah pertama dalam problem-based learning adalah mengidentifikasi apa yang sudah diketahui. Apa yang bisa kamu simpulkan dari persamaannya?
          </p>
        </div>
      </div>
    </div>
  )
}