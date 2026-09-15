export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2">
      <h1 className="text-xl font-semibold">Record not found</h1>
      <p className="text-sm text-muted-foreground">The requested CRM record does not exist or you do not have access.</p>
    </div>
  );
}
