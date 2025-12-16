// Generate AI property descriptions (3 styles: Conservadora, Popular, Mix)
export async function createGenerateDescription(
    formData: any,
    tiposImovel: any[],
    subtiposImovel: any[],
    operacoes: any[],
    user: any,
    supabase: any,
    setGeneratedDescriptions: (descriptions: string[]) => void,
    setIsGeneratingDesc: (value: boolean) => void,
    addToast: (message: string, type: string) => void
) {
    return async () => {
        if (!formData.address || !formData.beds || !formData.privateArea) {
            addToast('Preencha pelo menos: Endereço, Quartos e Área Privativa antes de gerar descrições.', 'warning');
            return;
        }

        setIsGeneratingDesc(true);
        try {
            // Fetch broker data
            const { data: brokerData } = await supabase
                .from('perfis')
                .select('nome, sobrenome, creci, uf_creci, whatsapp')
                .eq('id', user?.id)
                .single();

            const selectedTipo = tiposImovel.find(t => t.id === formData.tipoImovelId);
            const selectedSubtipo = subtiposImovel.find(s => s.id === formData.subtipoImovelId);
            const selectedOperacao = operacoes.find(o => o.id === formData.operacaoId);

            const { generatePropertyDescription } = await import('../lib/geminiHelper');

            const descriptions = await generatePropertyDescription({
                tipo: selectedTipo?.tipo || 'Imóvel',
                subtipo: selectedSubtipo?.subtipo,
                titulo: formData.title,
                operacao: selectedOperacao?.tipo,
                bairro: formData.neighborhood,
                cidade: formData.city,
                quartos: parseInt(formData.beds) || 0,
                suites: parseInt(formData.suites) || 0,
                banheiros: parseInt(formData.bathrooms) || 0,
                vagas: parseInt(formData.garage) || 0,
                area: parseFloat(formData.privateArea.replace(/\\D/g, '')) || 0,
                caracteristicas: formData.features,
                brokerName: brokerData ? `${brokerData.nome} ${brokerData.sobrenome}` : undefined,
                brokerCreci: brokerData?.creci || undefined,
                brokerUfCreci: brokerData?.uf_creci || undefined,
                brokerWhatsapp: brokerData?.whatsapp || undefined,
            });

            setGeneratedDescriptions(descriptions);
            addToast('✨ 3 opções de descrição geradas com sucesso!', 'success');
        } catch (error) {
            console.error('Error generating descriptions:', error);
            addToast('Erro ao gerar descrições. Tente novamente.', 'error');
        } finally {
            setIsGeneratingDesc(false);
        }
    };
}
