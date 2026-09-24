import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { X, Printer, Download, CheckSquare, Square } from 'lucide-react';
import { Publisher, Congregation, Privilege } from '../types';

interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  publishers: Publisher[];
  congregations: Congregation[];
  privileges: Privilege[];
  selectedCongregationId: string | null;
}

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  isOpen,
  onClose,
  publishers,
  congregations,
  privileges,
  selectedCongregationId
}) => {
  const [includeAge, setIncludeAge] = useState(true);
  const [includeNotes, setIncludeNotes] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const currentCongregation = congregations.find((c) => c.id === selectedCongregationId);
  const congTitle = currentCongregation ? currentCongregation.name : 'Tutte le Congregazioni';

  const getPrivilegeLabel = (codesStr?: string) => {
    if (!codesStr) return '—';
    const codes = codesStr.split(',').map((c) => c.trim().toUpperCase());
    return codes.map((c) => {
      const p = privileges.find((item) => item.code.toUpperCase() === c);
      return p ? `${c} (${p.label})` : c;
    }).join(', ');
  };

  const getCongName = (id: string) => {
    const c = congregations.find((item) => item.id === id);
    return c ? c.name : '—';
  };

  const generatePdf = () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Title & Header (No Logo, 'Congregazioni')
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text('Congregazioni', 14, 16);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text(`Elenco Proclamatori — ${congTitle}`, 14, 23);

      const today = new Date().toLocaleDateString('it-IT', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(`Data: ${today} • Totale: ${publishers.length} persone`, 14, 29);

      // Table columns & data
      const headers = ['Cognome e Nome'];
      if (!selectedCongregationId) headers.push('Congregazione');
      headers.push('Privilegio');
      if (includeAge) headers.push('Età');
      if (includeNotes) headers.push('Note');

      const bodyData = publishers.map((pub) => {
        const row = [`${pub.last_name} ${pub.first_name}`];
        if (!selectedCongregationId) row.push(getCongName(pub.congregation_id));
        row.push(getPrivilegeLabel(pub.privilege_codes));
        if (includeAge) row.push(pub.age ? `${pub.age} anni` : '—');
        if (includeNotes) row.push(pub.notes || '—');
        return row;
      });

      autoTable(doc, {
        startY: 33,
        head: [headers],
        body: bodyData,
        theme: 'striped',
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9
        },
        styles: {
          fontSize: 9,
          cellPadding: 3.5,
          textColor: [30, 41, 59]
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        didDrawPage: (data) => {
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184);
          doc.text(
            `Congregazioni • Pagina ${doc.getNumberOfPages()}`,
            doc.internal.pageSize.width - 35,
            doc.internal.pageSize.height - 8
          );
        }
      });

      const fileName = `Elenco_Proclamatori_${congTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      setIsGenerating(false);
      onClose();
    } catch (e) {
      console.error(e);
      alert('Errore nella generazione del PDF.');
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Stampa o Esporta in PDF
            </h3>
            <p className="text-xs text-slate-500">
              Genera un documento PDF stampabile pulito e ordinato
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Target Summary */}
          <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Congregazione
              </p>
              <p className="text-sm font-bold text-slate-900">
                {congTitle}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Proclamatori
              </p>
              <p className="text-sm font-bold text-blue-600">
                {publishers.length} persone
              </p>
            </div>
          </div>

          {/* Column options */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Opzioni Colonne
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setIncludeAge(!includeAge)}
                className="flex items-center gap-2.5 p-3 rounded-xl border text-xs font-medium transition-colors text-left cursor-pointer hover:bg-slate-50"
              >
                {includeAge ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                <span>Età proclamatori</span>
              </button>
              <button
                type="button"
                onClick={() => setIncludeNotes(!includeNotes)}
                className="flex items-center gap-2.5 p-3 rounded-xl border text-xs font-medium transition-colors text-left cursor-pointer hover:bg-slate-50"
              >
                {includeNotes ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                <span>Note</span>
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handlePrint}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Stampa Subito
            </button>
            <button
              type="button"
              disabled={isGenerating || publishers.length === 0}
              onClick={generatePdf}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-950 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-colors"
            >
              <Download className="w-4 h-4" />
              {isGenerating ? 'Generazione...' : 'Scarica PDF'}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
