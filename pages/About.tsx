import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { Building2, Users, TrendingUp, Award, CheckCircle, Linkedin, ArrowRight, Trophy } from 'lucide-react';

export const About: React.FC = () => {
    const navigate = useNavigate();

    const milestones = [
        {
            year: "1998-2007",
            company: "Início da Carreira",
            role: "Corretor Autônomo (SP) na ABYARA, LOPES & SELLER (House da Cyrela)",
            description: "Primeiros passos no mercado imobiliário, desenvolvendo expertise em negociação e relacionamento com clientes.",
            icon: <Building2 className="w-6 h-6" />
        },
        {
            year: "2007-2009",
            company: "Coordenação de Vendas",
            role: "Coordenador de Vendas PLANO&PLANO",
            description: "Coordenação de Vendas da Linha FATTO (Santo André e São Bernardo do Campo - SP) e posteriormente sendo transferido para Natal/RN em 2009, para coordenar os lançamento da nova 'joint-venture' Cyrela/Plano&Plano",
            icon: <TrendingUp className="w-6 h-6" />
        },
        {
            year: "2009-2010",
            company: "Coordenação de Vendas",
            role: "Coordenador de Vendas CYRELA/PLANO&PLANO",
            description: "Coordenação de Vendas dos Empreendimentos: L´ACQUA (Recorde de Vendas em um único dia '245 unidades e VGV estimado em mais de R$70milhões'), INFINITY, STYLLO (100% vendido em 90 dias) e início de vendas do VITA RESIDENCIAL 1ª Fase (Natal/RN)",
            icon: <Trophy className="w-6 h-6" />
        },
        {
            year: "2010-2011",
            company: "Gestão e Liderança | RAC AGRE VENDAS",
            role: "REC - Responsável por Equipe Comercial (AGRE VENDAS/RN)",
            description: "Implementação da House da AGRE VENDAS em Natal, criando e liderando Equipes Comerciais, implementação de processos e estratégias de vendas que resultaram no crescimento exponencial das vendas da Empresa, combatendo Grandes Imobiliárias Locais.",
            icon: <Users className="w-6 h-6" />
        },
        {
            year: "2011-2012",
            company: "Diretor Comercial | CONSTRUTORA ESTRUTURAL",
            role: "Diretoria Comercial",
            description: "Liderança da Equipe Comercial, implementação de processos e estratégias de vendas para alavancar novos Empreendimentos como: VIVA NATUREZA e INOVA.",
            icon: <Award className="w-6 h-6" />
        },
        {
            year: "2012-2013",
            company: "Superintendente Comercial | ABREU/BRASILBROKERS",
            role: "Superintendência de Vendas",
            description: "Liderança da Equipe Comercial, implementação de processos e estratégias de vendas am no crescimento exponencial das vendas da Empresa, combatendo Grandes Imobiliárias Locais.",
            icon: <Award className="w-6 h-6" />
        },
        {
            year: "2013",
            company: "DWBrasil",
            role: "Diretor Comercial",
            description: "Liderança da Equipe Comercial, implementação de processos e estratégias de vendas.",
            icon: <Users className="w-6 h-6" />
        },
        {
            year: "2013-2015",
            company: "ECOCIL Incorporações",
            role: "Superintendente de Vendas/Produto e Gerente Comercial",
            description: "Criação da 2ª House da ECOCIL, para aumentar os resultados e liderança da Empresa em Natal. Posteriormente sendo promovido à Gerência Comercial para ampliar ainda mais a dominância da Ecocil no mercado imobiliário local.",
            icon: <TrendingUp className="w-6 h-6" />
        },
        {
            year: "2015-2016",
            company: "GUSMÃO IMÓVEIS",
            role: "Gerente de Vendas",
            description: "Gestão de Vendas, acompanhamento de Corretores e implementação de processos e estratégias de vendas para melhor performance e resultados.",
            icon: <Award className="w-6 h-6" />
        },
        {
            year: "2016-2020",
            company: "CONSULTOR IMOBILIÁRIO/INVESTIMENTOS",
            description: "Consultoria em Negócios Imobiliários para Investidores, bem como aconselhamento a Investidores no mercado imobiliário.",
            icon: <CheckCircle className="w-6 h-6" />
        },
        {
            year: "2021-2023",
            company: "CLICIMOB",
            role: "CEO e Co-Founder",
            description: "Criação da Plataforma Imobiliária CLICIMOB em Natal/RN, visando otimizar o processo de negociação e gestão de imóveis para Corretores Autônomos e Pequenas Imobiliárias.",
            icon: <Award className="w-6 h-6" />
        },
        {
            year: "2023-até o momento (25 anos e 6 meses)",
            company: "iziBrokerz",
            role: "CEO e Co-Founder",
            description: "Pivotando o projeto anterior e criação uma 'Nova Plataforma Imobiliária' em Natal/RN, para LITERALMENTE tirar os Corretores Autônomos das 'GARRAS DO MONOPÓLIO dos Grandes Portaos Imobiliários que exploram e dominam o mercado imobiliário",
            icon: <TrendingUp className="w-6 h-6" />
        },
        {
            year: "RESUMINDO...",
            company: "AQUI ESTOU EU!!! Nunca desisti do meu sonho!",
            role: "Como dizia nosso GRANDE AYRTON SENNA...",
            description: "'Seja você quem for, seja qual for a posição social que você tenha na vida... DA MAIS ALTA OU DA MAIS BAIXA, tenha sempre como meta... MUITA FORÇA, muita DETERMINAÇÃO e sempre FAÇA TUDO COM MUITO AMOR e com MUITA FÉ EM DEUS... que um dia VOCÊ CHEGA LÁ!!! De alguma maneira... VOCÊ CHEGA LÁ!!!'",
            icon: <Trophy className="w-6 h-6" />
        }
    ];

    const achievements = [
        { number: "+25 anos", label: "de Experiência" },
        { number: "+2mil", label: "Negócios Fechados" },
        { number: "+3mil", label: "Corretores Treinados" },
        { number: "+R$3Bi", label: "Em VGV" }
    ];

    return (
        <div className="bg-gray-50 dark:bg-slate-900 min-h-screen">
            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white py-20">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=1920')] opacity-10 bg-cover bg-center"></div>
                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-4xl mx-auto text-center">
                        <h1 className="text-4xl md:text-6xl font-bold mb-6">Sobre a iziBrokerz</h1>
                        <p className="text-xl text-emerald-100 mb-8">
                            Nascida da experiência de quem VIVE CADA DESAFIO do mercado imobiliário
                        </p>
                    </div>
                </div>
            </section>

            {/* Founder Section */}
            <section className="py-20 bg-white dark:bg-slate-800">
                <div className="container mx-auto px-4">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div className="order-2 md:order-1">
                                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                                    Beluzzo
                                </h2>
                                <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
                                    Fundador & CEO da iziBrokerz/ClicImob
                                </p>
                                <div className="space-y-4 text-gray-700 dark:text-gray-300">
                                    <p>
                                        Com mais de <strong className="text-emerald-600 dark:text-emerald-400">25 anos de experiência</strong> no mercado imobiliário, <strong className="text-emerald-600 dark:text-emerald-400">BELUZZO (como é conhecido no Mercado)</strong>... construiu uma carreira sólida que vai desde a atuação como: corretor autônomo, coordenador de vendas, superintendência, gerência, diretoria comercial até a liderança de grandes equipes comerciais, Incorporadoras e Construtoras.
                                    </p>
                                    <p>
                                        Ao longo de sua trajetória, identificou as principais <strong>DORES E OPORTUNIDADES</strong> do setor:
                                        desde a dificuldade de corretores autônomos em expandir seus negócios, à falta de ferramentas tecnológicas
                                        acessíveis e a ausência de um sistema eficiente de parcerias entre PARCEIROS.
                                    </p>
                                    <p>
                                        E a <strong className="text-emerald-600 dark:text-emerald-400">iziBrokerz</strong> nasceu dessa visão:
                                        criar uma plataforma que empodera corretores através da colaboração, tecnologia e transparência.
                                    </p>
                                </div>
                                <a
                                    href="https://www.linkedin.com/in/cristianobeluzo/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                                >
                                    <Linkedin size={20} />
                                    Conectar no LinkedIn
                                </a>
                            </div>
                            <div className="order-1 md:order-2">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-2xl transform rotate-3"></div>
                                    <img
                                        src="/cristiano-profile.jpg"
                                        alt="Cristiano Beluzo - Fundador da Clicimob/iziBrokerz"
                                        className="relative rounded-2xl shadow-2xl w-full object-cover"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Achievements */}
            <section className="py-16 bg-slate-950 text-white">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
                        {achievements.map((achievement, index) => (
                            <div key={index} className="text-center">
                                <div className="text-4xl md:text-5xl font-bold text-emerald-400 mb-2">
                                    {achievement.number}
                                </div>
                                <p className="text-emerald-100 text-sm md:text-base">{achievement.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Career Roadmap */}
            <section className="py-20 bg-gray-50 dark:bg-slate-900">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                                Minha história...
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 text-lg">
                                Mais de duas décadas <strong>ACREDITANDO</strong> no Mercado Imobiliário Brasileiro
                            </p>
                        </div>

                        <div className="relative">
                            {/* Timeline Line */}
                            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-emerald-500/30 transform md:-translate-x-1/2"></div>

                            {milestones.map((milestone, index) => (
                                <div key={index} className={`relative mb-12 ${index % 2 === 0 ? 'md:pr-1/2' : 'md:pl-1/2 md:text-right'}`}>
                                    <div className={`flex ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-8`}>
                                        {/* Timeline Dot */}
                                        <div className="absolute left-8 md:left-1/2 w-4 h-4 bg-emerald-500 rounded-full transform md:-translate-x-1/2 ring-4 ring-gray-50 dark:ring-slate-900"></div>

                                        {/* Content Card */}
                                        <div className={`ml-20 md:ml-0 flex-1 ${index % 2 === 0 ? 'md:mr-12' : 'md:ml-12'}`}>
                                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 hover:shadow-xl transition-shadow">
                                                <div className={`flex items-center gap-3 mb-3 ${index % 2 === 0 ? '' : 'md:flex-row-reverse'}`}>
                                                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                                        {milestone.icon}
                                                    </div>
                                                    <div className={index % 2 === 0 ? '' : 'md:text-right'}>
                                                        <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                                            {milestone.year}
                                                        </p>
                                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                                            {milestone.company}
                                                        </h3>
                                                    </div>
                                                </div>
                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    {milestone.role}
                                                </p>
                                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                                    {milestone.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Mission & Vision */}
            <section className="py-20 bg-white dark:bg-slate-800">
                <div className="container mx-auto px-4">
                    <div className="max-w-5xl mx-auto">
                        <div className="grid md:grid-cols-2 gap-12">
                            <div className="bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-8 rounded-2xl border border-emerald-200 dark:border-emerald-900/30">
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Nossa Missão</h3>
                                <p className="text-gray-700 dark:text-gray-300">
                                    Empoderar Corretores Autônomos através de uma plataforma colaborativa,
                                    democratizando o acesso a tecnologia de ponta e criando um ecossistema de parcerias
                                    que multiplica oportunidades de negócio.
                                </p>
                            </div>
                            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-900 dark:to-slate-800 p-8 rounded-2xl border border-blue-200 dark:border-blue-900/30">
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Nossa Visão</h3>
                                <p className="text-gray-700 dark:text-gray-300">
                                    Ser a principal Plataforma de colaboração do mercado imobiliário brasileiro,
                                    reconhecida por transformar a forma como Corretores trabalham, conectam-se e crescem profissionalmente.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-br from-emerald-600 to-emerald-800 text-white">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">
                        Você está Pronto para Revolucionar Seus Resultados?
                    </h2>
                    <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
                        Junte-se a centenas de Corretores Autônomos que já estão fechando mais negócios com a iziBrokerz.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => navigate('/login')}
                            className="px-8 py-4 bg-white text-emerald-600 rounded-xl font-bold hover:bg-emerald-50 transition-colors shadow-lg flex items-center justify-center gap-2"
                        >
                            Começar Agora
                            <ArrowRight size={20} />
                        </button>
                        <button
                            onClick={() => navigate('/partner')}
                            className="px-8 py-4 bg-emerald-700 text-white rounded-xl font-bold hover:bg-emerald-800 transition-colors border-2 border-white/20"
                        >
                            Conhecer Planos
                        </button>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};
