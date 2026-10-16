"use client";
export default function Feedback({ message }: { message: string }) {
  return message ? (
    <div
      role="alert"
      className="max-w-[1400px] mx-auto my-4 p-4 rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm"
    >
      {message}
    </div>
  ) : null;
}
