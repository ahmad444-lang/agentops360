"use client";

import { useEffect, useState } from "react";
import Papa from "papaparse";
import {
  Database,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";

type ParsedRow = Record<string, string>;

type SavedDataSource = {
  id: string;
  name: string;
  type: string;
  description: string | null;
  rowCount: number;
  createdAt: string;
};

export default function DataSourcesPage() {
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [savedSources, setSavedSources] = useState<SavedDataSource[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState("");

  async function loadSavedSources() {
    try {
      const response = await fetch("/api/data-sources");
      const data = await response.json();

      setSavedSources(data.dataSources ?? []);
    } catch {
      setError("Saved data sources load nahi ho sake.");
    }
  }

  useEffect(() => {
    loadSavedSources();
  }, []);

  async function saveDataSourceToDatabase({
    name,
    rowCount,
    columns,
  }: {
    name: string;
    rowCount: number;
    columns: string[];
  }) {
    setIsSaving(true);
    setIsSaved(false);
    setError("");

    try {
      const response = await fetch("/api/data-sources", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description: `Uploaded CSV file: ${name}`,
          rowCount,
          columns,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save data source.");
      }

      setIsSaved(true);
      await loadSavedSources();
    } catch {
      setError("CSV preview ho gayi, lekin database mein save nahi hui.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    setFileName(file.name);
    setRows([]);
    setColumns([]);
    setIsSaved(false);
    setError("");

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const parsedData = results.data as ParsedRow[];
        const parsedColumns =
          parsedData.length > 0 ? Object.keys(parsedData[0]) : [];

        setRows(parsedData);
        setColumns(parsedColumns);

        await saveDataSourceToDatabase({
          name: file.name,
          rowCount: parsedData.length,
          columns: parsedColumns,
        });
      },
      error: () => {
        setError("CSV file parse nahi ho saki. File format check karo.");
      },
    });
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <p className="text-sm font-medium text-cyan-400">AgentOps360</p>

          <h1 className="mt-2 text-3xl font-bold">Data Sources</h1>

          <p className="mt-2 text-slate-400">
            Upload CSV files taake AI agents business data use kar saken.
          </p>
        </div>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center gap-3">
            <Database className="h-6 w-6 text-cyan-400" />
            <h2 className="text-xl font-semibold">Upload CSV Data</h2>
          </div>

          <label className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-950 p-10 text-center hover:border-cyan-400">
            <Upload className="h-10 w-10 text-cyan-400" />

            <p className="mt-4 text-lg font-medium">Click to upload CSV</p>

            <p className="mt-2 text-sm text-slate-500">
              Customer tickets, orders, refunds, analytics waghera
            </p>

            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {fileName && (
            <div className="mt-6 rounded-xl border border-green-800 bg-green-950/30 p-4">
              <div className="flex items-center gap-3">
                {isSaving ? (
                  <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                )}

                <div>
                  <p className="font-medium text-green-300">File Uploaded</p>
                  <p className="text-sm text-green-500">{fileName}</p>

                  <p className="mt-1 text-sm text-green-400">
                    {isSaving
                      ? "Saving to database..."
                      : isSaved
                        ? "Saved to database successfully"
                        : "Preview ready"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-xl border border-red-900 bg-red-950/40 p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <p className="text-sm text-red-200">{error}</p>
              </div>
            </div>
          )}
        </section>

        {rows.length > 0 && (
          <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900">
            <div className="border-b border-slate-800 p-5">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-5 w-5 text-cyan-400" />
                <h2 className="text-lg font-semibold">CSV Preview</h2>
              </div>

              <p className="mt-2 text-sm text-slate-400">
                Showing first 10 rows from uploaded CSV. Total rows:{" "}
                {rows.length}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-800 text-slate-400">
                  <tr>
                    {columns.map((column) => (
                      <th key={column} className="px-5 py-4">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {rows.slice(0, 10).map((row, index) => (
                    <tr key={index} className="border-b border-slate-800">
                      {columns.map((column) => (
                        <td key={column} className="px-5 py-4 text-slate-300">
                          {row[column]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 p-5">
            <h2 className="text-lg font-semibold">Saved Data Sources</h2>
            <p className="mt-2 text-sm text-slate-400">
              Yeh woh CSV/data sources hain jo database mein save ho chuke hain.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="px-5 py-4">Name</th>
                  <th className="px-5 py-4">Type</th>
                  <th className="px-5 py-4">Rows</th>
                  <th className="px-5 py-4">Description</th>
                  <th className="px-5 py-4">Created</th>
                </tr>
              </thead>

              <tbody>
                {savedSources.map((source) => (
                  <tr key={source.id} className="border-b border-slate-800">
                    <td className="px-5 py-4 font-medium text-white">
                      {source.name}
                    </td>

                    <td className="px-5 py-4 text-slate-300">
                      {source.type}
                    </td>

                    <td className="px-5 py-4 text-slate-300">
                      {source.rowCount.toLocaleString()}
                    </td>

                    <td className="px-5 py-4 text-slate-400">
                      {source.description ?? "No description"}
                    </td>

                    <td className="px-5 py-4 text-slate-400">
                      {new Date(source.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}

                {savedSources.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-slate-400">
                      No saved data sources yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}