import React, { useState } from 'react';
import { Report } from '../types/index.js';
import { api } from '../lib/api.js';
import { X, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';

interface ClaimModalProps {
  report: Report;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ClaimModal: React.FC<ClaimModalProps> = ({
  report,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [descriptionDetails, setDescriptionDetails] = useState('');
  const [uniqueMarks, setUniqueMarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descriptionDetails.trim()) {
      setError('Please provide identifying details to substantiate your ownership claim.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.post(`/reports/${report.publicId}/claims`, {
        answers: {
          identifyingDetails: descriptionDetails.trim(),
          uniqueMarks: uniqueMarks.trim(),
        },
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit claim.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-md shadow-2xl border border-slate-200 overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-sm text-slate-400 hover:text-blue-700 hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 bg-gradient-to-b from-blue-50 to-white border-b border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="p-2 rounded-sm bg-blue-100 text-blue-700 font-bold">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Submit Ownership Claim</h2>
              <p className="text-xs text-slate-500">
                Item: {report.title} ({report.publicId})
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-sm bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3.5 rounded-sm bg-blue-50 border border-blue-200 text-blue-950 text-xs leading-relaxed">
            <p className="font-bold mb-0.5 text-blue-900">Verification Instructions:</p>
            Describe identifying characteristics that are not visible in the public photographs (e.g. wallpaper, contents of pockets, specific scratches, engraving, or serial numbers). The finder or reception desk will verify this before returning the item.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Detailed Ownership Proof / Contents *
            </label>
            <textarea
              required
              rows={3}
              value={descriptionDetails}
              onChange={(e) => setDescriptionDetails(e.target.value)}
              placeholder="e.g. Inside the wallet there is a blue metro card with ID ending in 402, and two passport photos..."
              className="w-full p-3 text-xs rounded-sm border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Any Unique Marks, Stickers, or Serial Numbers (Optional)
            </label>
            <input
              type="text"
              value={uniqueMarks}
              onChange={(e) => setUniqueMarks(e.target.value)}
              placeholder="e.g. Small red anime sticker on back corner, serial ending in 81A"
              className="w-full px-3 py-2.5 text-xs rounded-sm border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-sm text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-xs font-bold rounded-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Claim'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
