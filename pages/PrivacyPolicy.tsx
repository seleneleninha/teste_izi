import React from 'react';
import { Shield, Lock, Eye, UserX, Download, Mail } from 'lucide-react';

export const PrivacyPolicy: React.FC = () => {
    return (
        <div className="min-h-screen bg-gradient-to-b from-midnight-950 via-midnight-900 to-midnight-950">
            {/* Header */}
            <div className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.1),transparent_50%)]" />

                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="flex items-center justify-center gap-3 mb-6">
                            <Shield className="w-12 h-12 text-emerald-400" />
                            <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-emerald-100 to-white bg-clip-text text-transparent">
                                Política de Privacidade
                            </h1>
                        </div>
                        <p className="text-xl text-gray-400">
                            Seu Seus dados são protegidos conforme a LGPD (Lei 13.709/2018)
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

                    {/* Introdução */}
                    <section className="bg-midnight-800/40 backdrop-blur-sm rounded-3xl p-8 border border-white/5">
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <Eye className="text-emerald-400" />
                            1. Introdução
                        </h2>
                        <div className="space-y-4 text-gray-300 leading-relaxed">
                            <p>
                                A <span className="text-emerald-400 font-semibold">iziBrokerz</span> valoriza sua privacidade e está comprometida em proteger seus dados pessoais.
                            </p>
                            <p>
                                Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e compartilhamos suas informações quando você utiliza nossa plataforma de anúncios imobiliários.
                            </p>
                            <p className="text-sm text-gray-400 bg-midnight-900/50 p-4 rounded-xl border-l-4 border-emerald-500">
                                💡 <strong>Importante:</strong> Ao utilizar nossos serviços, você concorda com os termos desta política.
                            </p>
                        </div>
                    </section>

                    {/* Dados Coletados */}
                    <section className="bg-midnight-800/40 backdrop-blur-sm rounded-3xl p-8 border border-white/5">
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <Lock className="text-emerald-400" />
                            2. Dados que Coletamos
                        </h2>
                        <div className="space-y-6 text-gray-300">
                            <div>
                                <h3 className="text-lg font-semibold text-emerald-300 mb-2">2.1 Dados Fornecidos por Você</h3>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li><strong>Cadastro:</strong> Nome, sobrenome, e-mail, telefone/WhatsApp</li>
                                    <li><strong>Corretores:</strong> CPF, CRECI, UF do CRECI</li>
                                    <li><strong>Imóveis:</strong> Fotos, descrições, endereços, valores</li>
                                    <li><strong>Comunicação:</strong> Mensagens via chat integrado (IzA)</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-emerald-300 mb-2">2.2 Dados Coletados Automaticamente</h3>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li><strong>Navegação:</strong> IP, navegador, sistema operacional</li>
                                    <li><strong>Localização:</strong> Coordenadas geográficas (GPS) para mapas</li>
                                    <li><strong>Cookies:</strong> Preferências de tema, autenticação</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Como Usamos */}
                    <section className="bg-midnight-800/40 backdrop-blur-sm rounded-3xl p-8 border border-white/5">
                        <h2 className="text-2xl font-bold text-white mb-4">3. Como Usamos Seus Dados</h2>
                        <div className="space-y-4 text-gray-300">
                            <p>Utilizamos seus dados para:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>✅ Criar e gerenciar sua conta</li>
                                <li>✅ Publicar e exibir anúncios de imóveis</li>
                                <li>✅ Conectar corretores e clientes (parcerias 50/50)</li>
                                <li>✅ Enviar notificações sobre anúncios e parcerias</li>
                                <li>✅ Melhorar nossos serviços (análise de uso)</li>
                                <li>✅ Prevenir fraudes e garantir segurança</li>
                                <li>✅ Cumprir obrigações legais</li>
                            </ul>
                        </div>
                    </section>

                    {/* Compartilhamento */}
                    <section className="bg-midnight-800/40 backdrop-blur-sm rounded-3xl p-8 border border-white/5">
                        <h2 className="text-2xl font-bold text-white mb-4">4. Compartilhamento de Dados</h2>
                        <div className="space-y-4 text-gray-300">
                            <p className="text-emerald-300 font-semibold">
                                ⚠️ Nunca vendemos seus dados pessoais.
                            </p>
                            <p>Compartilhamos dados apenas quando:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li><strong>Parceiros de Negócio:</strong> Conectamos corretores para parcerias (nome, CRECI, WhatsApp)</li>
                                <li><strong>Fornecedores:</strong> Supabase (hospedagem), Google Gemini (IA), Vercel (servidor)</li>
                                <li><strong>Autoridades:</strong> Quando exigido por lei

                                    (ordens judiciais)</li>
                            </ul>
                            <p className="text-sm bg-midnight-900/50 p-4 rounded-xl border-l-4 border-amber-500 text-amber-200">
                                🔒 Todos os fornecedores são certificados e cumprem LGPD/GDPR.
                            </p>
                        </div>
                    </section>

                    {/* Seus Direitos */}
                    <section className="bg-midnight-800/40 backdrop-blur-sm rounded-3xl p-8 border border-white/5">
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <UserX className="text-emerald-400" />
                            5. Seus Direitos (LGPD Art. 18)
                        </h2>
                        <div className="space-y-4 text-gray-300">
                            <p>Você tem direito a:</p>
                            <div className="grid md:grid-cols-2 gap-4 mt-4">
                                <div className="bg-midnight-900/50 p-4 rounded-xl">
                                    <strong className="text-emerald-300">✓ Acessar</strong> seus dados
                                </div>
                                <div className="bg-midnight-900/50 p-4 rounded-xl">
                                    <strong className="text-emerald-300">✓ Corrigir</strong> dados incorretos
                                </div>
                                <div className="bg-midnight-900/50 p-4 rounded-xl">
                                    <strong className="text-emerald-300">✓ Deletar</strong> sua conta
                                </div>
                                <div className="bg-midnight-900/50 p-4 rounded-xl">
                                    <strong className="text-emerald-300">✓ Exportar</strong> seus dados (portabilidade)
                                </div>
                                <div className="bg-midnight-900/50 p-4 rounded-xl">
                                    <strong className="text-emerald-300">✓ Revogar</strong> consentimento
                                </div>
                                <div className="bg-midnight-900/50 p-4 rounded-xl">
                                    <strong className="text-emerald-300">✓ Oposição</strong> ao tratamento
                                </div>
                            </div>
                            <p className="mt-4 text-sm bg-emerald-900/20 p-4 rounded-xl border-l-4 border-emerald-500">
                                <Download className="inline mr-2" size={16} />
                                <strong>Como exercer:</strong> Acesse seu perfil e use o botão "Baixar Meus Dados" ou "Deletar Conta".
                            </p>
                        </div>
                    </section>

                    {/* Segurança */}
                    <section className="bg-midnight-800/40 backdrop-blur-sm rounded-3xl p-8 border border-white/5">
                        <h2 className="text-2xl font-bold text-white mb-4">6. Segurança</h2>
                        <div className="space-y-4 text-gray-300">
                            <p>Implementamos medidas técnicas para proteger seus dados:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>🔐 <strong>Criptografia:</strong> HTTPS/TLS em todas as comunicações</li>
                                <li>🔐 <strong>Senhas:</strong> Hasheadas com bcrypt (irreversível)</li>
                                <li>🔐 <strong>Acesso:</strong> Limitado apenas a funcionários autorizados</li>
                                <li>🔐 <strong>Monitoramento:</strong> Logs de segurança e rate limiting</li>
                                <li>🔐 <strong>Backups:</strong> Dados replicados em servidores seguros</li>
                            </ul>
                        </div>
                    </section>

                    {/* Retenção */}
                    <section className="bg-midnight-800/40 backdrop-blur-sm rounded-3xl p-8 border border-white/5">
                        <h2 className="text-2xl font-bold text-white mb-4">7. Retenção de Dados</h2>
                        <div className="space-y-4 text-gray-300">
                            <p>Mantemos seus dados enquanto:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Sua conta estiver ativa</li>
                                <li>For necessário para cumprir obrigações legais (5 anos)</li>
                                <li>Houver anúncios ativos associados à sua conta</li>
                            </ul>
                            <p className="text-sm bg-midnight-900/50 p-4 rounded-xl border-l-4 border-red-500 text-red-200 mt-4">
                                ⚠️ Após deletar sua conta, anonimizamos seus dados em até 30 dias.
                            </p>
                        </div>
                    </section>

                    {/* Cookies */}
                    <section className="bg-midnight-800/40 backdrop-blur-sm rounded-3xl p-8 border border-white/5">
                        <h2 className="text-2xl font-bold text-white mb-4">8. Cookies e Tecnologias Similares</h2>
                        <div className="space-y-4 text-gray-300">
                            <p>Usamos cookies para:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li><strong>Essenciais:</strong> Autenticação e segurança (obrigatórios)</li>
                                <li><strong>Preferências:</strong> Tema dark/light, idioma</li>
                                <li><strong>Analytics:</strong> Métricas de uso (anônimas)</li>
                            </ul>
                            <p className="text-sm text-gray-400 mt-4">
                                Você pode desabilitar cookies nas configurações do navegador, mas isso pode afetar funcionalidades.
                            </p>
                        </div>
                    </section>

                    {/* Alterações */}
                    <section className="bg-midnight-800/40 backdrop-blur-sm rounded-3xl p-8 border border-white/5">
                        <h2 className="text-2xl font-bold text-white mb-4">9. Alterações nesta Política</h2>
                        <div className="space-y-4 text-gray-300">
                            <p>
                                Podemos atualizar esta política periodicamente. Você será notificado por e-mail sobre mudanças significativas.
                            </p>
                            <p className="text-emerald-300">
                                📅 Data da última atualização: <strong>{new Date().toLocaleDateString('pt-BR')}</strong>
                            </p>
                        </div>
                    </section>

                    {/* Contato */}
                    <section className="bg-gradient-to-r from-emerald-900/20 to-teal-900/20 backdrop-blur-sm rounded-3xl p-8 border border-emerald-500/30">
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <Mail className="text-emerald-400" />
                            10. Contato
                        </h2>
                        <div className="space-y-4 text-gray-300">
                            <p>
                                Para exercer seus direitos ou esclarecer dúvidas sobre privacidade:
                            </p>
                            <div className="bg-midnight-900/50 p-6 rounded-xl space-y-2">
                                <p><strong className="text-emerald-300">Controlador de Dados:</strong> iziBrokerz Ltda</p>
                                <p><strong className="text-emerald-300">DPO (Encarregado):</strong> [NOME DO DPO]</p>
                                <p><strong className="text-emerald-300">E-mail:</strong> <a href="mailto:privacidade@izibrokerz.com" className="text-emerald-400 hover:underline">privacidade@izibrokerz.com</a></p>
                                <p><strong className="text-emerald-300">CNPJ:</strong> [CNPJ DA EMPRESA]</p>
                            </div>
                            <p className="text-sm text-gray-400 mt-4">
                                Responderemos sua solicitação em até 15 dias úteis.
                            </p>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
};
