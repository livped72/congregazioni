import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { X, Upload, FileText, CheckCircle2, AlertCircle, Download, ArrowRight } from 'lucide-react';
import { Congregation } from '../types';
import { parseItalianFullName, inferGender, getDisplayName } from '../nameUtils';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  congregations: Congregation[];
  onImportSuccess: () => void;
  onBulkImport: (publishers: any[]) => { count: number; message: string };
}

// Normalize strings by removing diacritics, all styles of apostrophes, quotes, and non-alphanumeric chars
const normKey = (s: string): string =>
  s.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[''’`"_\-\.\/\\;:,\(\)\[\]\{\}]/g, ' ')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

// Guess congregation name from file name (e.g. "SALERNO PORTO -Tabella 1.csv" -> "Salerno Porto")
function guessCongregationFromFileName(fileName: string): string {
  if (!fileName) return '';
  let clean = fileName.replace(/\.[^/.]+$/, ''); // strip extension
  // Remove sheet suffix like "-Tabella 1", "_Foglio 1", " - Sheet 1"
  clean = clean.replace(/[\s\-_]*(tabella|foglio|sheet)\s*\d*$/i, '');
  // Remove common export prefixes like "A-", "B-", "b_", "Congregazione-", "Elenco-"
  clean = clean.replace(/^([a-z][\-_]|congregazione[\-_]|elenco[\-_]|lista[\-_]|proclamatori[\-_])/i, '');
  clean = clean.trim();
  if (
    clean.length >= 2 &&
    !/^(tabella|sheet|export|dati|backup|archivio|anziani|servitori|pionieri|inattivi|gruppo)$/i.test(clean)
  ) {
    return clean;
  }
  return '';
}

// Detect header line, delimiter, and whether file has headers
function detectCsvHeaderAndDelimiter(rawText: string): { delimiter: string; headerIndex: number; hasHeader: boolean } {
  let clean = rawText;
  if (clean.charCodeAt(0) === 0xFEFF) clean = clean.slice(1);
  const lines = clean.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length === 0) return { delimiter: ';', headerIndex: 0, hasHeader: false };

  const candidateDelims = [';', ',', '\t', '|'];
  const headerKeywords = [
    'cognome', 'nome', 'congregazione', 'privilegio', 'privilegi', 'inc', 'pr',
    'eta', 'data', 'note', 'telefono', 'sesso', 'nominativo', 'proclamatore',
    'surname', 'name', 'congregation', 'privilege', 'age', 'date', 'notes'
  ];

  let bestKeywordCount = 0;
  let bestKeywordDelim = ';';
  let bestKeywordLine = 0;

  for (let lineIdx = 0; lineIdx < Math.min(15, lines.length); lineIdx++) {
    const line = lines[lineIdx];
    for (const d of candidateDelims) {
      const parts = line.split(d).map((p) => normKey(p)).filter(Boolean);
      if (parts.length < 2) continue;
      const matches = parts.filter((p) =>
        headerKeywords.some((k) => p === k || (p.length >= 3 && k.length >= 3 && (p.includes(k) || k.includes(p))))
      ).length;

      if (matches >= 1 && matches > bestKeywordCount) {
        bestKeywordCount = matches;
        bestKeywordDelim = d;
        bestKeywordLine = lineIdx;
      }
    }
  }

  if (bestKeywordCount >= 1) {
    return { delimiter: bestKeywordDelim, headerIndex: bestKeywordLine, hasHeader: true };
  }

  // Fallback to separator consistency
  let bestScore = -1;
  let fallbackDelim = ';';
  let fallbackIndex = 0;

  for (const d of candidateDelims) {
    const counts = lines.slice(0, 20).map((l) => l.split(d).length);
    for (let startIdx = 0; startIdx < Math.min(5, lines.length); startIdx++) {
      const colCount = counts[startIdx];
      if (colCount < 2) continue;
      const consistentRows = counts.slice(startIdx).filter((c) => c === colCount).length;
      const score = colCount * consistentRows;
      if (score > bestScore) {
        bestScore = score;
        fallbackDelim = d;
        fallbackIndex = startIdx;
      }
    }
  }

  return { delimiter: fallbackDelim, headerIndex: fallbackIndex, hasHeader: false };
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
  const [detectedDelimiter, setDetectedDelimiter] = useState<string>(';');
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

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        let text = e.target?.result as string;
        if (!text) {
          setError('Il file caricato è vuoto.');
          return;
        }

        // Strip BOM
        if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
        text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

        // Automatic detection of real header, delimiter and headerless mode
        const detection = detectCsvHeaderAndDelimiter(text);
        setDetectedDelimiter(detection.delimiter);

        const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
        if (detection.headerIndex >= lines.length) {
          setError('Nessuna riga valida trovata nel file CSV.');
          return;
        }

        const cleanCsvText = lines.slice(detection.headerIndex).join('\n');
        const fileCongName = guessCongregationFromFileName(csvFile.name);

        Papa.parse(cleanCsvText, {
          delimiter: detection.delimiter,
          header: detection.hasHeader,
          skipEmptyLines: true,
          complete: (results) => {
            if (!results.data || results.data.length === 0) {
              setError('Nessun dato trovato nel file CSV dopo la riga di intestazione.');
              return;
            }

            const rawKeys = results.meta.fields || [];
            const keyMap: Record<string, string> = {};
            rawKeys.forEach((k) => {
              keyMap[normKey(k)] = k;
            });

            // Exact key getter: checks exact normalized key first
            const getVal = (row: any, ...variants: string[]): string => {
              for (const v of variants) {
                const nv = normKey(v);
                if (keyMap[nv] !== undefined && row[keyMap[nv]] != null) {
                  const val = String(row[keyMap[nv]]).trim();
                  if (val) return val;
                }
              }
              return '';
            };

            // Congregation inheritance across rows
            let lastSeenCongregation = fileCongName;

            const normalized = (results.data as any[]).map((row: any) => {
              let first_name = '';
              let last_name = '';

              if (detection.hasHeader) {
                // Priority 1: Check combined name column first
                const combinedKey = Object.keys(keyMap).find((k) =>
                  [
                    'cognome e nome',
                    'nome e cognome',
                    'cognome nome',
                    'nome cognome',
                    'nominativo',
                    'nome completo',
                    'full name',
                    'fullname',
                    'proclamatore',
                    'persona'
                  ].includes(k)
                );

                if (combinedKey) {
                  const full = String(row[keyMap[combinedKey]] || '').trim();
                  if (full) {
                    if (
                      combinedKey.startsWith('nome e cognome') ||
                      combinedKey.startsWith('nome cognome') ||
                      combinedKey === 'full name' ||
                      combinedKey === 'fullname'
                    ) {
                      const parts = full.split(/\s+/).filter(Boolean);
                      first_name = parts[0] || '';
                      last_name = parts.slice(1).join(' ');
                    } else {
                      const parsedName = parseItalianFullName(full);
                      last_name = parsedName.last_name;
                      first_name = parsedName.first_name;
                    }
                  }
                } else {
                  // Priority 2: Check separate cognome and nome columns (exact match only!)
                  const cognomeKey = Object.keys(keyMap).find((k) =>
                    ['cognome', 'last name', 'lastname', 'surname', 'cognome proclamatore'].includes(k)
                  );
                  const nomeKey = Object.keys(keyMap).find((k) =>
                    ['nome', 'first name', 'firstname', 'name', 'nome proclamatore'].includes(k)
                  );

                  if (cognomeKey && row[keyMap[cognomeKey]] != null) {
                    last_name = String(row[keyMap[cognomeKey]]).trim();
                  }
                  if (nomeKey && row[keyMap[nomeKey]] != null) {
                    first_name = String(row[keyMap[nomeKey]]).trim();
                  }
                }
              } else {
                // Headerless mode: check first textual non-empty cell
                const values = Array.isArray(row) ? row : Object.values(row);
                for (const v of values) {
                  const str = String(v || '').trim();
                  if (str && /[a-zA-Z]/.test(str)) {
                    const parsedName = parseItalianFullName(str);
                    last_name = parsedName.last_name;
                    first_name = parsedName.first_name;
                    break;
                  }
                }
              }

              // Positional fallback if still empty:
              if (!last_name && !first_name && rawKeys.length >= 1) {
                for (const k of rawKeys) {
                  const v = row[k] != null ? String(row[k]).trim() : '';
                  if (v && /[a-zA-Z]/.test(v) && !/^\d+([,\.]\d+)?$/.test(v)) {
                    const parsedName = parseItalianFullName(v);
                    last_name = parsedName.last_name;
                    first_name = parsedName.first_name;
                    break;
                  }
                }
              }

              // De-duplication check: if last_name and first_name were set to identical strings
              if (last_name && first_name && last_name.toLowerCase().trim() === first_name.toLowerCase().trim()) {
                const parsedName = parseItalianFullName(last_name);
                last_name = parsedName.last_name;
                first_name = parsedName.first_name;
              }

              // Filter out summary/statistics rows (e.g. "69", "23", or rows without letters)
              const fullName = `${last_name} ${first_name}`.trim();
              if (!fullName || !/[a-zA-ZàèéìòùÀÈÉÌÒÙ]/.test(fullName)) {
                return null;
              }
              if (/^(totale|tot|media|conteggio|summary)$/i.test(fullName)) {
                return null;
              }

              // 2. Congregation
              const congRow = getVal(row, 'congregazione', 'congregation', 'cong');
              if (congRow) {
                lastSeenCongregation = congRow;
              }
              const congregation_name = congRow || lastSeenCongregation;

              // 3. Privileges (handles "privilegio", "privilegi", "inc", "pr", "incarico")
              let priv = getVal(row, 'privilegio', 'privilegi', 'privilege', 'incarico', 'inc', 'pr', 'sigla', 'ruolo');
              if (priv) {
                priv = priv.replace(/falso|vero|true|false/gi, '').trim();
              }

              // 4. Age and Birth Date
              const ageStr = getVal(row, 'eta', 'age', 'anni');
              const birthStr = getVal(row, 'data', 'data nascita', 'data di nascita', 'birth date', 'anno', 'anno nascita');

              let age: number | null = null;
              let birth_date = birthStr;

              // Handle 4-digit years in age column
              if (ageStr) {
                const num = parseInt(ageStr, 10);
                if (!isNaN(num)) {
                  if (num >= 1900 && num <= 2100) {
                    birth_date = birth_date || String(num);
                    const calculated = new Date().getFullYear() - num;
                    age = calculated >= 0 && calculated <= 120 ? calculated : null;
                  } else if (num >= 0 && num <= 120) {
                    age = num;
                  }
                }
              }

              // If age is missing but birth_date is a 4-digit year, calculate age
              if (age === null && birth_date && /^\d{4}$/.test(birth_date.trim())) {
                const year = parseInt(birth_date.trim(), 10);
                const calculated = new Date().getFullYear() - year;
                if (calculated >= 0 && calculated <= 120) {
                  age = calculated;
                }
              }

              // 5. Gender
              const genderRaw = getVal(row, 'sesso', 'genere', 'gender', 'm f');
              let gender: 'M' | 'F' = 'M';
              if (genderRaw) {
                const gNorm = genderRaw.toLowerCase();
                if (gNorm.startsWith('f') || gNorm.includes('sorella') || gNorm.includes('donna')) {
                  gender = 'F';
                } else {
                  gender = 'M';
                }
              } else {
                gender = inferGender(first_name, priv);
              }

              // 6. Notes & other fields
              const notes = getVal(row, 'note', 'annotazioni', 'notes', 'commenti');
              const phone = getVal(row, 'telefono', 'cellulare', 'tel', 'phone', 'mobile');
              const email = getVal(row, 'email', 'e mail', 'mail');
              const address = getVal(row, 'indirizzo', 'address', 'residenza', 'via');

              return {
                first_name: first_name.trim(),
                last_name: last_name.trim(),
                congregation_name: congregation_name.trim(),
                privilege_codes: priv.trim().toUpperCase(),
                birth_date: birth_date.trim(),
                age,
                gender,
                phone: phone.trim(),
                email: email.trim(),
                address: address.trim(),
                notes: notes.trim(),
              };
            }).filter(Boolean);

            if (normalized.length === 0) {
              const detectedCols = rawKeys.join(' | ');
              setError(
                `Nessuna riga valida trovata.\n` +
                `Separatore: "${detection.delimiter === '\t' ? 'TAB' : detection.delimiter}" — Colonne lette: [${detectedCols}]\n` +
                `Assicurati che il file contenga almeno una colonna come "COGNOME E NOME" o "Cognome" e "Nome".`
              );
              return;
            }

            setParsedData(normalized);
          },
          error: (err: any) => {
            setError(`Errore lettura CSV: ${err.message}`);
          }
        });
      } catch (err: any) {
        setError(`Errore: ${err.message}`);
      }
    };

    reader.onerror = () => setError('Impossibile leggere il file. Assicurati che sia un file CSV o testo valido.');
    reader.readAsText(csvFile, 'UTF-8');
  };

  const handleDownloadTemplate = () => {
    // Standard European format with semicolon, UTF-8 BOM
    const csvContent =
      'COGNOME E NOME;CONGREGAZIONE;PRIVILEGIO;ETÀ;DATA;NOTE\n' +
      'Rossi Marco;Milano Sud;SM;38;1988;Reparto audio\n' +
      'Bianchi Elena;Milano Sud;PA;31;1995;Pioniera ausiliaria\n' +
      'Verdi Antonio;Roma Nord;A;52;1974;Coordinatore\n' +
      'Russo Chiara;Roma Nord;PR;36;1990;Pioniera regolare\n' +
      'Esposito Giuseppe;Napoli Centro;SG;43;1983;Sorvegliante gruppo';

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'modello_proclamatori.csv');
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

      const res = onBulkImport(toSend);
      setSuccessMessage(res.message || `${res.count} proclamatori importati con successo!`);
      setTimeout(() => {
        onImportSuccess();
        onClose();
      }, 1000);
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
              <span className="whitespace-pre-line">{error}</span>
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
              accept=".csv,text/csv,text/plain,application/vnd.ms-excel"
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
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Anteprima Righe Rilevate ({parsedData.length})
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    Sep: {detectedDelimiter === ';' ? 'Punto e virgola (;)' : detectedDelimiter === ',' ? 'Virgola (,)' : detectedDelimiter === '\t' ? 'Tabulazione' : detectedDelimiter}
                  </span>
                </div>
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Dati pronti per l'importazione
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 sticky top-0 text-slate-700 font-bold z-10">
                    <tr>
                      <th className="py-2.5 px-3">Cognome e Nome</th>
                      <th className="py-2.5 px-3">Congregazione</th>
                      <th className="py-2.5 px-3">Privilegio</th>
                      <th className="py-2.5 px-3">Età / Nascita</th>
                      <th className="py-2.5 px-3">Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedData.slice(0, 20).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-3">
                          <div className="font-bold text-slate-900">
                            {getDisplayName(row.last_name, row.first_name)}
                          </div>
                          <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                            row.gender === 'F' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
                          }`}>
                            {row.gender === 'F' ? 'Sorella' : 'Fratello'}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                            {row.congregation_name || '—'}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          {row.privilege_codes ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold font-mono bg-blue-50 text-blue-700 border border-blue-200">
                              {row.privilege_codes}
                            </span>
                          ) : (
                            <span className="text-slate-300 italic">—</span>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          {row.age ? (
                            <span className="font-semibold text-slate-700">
                              {row.age} <span className="text-[11px] text-slate-400 font-normal">anni</span>
                            </span>
                          ) : row.birth_date ? (
                            <span className="text-slate-600">{row.birth_date}</span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="py-2 px-3 truncate max-w-[160px] text-slate-500" title={row.notes}>
                          {row.notes || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {parsedData.length > 20 && (
                <p className="text-[11px] text-slate-400 text-right pr-2">
                  ...e altri {parsedData.length - 20} proclamatori
                </p>
              )}
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
