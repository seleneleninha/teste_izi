import React from 'react';
import { FileText, Handshake, DollarSign, Scale, Ban, Shield } from 'lucide-react';

export const TermsOfService: React.FC = () => {
    return (
        <div className="min-h-screen bg-gradient-to-b from-midnight-950 via-midnight-900 to-midnight-950">
            {/* Header */}
            <div className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.1),transparent_50%)]" />

                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="flex items-center justify-center gap-3 mb-6">
                            <FileText className="w-12 h-12 text-emerald-400" />
                            <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-emerald-100 to-white bg-clip-text text-transparent">
                                Termos de Uso
                            </h1>
                        </div>
                        <p className="text-xl text-gray-400">
                            Condições de uso da plataforma iziBrokerz
                        </p>
                        <p className="text-sm text-gray-500 mt-4">
                            Última atualização: {new Date().toLocaleDateString('pt-BR')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 pb-20">
                <div className="max-w-4xl mx-auto space-y-12">

                    {/* Aceitação */}
                    <section className="bg-midnight-800/40 backdrop-blur-sm rounded-3xl p-8 border border-white/5">
                        <h2 className="text-2xl font-bold text-white mb-4">1. Aceitação dos Termos</h2>
                        <div className="space-y-4 text-gray-300 leading-relaxed">
                            <p>
                                Ao acessar e usar a plataforma <span className="text-emerald-400 font-semibold">iziBrokerz</span>, você concorda com estes Termos de Uso e nossa Política de Privacidade.
                            </p>
                            <p>
                                Se você não concordar com qualquer parte destes termos, não utilize nossos serviços.
                            </p>
                            <p className="text-sm text-gray-400 bg-midnight-900/50 p-4 rounded-xl border-l-4 border-emerald-500">
                                ⚖️ Estes termos constituem um contrato legal entre você e a iziBrokerz Ltda.
                            </p>
                        </div>
                    </section>

                    {/* Definições */}
                    <section className="bg-midnight-800/40 backdrop-blur-sm rounded-3xl p-8 border border-white/5">
                        <h2 className="text-2xl font-bold text-white mb-4">2. Definições</h2>
                        <div className="space-y-4 text-gray-300">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="bg-midnight-900/50 p-4 rounded-xl">
                                    <strong className="text-emerald-300">Plataforma:</strong> Site iziBrokerz.com
                                </div>
                                <div className="bg-midnight-900/50 p-4 rounded-xl">
                                    <strong className="text-emerald-300">Corretor:</strong> Profissional com CRECI ativo
                                </div>
                                <div className="bg-midnight-900/50 p-4 rounded-xl">
                                    <strong className="text-emerald-300">Cliente:</strong> Pessoa interessada em imóveis
                                </div>
                                <div className="bg-midnight-900/50 p-4 rounded-xl">
                                    <strong className="text-emerald-300">Anúncio:</strong> Oferta de imóvel publicada
                                </div>
                                <div className="bg-midnight-900/50 p-4 rounded-xl">
                                    <strong className="text-emerald-300">Parceria:</strong> Colaboração entre corretores (50/50)
                                </div>
                                <div className="bg-midnight-900/50 p-4 rounded-xl">
                                    <strong className="text-emerald-300">IzA:</strong> Assistente de IA da plataforma
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Elegibilidade */}
                    <section className="bg-midnight-800/40 backdrop-blur-sm rounded-3xl p-8 border border-white/5">
                        <h2 className="text-2xl font-bold text-white mb-4">3. Elegibilidade</h2>
                        <div className="space-y-4 text-gray-300">
                            <p>Para usar a plataforma, você deve:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>✓ Ter pelo menos 18 anos de idade</li>
                                <li>✓ Fornecer informações verdadeiras e atualizadas</li>
                                <li>✓ Se corretor: possuir CRECI ativo e válido</li>
                                <li>✓ Concordar com estes Termos e a Política de Privacidade</li>
                            </ul>
                        </div>
                    </section>

                    {/* Conta de Usuário */}
                    <section className="bg-midnight-800/40 backdrop-blur-sm rounded-3xl p-8 border border-white/5">
                        <h2 className="text-2xl font-bold text-white mb-4">4. Conta de Usuário</h2>
                        <div className="space-y-4 text-gray-300">
                            <h3 className="text-lg font-semibold text-emerald-300">4.1 Responsabilidades</h3>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Manter senha segura e confidencial</li>
                                <li>Notificar imediatamente sobre uso não autorizado</li>
                                <li>Não compartilhar sua conta com terceiros</li>
                                <li>Atualizar dados cadastrais quando necessário</li>
                            </ul>

                            <h3 className="text-lg font-semibold text-emerald-300 mt-6">4.2 Suspensão/Encerramento</h3>
                            <p>Reservamos o direito de suspender ou encerrar contas que:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Violem estes Termos</li>
                                <li>Publiquem conteúdo fraudulento ou enganoso</li>
                                <li>Façam uso abusivo da plataforma</li>
                                <li>Permaneçam inativas por mais de 1 ano</li>
                            </ul>
                        </div>
                    </section>

                    {/* Parceria 50/50 */}
                    <section className="bg-gradient-to-r from-emerald-900/20 to-teal-900/20 backdrop-blur-sm rounded-3xl p-8 border border-emerald-500/30">
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <Handshake className="text-emerald-400" />
                            5. Modelo de Parceria 50/50
                        </h2>
                        <div className="space-y-4 text-gray-300">
                            <h3 className="text-lg font-semibold text-emerald-300">5.1 Como Funciona</h3>
                            <p>
                                Corretores podem aceitar parcerias em anúncios marcados como "Aceita Parceria":
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li><strong>Anunciante:</strong> Corretor que publicou o imóvel</li>
                                <li><strong>Parceiro:</strong> Corretor que traz o cliente</li>
                                <li><strong>Divisão:</strong> 50% da comissão para cada parte</li>
                                <li><strong>Faturamento:</strong> Individual (cada um emite sua nota fiscal)</li>
                            </ul>

                            <h3 className="text-lg font-semibold text-emerald-300 mt-6">5.2 Responsabilidades</h3>
                            <div className="grid md:grid-cols-2 gap-4 mt-4">
                                <div className="bg-midnight-900/50 p-4 rounded-xl">
                                    <strong className="text-emerald-300 block mb-2">Anunciante:</strong>
                                    <ul className="list-disc list-inside space-y-1 text-sm">
                                        <li>Informações corretas do imóvel</li>
                                        <li>Fotos autênticas</li>
                                        <li>Disponibilidade para visitas</li>
                                    </ul>
                                </div>
                                <div className="bg-midnight-900/50 p-4 rounded-xl">
                                    <strong className="text-emerald-300 block mb-2">Parceiro:</strong>
                                    <ul className="list-disc list-inside space-y-1 text-sm">
                                        <li>Prospecção de clientes</li>
                                        <li>Qualificação de leads</li>
                                        <li>Acompanhamento na negociação</li>
                                    </ul>
                                </div>
                            </div>

                            <p className="mt-4 text-sm bg-amber-900/20 p-4 rounded-xl border-l-4 border-amber-500 text-amber-200">
                                ⚠️ <strong>Importante:</strong> A iziBrokerz NÃO participa da transação financeira. A divisão da comissão é de responsabilidade dos corretores envolvidos.
                            </p>
                        </div>
                    </section>

                    {/* Anúncios */}
                    <section className="bg-midnight-800/40 backdrop-blur-sm rounded-3xl p-8 border border-white/5">
                        <h2 className="text-2xl font-bold text-white mb-4">6. Publicação de Anúncios</h2>
                        <div className="space-y-4 text-gray-300">
                            <h3 className="text-lg font-semibold text-emerald-300">6.1 Regras</h3>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>✓ Apenas corretores com CRECI ativo podem anunciar</li>
                                <li>✓ Informações devem ser precisas e verdadeiras</li>
                                <li>✓ Fotos devem ser do imóvel anunciado</li>
                                <li>✓ Valores devem refletir o mercado atual</li>
                                <li>✗ Proibido: conteúdo ofensivo, discriminatório ou ilegal</li>
                            </ul>

                            <h3 className="text-lg font-semibold text-emerald-300 mt-6">6.2 Aprovação</h3>
                            <p>
                                Todos os anúncios passam por moderação antes de serem publicados. Reservamo-nos o direito de rejeitar anúncios que não atendam aos nossos padrões.
                            </p>

                            <h3 className="text-lg font-semibold text-emerald-300 mt-6">6.3 Duração</h3>
                            <p>
                                Anúncios permanecem ativos até que sejam:
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Marcados como "Vendido" ou "Alugado" pelo corretor</li>
                                <li>Removidos pelo corretor</li>
                                <li>Desativados pela plataforma por violação</li>
                            </ul>
                        </div>
                    </section>

                    {/* Pagamento e Planos */}
                    <section className="bg-midnight-800/40 backdrop-blur-sm rounded-3xl p-8 border border-white/5">
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <DollarSign className="text-emerald-400" />
                            7. Pagamento e Planos
                        </h2>
                        <div className="space-y-4 text-gray-300">
                            <h3 className="text-lg font-semibold text-emerald-300">7.1 Período de Testes (Trial)</h3>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>14 dias gratuitos para novos corretores</li>
                                <li>Limite de 5 anúncios ativos (configurável)</li>
                                <li>Funcionalidades limitadas</li>
                            </ul>

                            <h3 className="text-lg font-semibold text-emerald-300 mt-6">7.2 Planos Pagos</h3>
                            <p>
                                Detalhes de planos e preços serão comunicados diretamente aos usuários. Valores podem ser alterados com aviso prévio de 30 dias.
                            </p>

                            <h3 className="text-lg font-semibold text-emerald-300 mt-6">7.3 Cancelamento</h3>
                            <p>
                                Você pode cancelar sua assinatura a qualquer momento. O acesso continua até o final do período pago.
                            </p>
                        </div>
                    </section>

                    {/* Propriedade Intelectual */}
                    <section className="bg-midnight-800/40 backdrop-blur-sm rounded-3xl p-8 border border-white/5">
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <Shield className="text-emerald-400" />
                            8. Propriedade Intelectual
                        </h2>
                        <div className="space-y-4 text-gray-300">
                            <p>
                                Todo o conteúdo da plataforma (código, design, logo, IzA) é propriedade da iziBrokerz e protegido por direitos autorais.
                            </p>
                            <p>
                                <strong>Você mantém:</strong> Direitos sobre fotos e descrições que você enviar.
                            </p>
                            <p>
                                <strong>Você concede:</strong> Licença não-exclusiva para exibirmos seu conteúdo na plataforma.
                            </p>
                        </div>
                    </section>

                    {/* Proibições */}
                    <section className="bg-midnight-800/40 backdrop-blur-sm rounded-3xl p-8 border border-white/5">
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <Ban className="text-red-400" />
                            9. Condutas Proibidas
                        </h2>
                        <div className="space-y-4 text-gray-300">
                            <p className="text-red-300 font-semibold">É estritamente proibido:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>❌ Usar a plataforma para atividades ilegais</li>
                                <li>❌ Publicar informações falsas ou enganosas</li>
                                <li>❌ Fazer scraping ou cópia automatizada de dados</li>
                                <li>❌ Tentar acessar contas de terceiros</li>
                                <li>❌ Enviar spam ou mensagens não solicitadas</li>
                                <li>❌ Contornar medidas de segurança</li>
                                <li>❌ Usar bots ou automações não autorizadas</li>
                            </ul>
                        </div>
                    </section>

                    {/* Limitações */}
                    <section className="bg-midnight-800/40 backdrop-blur-sm rounded-3xl p-8 border border-white/5">
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <Scale className="text-emerald-400" />
                            10. Limitações de Responsabilidade
                        </h2>
                        <div className="space-y-4 text-gray-300">
                            <p>
                                A iziBrokerz é apenas uma plataforma de conexão. <strong>NÃO somos responsáveis por:</strong>
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Veracidade das informações publicadas por corretores</li>
                                <li>Transações realizadas fora da plataforma</li>
                                <li>Disputas entre corretores parceiros</li>
                                <li>Problemas com imóveis anunciados</li>
                                <li>Perda de dados por falhas técnicas</li>
                            </ul>
                            <p className="mt-4 text-sm bg-midnight-900/50 p-4 rounded-xl border-l-4 border-amber-500">
                                ⚠️ Use a plataforma por sua conta e risco. Faça sempre a devida diligência antes de negociar.
                            </p>
                        </div>
                    </section>

                    {/* Lei Aplicável */}
                    <section className="bg-midnight-800/40 backdrop-blur-sm rounded-3xl p-8 border border-white/5">
                        <h2 className="text-2xl font-bold text-white mb-4">11. Lei Aplicável e Foro</h2>
                        <div className="space-y-4 text-gray-300">
                            <p>
                                Estes Termos são regidos pelas leis da República Federativa do Brasil.
                            </p>
                            <p>
                                Qualquer disputa será resolvida no foro da comarca de <strong>[CIDADE DA SEDE]</strong>, com exclusão de qualquer outro.
                            </p>
                        </div>
                    </section>

                    {/* Alterações */}
                    <section className="bg-midnight-800/40 backdrop-blur-sm rounded-3xl p-8 border border-white/5">
                        <h2 className="text-2xl font-bold text-white mb-4">12. Alterações nos Termos</h2>
                        <div className="space-y-4 text-gray-300">
                            <p>
                                Podemos modificar estes Termos a qualquer momento. Mudanças significativas serão notificadas por e-mail com 30 dias de antecedência.
                            </p>
                            <p className="text-emerald-300">
                                📅 Versão atual: <strong>{new Date().toLocaleDateString('pt-BR')}</strong>
                            </p>
                        </div>
                    </section>

                    {/* Contato */}
                    <section className="bg-gradient-to-r from-emerald-900/20 to-teal-900/20 backdrop-blur-sm rounded-3xl p-8 border border-emerald-500/30">
                        <h2 className="text-2xl font-bold text-white mb-4">13. Contato</h2>
                        <div className="space-y-4 text-gray-300">
                            <p>Dúvidas sobre estes Termos? Entre em contato:</p>
                            <div className="bg-midnight-900/50 p-6 rounded-xl space-y-2">
                                <p><strong className="text-emerald-300">E-mail:</strong> <a href="mailto:suporte@izibrokerz.com" className="text-emerald-400 hover:underline">suporte@izibrokerz.com</a></p>
                                <p><strong className="text-emerald-300">WhatsApp:</strong> [TELEFONE]</p>
                            </div>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
};
