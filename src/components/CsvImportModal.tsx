import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { X, Upload, FileText, CheckCircle2, AlertCircle, Download, ArrowRight } from 'lucide-react';
import { Congregation } from '../types';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  congregations: Congregation[];
  onImportSuccess: () => void;
  onBulkImport: (publishers: any[]) => Promise<{ count: number; message: string }>;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  congregations,
  onImportSuccess,
  onBulkImport
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [targetCongregationId, setTargetCongregationId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    processCsvFile(selectedFile);
  };

  const processCsvFile = (csvFile: File) => {
    setFile(csvFile);
    setError(null);
    setSuccessMessage(null);

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.data || results.data.length === 0) {
          setError('Il file CSV selezionato è vuoto o non leggibile.');
          return;
        }

        const normalized = results.data.map((row: any) => {
          const keys = Object.keys(row);
          const getVal = (...variants: string[]) => {
            for (const v of variants) {
              const foundKey = keys.find((k) => k.trim().toLowerCase() === v.toLowerCase());
              if (foundKey && row[foundKey]) return String(row[foundKey]).trim();
            }
            return '';
          };

          const first_name = getVal('nome', 'first_name', 'firstname', 'proclamatore_nome');
          const last_name = getVal('cognome', 'last_name', 'lastname');
          const cong = getVal('congregazione', 'congregation', 'congregation_name');
          const priv = getVal('privilegio', 'privilegi', 'privilege', 'incarico', 'sigla');
          const birth = getVal('data di nascita', 'data_nascita', 'birth_date', 'nascita');
          const age = getVal('eta', 'età', 'age', 'anni');
          const phone = getVal('telefono', 'cellulare', 'tel', 'phone');
          const email = getVal('email', 'e-mail', 'mail');
          const address = getVal('indirizzo', 'address', 'residenza');
          const notes = getVal('note', 'annotazioni');

          return {
            first_name,
            last_name,
            congregation_name: cong,
            privilege_codes: priv,
            birth_date: birth,
            age: age ? parseInt(age) : null,
            phone,
            email,
            address,
            notes
          };
        }).filter((item: any) => item.first_name || item.last_name);

        if (normalized.length === 0) {
          setError('Non sono state trovate righe valide con "Nome" o "Cognome" nel file CSV.');
          return;
        }

        setParsedData(normalized);
      },
      error: (err) => {
        setError(`Errore durante la lettura del CSV: ${err.message}`);
      }
    });
  };

  const handleDownloadTemplate = () => {
    const csvContent = 
      "Cognome,Nome,Congregazione,Privilegio,Età,Data di Nascita,Telefono,Email,Indirizzo,Note\n" +
      "Rossi,Marco,Milano Sud,SM,38,1988-04-12,+39 340 1234567,marco.rossi@email.it,Via Dante 10 Milano,Reparto audio\n" +
      "Bianchi,Elena,Milano Sud,PA,31,1995-09-20,+39 349 9876543,elena.b@email.it,Via Garibaldi 15 Milano,Pioniera ausiliaria\n" +
      "Verdi,Antonio,Roma Nord,A,52,1974-02-18,+39 347 1122334,antonio.v@email.it,Via Nomentana 100 Roma,Coordinatore\n" +
      "Russo,Chiara,Roma Nord,PR,36,1989-07-30,+39 328 5566778,chiara.r@email.it,Viale Somalia 40 Roma,Pioniera regolare\n" +
      "Esposito,Giuseppe,Napoli Centro,SG,43,1982-11-05,+39 333 4567890,giuseppe.e@email.it,Via Toledo 22 Napoli,Sorvegliante gruppo";

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'modello_proclamatori_congregazioni.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = async () => {
    if (parsedData.length === 0) return;

    try {
      setIsProcessing(true);
      setError(null);

      const toSend = parsedData.map((p) => ({
        ...p,
        congregation_id: targetCongregationId || p.congregation_id
      }));

      const res = await onBulkImport(toSend);
      setSuccessMessage(res.message || `${res.count} proclamatori importati con successo!`);
      setTimeout(() => {
        onImportSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Errore durante l\'importazione.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Importa Proclamatori da CSV
            </h3>
            <p className="text-xs text-slate-500">
              Carica un file Excel o CSV per importare congregazioni, persone e privilegi
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Upload Area */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 hover:border-slate-400 bg-slate-50/70 hover:bg-slate-50 rounded-2xl p-6 text-center cursor-pointer transition-colors"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv,text/csv,application/vnd.ms-excel"
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-slate-200 flex items-center justify-center mx-auto mb-3 text-slate-700">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-800 mb-1">
              {file ? file.name : 'Seleziona o trascina il tuo file CSV'}
            </p>
            <p className="text-xs text-slate-500">
              Supporta formati esportati da Microsoft Excel, Fogli Google, Numbers (.csv)
            </p>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-500">
              Vuoi un file precompilato come esempio?
            </span>
            <button
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Scarica modello CSV
            </button>
          </div>

          {/* Destination Congregation Override */}
          {congregations.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Destinazione Congregazione (Opzionale)
              </label>
              <select
                value={targetCongregationId}
                onChange={(e) => setTargetCongregationId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="">Rileva automaticamente dalla colonna del file CSV</option>
                {congregations.map((c) => (
                  <option key={c.id} value={c.id}>
                    Assegna tutti a: {c.name} {c.city ? `(${c.city})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Parsed Preview Table */}
          {parsedData.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Anteprima Righe Rilevate ({parsedData.length})
                </span>
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Dati pronti per l'importazione
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 sticky top-0 text-slate-700 font-bold">
                    <tr>
                      <th className="py-2 px-3">Cognome</th>
                      <th className="py-2 px-3">Nome</th>
                      <th className="py-2 px-3">Congregazione</th>
                      <th className="py-2 px-3">Privilegio</th>
                      <th className="py-2 px-3">Età</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedData.slice(0, 15).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-1.5 px-3 font-semibold">{row.last_name || '—'}</td>
                        <td className="py-1.5 px-3">{row.first_name || '—'}</td>
                        <td className="py-1.5 px-3 text-slate-500">{row.congregation_name || '—'}</td>
                        <td className="py-1.5 px-3 font-mono font-bold text-blue-600">{row.privilege_codes || '—'}</td>
                        <td className="py-1.5 px-3">{row.age || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Annulla
            </button>
            <button
              type="button"
              disabled={parsedData.length === 0 || isProcessing}
              onClick={handleImport}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-950 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md cursor-pointer transition-colors"
            >
              {isProcessing ? 'Importazione...' : `Importa ${parsedData.length} Proclamatori`}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
