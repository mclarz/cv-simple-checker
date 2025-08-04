"use client";

import { useState } from "react";
import { set } from "zod/v4";

import { api } from "~/trpc/react";

export function User() {
  interface FormData {
    fullName: string;
    email: string;
    phone: string;
    skills: string; // this will separated by commas
    experience: string;
  }

  const [file, setFile] = useState<File | null>(null);

  // set file error message
  const [fileError, setFileError] = useState<string | null>(null);

  const utils = api.useUtils();

  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    phone: "",
    skills: "",
    experience: "",
  });

  const [result, setResult] = useState<{
    status: string;
    message: string;
    errors?: string[];
  } | null>(null);

  const submitMutation = api.cv.submit.useMutation({
    onSuccess: async () => {
      await utils.cv.invalidate();
    },
    onError: (error) => {
      console.error("TRPC Error:", error);
      alert(JSON.stringify(error, null, 2));
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      alert("Please upload a PDF file.");
      return;
    }

    // Create FormData to send the file
    const fd = new FormData();
    fd.append("file", file);
    const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });

    // check the file upload has error
    // set the error to the fileError state
    if (!uploadRes.ok) {
      const errorData = await uploadRes.json();
      setFileError(errorData.error || "File upload failed");
      return;
    }
    setFileError(null); // Clear any previous errors
    const { filePath } = await uploadRes.json();

    const result = await submitMutation.mutateAsync({
      ...formData,
      pdfPath: filePath,
    });

    setResult(result);
  };

  return (
    <div className="w-full max-w-xs">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input
          type="text"
          placeholder="Full Namesss"
          value={formData.fullName}
          onChange={(e) =>
            setFormData({ ...formData, fullName: e.target.value })
          }
          className="w-full rounded-full bg-white/10 px-4 py-2 text-white"
        />
        <input
          type="text"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full rounded-full bg-white/10 px-4 py-2 text-white"
        />
        <input
          type="text"
          placeholder="Phone Number"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="w-full rounded-full bg-white/10 px-4 py-2 text-white"
        />
        <input
          type="text"
          placeholder="Skills (Comma Separated)"
          value={formData.skills}
          onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
          className="w-full rounded-full bg-white/10 px-4 py-2 text-white"
        />
        <input
          type="text"
          placeholder="Experience (Years)"
          value={formData.experience}
          onChange={(e) =>
            setFormData({ ...formData, experience: e.target.value })
          }
          className="w-full rounded-full bg-white/10 px-4 py-2 text-white"
        />

        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="w-full rounded-full bg-white/10 px-4 py-2 text-white"
        />
        {fileError && <p className="text-red-500">{fileError}</p>}
        <button
          type="submit"
          className="rounded-full bg-white/10 px-10 py-3 font-semibold transition hover:bg-white/20"
          disabled={submitMutation.isPending}
        >
          {submitMutation.isPending ? "Submitting..." : "Submit"}
        </button>
      </form>

      {result?.status === "fail" && (
        <p className="text-red-500">{result.message}</p>
      )}
    </div>
  );
}
