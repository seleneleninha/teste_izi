import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, FileText, Shield, Scale } from 'lucide-react';

interface LegalDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    documentType: 'privacy' | 'terms' | 'lgpd';
}

export const LegalDocumentModal: React.FC<LegalDocumentModalProps> = ({ isOpen, onClose, documentType }) => {
    const [content, setContent] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            loadDocument();
        }
    }, [isOpen, documentType]);

    const loadDocument = async () => {
        setLoading(true);
        try {
            let fileName = '';
            switch (documentType) {
                case 'privacy':
                    fileName = 'iziBrokerz_Politica_Privacidade.md';
                    break;
                case 'terms':
                    fileName = 'iziBrokerz_Termos_Uso.md';
                    break;
                case 'lgpd':
                    fileName = 'iziBrokerz_Compliance_LGPD.md';
                    break;
            }

            const response = await fetch(`/${fileName}`);
            const text = await response.text();
            setContent(text);
        } catch (error) {
            console.error('Error loading document:', error);
            setContent('# Erro ao Carregar Documento\n\nNão foi possível carregar o documento. Tente novamente mais tarde.');
        } finally {
            setLoading(false);
        }
    };

    const getIcon = () => {
        switch (documentType) {
            case 'privacy':
                return <Shield className="text-emerald-400" size={28} />;
            case 'terms':
                return <Scale className="text-blue-400" size={28} />;
            case 'lgpd':
                return <FileText className="text-purple-400" size={28} />;
        }
    };

    const getTitle = () => {
        switch (documentType) {
            case 'privacy':
                return 'Política de Privacidade';
            case 'terms':
                return 'Termos de Uso';
            case 'lgpd':
                return 'Compliance LGPD';
        }
    };

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-midnight-900 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] border border-slate-700 flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        {getIcon()}
                        <div>
                            <h2 className="text-2xl font-bold text-white">{getTitle()}</h2>
                            <p className="text-sm text-gray-400">iziBrokerz - Plataforma Digital Imobiliária</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-200 transition-colors p-2 hover:bg-slate-800 rounded-full"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
                        </div>
                    ) : (
                        <div className="prose prose-invert prose-slate max-w-none">
                            <pre className="whitespace-pre-wrap text-gray-300 leading-relaxed font-sans text-sm">
                                {content}
                            </pre>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-700 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-full transition-colors"
                    >
                        Entendi e Fechar
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
