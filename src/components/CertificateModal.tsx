import React from 'react';
import { Award, Printer, ArrowLeft, Star, Sparkles } from 'lucide-react';
import { MascotBadge } from './MascotBadge';
import { soundManager } from '../services/sound';

interface CertificateModalProps {
  playerName: string;
  selectedMascot: string;
  selectedHat: string;
  totalStars: number;
  challengeTitle?: string | null;
  onBack: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  playerName,
  selectedMascot,
  selectedHat,
  totalStars,
  challengeTitle,
  onBack,
}) => {
  const handlePrint = () => {
    soundManager.playBloop(500);
    window.print();
  };

  const today = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 bg-white rounded-3xl shadow-2xl border-4 border-amber-300">
      {/* Top action buttons (hidden when printing) */}
      <div className="flex items-center justify-between pb-4 border-b border-amber-200 print:hidden">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Jogo</span>
        </button>

        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black rounded-xl shadow transition-transform active:scale-95"
        >
          <Printer className="w-5 h-5" />
          <span>Imprimir Certificado</span>
        </button>
      </div>

      {/* The Printable Certificate Container */}
      <div className="my-4 p-6 sm:p-10 rounded-3xl border-8 border-double border-amber-500 bg-gradient-to-b from-amber-50/70 via-white to-amber-50/50 text-center relative overflow-hidden print:border-amber-600 print:p-8">
        {/* Ornaments in corners */}
        <div className="absolute top-3 left-3 text-3xl">🌟</div>
        <div className="absolute top-3 right-3 text-3xl">🌟</div>
        <div className="absolute bottom-3 left-3 text-3xl">🌟</div>
        <div className="absolute bottom-3 right-3 text-3xl">🌟</div>

        {/* Certificate Header */}
        <div className="flex justify-center mb-2">
          <div className="p-3 bg-amber-100 rounded-full border-2 border-amber-300">
            <Award className="w-12 h-12 text-amber-600" />
          </div>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black font-fun text-amber-900 tracking-wide mb-1 uppercase">
          Certificado Oficial
        </h1>
        <h2 className="text-lg sm:text-xl font-extrabold text-amber-700 tracking-widest uppercase mb-6">
          Grande Mestre da Tabuada · 3º Ano
        </h2>

        <p className="text-base text-slate-600 font-semibold mb-2">
          Certificamos com muito orgulho e alegria que o(a) dedicado(a) aluno(a):
        </p>

        {/* Student Name */}
        <div className="my-4 inline-block px-8 py-2 border-b-4 border-amber-500">
          <span className="text-3xl sm:text-4xl font-black font-fun text-slate-900 tracking-wider">
            {playerName}
          </span>
        </div>

        <p className="text-base sm:text-lg text-slate-700 font-medium max-w-xl mx-auto leading-relaxed mt-3">
          Completou com louvor as missões matemáticas de multiplicação, dominando o raciocínio das tabuadas, agrupamentos visuais e cálculo mental com muita criatividade!
        </p>

        {challengeTitle && (
          <div className="mt-4 inline-flex items-center gap-2 px-5 py-2 rounded-full bg-purple-100 border-2 border-purple-400 text-purple-900 font-black text-sm sm:text-base shadow-xs">
            <span>Título conquistado: {challengeTitle} 🗼</span>
          </div>
        )}

        {/* Mascot & Stats Showcase */}
        <div className="my-8 flex flex-wrap items-center justify-center gap-8">
          <div className="flex items-center gap-3 bg-white/80 px-4 py-2 rounded-2xl border border-amber-200 shadow-xs">
            <MascotBadge mascotId={selectedMascot} hatId={selectedHat} size="md" />
            <div className="text-left">
              <span className="text-xs font-bold text-slate-400 block uppercase">Mascote Parceiro</span>
              <span className="text-sm font-black text-slate-800">Guardião dos Números</span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-yellow-100 px-4 py-2.5 rounded-2xl border border-yellow-300 shadow-xs">
            <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
            <span className="text-base font-black text-yellow-950">{totalStars} Estrelas Conquistadas</span>
          </div>
        </div>

        {/* Signatures & Seal */}
        <div className="mt-8 pt-6 border-t-2 border-amber-200/80 flex flex-col sm:flex-row justify-between items-center gap-6 px-6">
          <div className="text-center">
            <div className="w-48 border-b-2 border-slate-400 mb-1"></div>
            <span className="text-xs font-bold text-slate-500 uppercase">Professor(a) / Orientador(a)</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full border-4 border-amber-500 flex items-center justify-center bg-amber-400/20 text-amber-700 text-xs font-black uppercase text-center p-1">
              Selo 100% Nota 10
            </div>
          </div>

          <div className="text-center">
            <div className="w-48 border-b-2 border-slate-400 mb-1"></div>
            <span className="text-xs font-bold text-slate-500 uppercase">Data: {today}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
