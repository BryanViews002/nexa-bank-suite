import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Download } from "lucide-react";
import { apiUrl, readApiError, withCredentials } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { toast } from "sonner";

export function StatementsPanel() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleExport = async (format: "json" | "pdf") => {
    if (!from || !to) { toast.error("Select a date range."); return; }
    setLoading(true);
    try {
      const qs = new URLSearchParams({ from, to, format });
      const res = await fetch(apiUrl(`/api/v1/statements?${qs}`), withCredentials);
      if (!res.ok) {
        const apiError = await readApiError(res, "Failed to export statement.");
        if (res.status === 403 && apiError.code === "KYC_REQUIRED") {
          navigate("/kyc");
          return;
        }
        toast.error(apiError.message);
        return;
      }

      const blob = format === "pdf"
        ? await res.blob()
        : new Blob([JSON.stringify(await res.json(), null, 2)], { type: "application/json" });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `statement-${from}-${to}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Statement exported.");
    } catch {
      toast.error("Failed to export statement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Statements" description="Export your transaction history as JSON or PDF." />
      <div className="surface p-6 space-y-4 max-w-md">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">From</label>
            <input type="date" className="input w-full" value={from} onChange={e => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">To</label>
            <input type="date" className="input w-full" value={to} onChange={e => setTo(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn btn-primary btn-sm flex-1" disabled={loading}
            onClick={() => handleExport("json")}>
            <Download className="h-3.5 w-3.5" /> Export JSON
          </button>
          <button type="button" className="btn btn-sm flex-1" disabled={loading}
            onClick={() => handleExport("pdf")}>
            <FileText className="h-3.5 w-3.5" /> Export PDF
          </button>
        </div>
      </div>
    </div>
  );
}
