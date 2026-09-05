export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-lg animate-pulse space-y-4">
        <div className="mx-auto h-20 w-20 rounded-full bg-gray-200" />
        <div className="mx-auto h-6 w-48 rounded bg-gray-200" />
        <div className="mx-auto h-4 w-32 rounded bg-gray-200" />
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="h-10 rounded bg-gray-200" />
              <div className="h-10 rounded bg-gray-200" />
            </div>
            <div className="h-10 rounded bg-gray-200" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-10 rounded bg-gray-200" />
              <div className="h-10 rounded bg-gray-200" />
            </div>
            <div className="h-10 rounded bg-gray-200" />
            <div className="h-10 w-full rounded bg-gray-200" />
          </div>
        </div>
      </div>
    </div>
  );
}
