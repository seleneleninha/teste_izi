import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { Building2, Users, TrendingUp, Award, CheckCircle, Linkedin, ArrowRight, Trophy, Star, Rocket } from 'lucide-react';

export const About: React.FC = () => {
    const navigate = useNavigate();

    const milestones = [
        {
            year: "1998 - 2007",
            title: "O Início da Jornada",
            role: "Corretor Autônomo",
            company: "Abyara, Lopes & Seller",
            description: "Primeiros passos em SP, desenvolvendo a base sólida em negociação e relacionamento que fundamentaria toda a carreira.",
            icon: <Building2 className="w-5 h-5" />
        },
        {
            year: "2007 - 2010",
            title: "Ascensão à Liderança",
            role: "Coordenação de Vendas",
            company: "Cyrela Plano&Plano",
            description: "Liderança de grandes lançamentos em SP e no RN, batendo recordes de vendas com os cases: L'Acqua (+R$90 milhões vendidos em um único dia) e Stillo (100% vendido em 90 dias).",
            icon: <TrendingUp className="w-5 h-5" />
        },
        {
            year: "2010 - 2012",
            title: "Gestão Estratégica",
            role: "Gestor Comercial",
            company: "Agre Vendas & Construtora Estrutural",
            description: "Implementação de novas culturas comerciais e estratégias agressivas que posicionaram as empresas como líderes locais.",
            icon: <Users className="w-5 h-5" />
        },
        {
            year: "2012 - 2015",
            title: "Alta Execução",
            role: "Superintendente & Diretor",
            company: "BrasilBrokers, DWBrasil, Ecocil",
            description: "Comando de grandes operações e 'Sales Houses', dominando o mercado potiguar com times de alta performance.",
            icon: <Award className="w-5 h-5" />
        },
        {
            year: "2015 - 2020",
            title: "Visão de Investidor",
            role: "Consultor de Investimentos",
            company: "Gusmão Imóveis & Consultoria Própria",
            description: "Foco em rentabilidade e segurança para investidores, aprimorando o olhar sobre o ativo imobiliário.",
            icon: <CheckCircle className="w-5 h-5" />
        },
        {
            year: "2021 - 2023",
            title: "A Era Digital",
            role: "CEO & Co-Founder",
            company: "ClicImob",
            description: "Nascimento da visão tecnológica: criar uma plataforma para libertar corretores das amarras tradicionais.",
            icon: <Rocket className="w-5 h-5" />
        },
        {
            year: "2023 - Hoje",
            title: "A Revolução",
            role: "CEO & Founder",
            company: "iziBrokerz",
            description: "Pivotando para o futuro. Uma plataforma para empoderar o Corretor Autônomo.",
            icon: <Star className="w-5 h-5" />
        }
    ];

    const achievements = [
        { number: "+25 anos", label: "de Experiência" },
        { number: "+2mil", label: "Negócios Fechados" },
        { number: "+3mil", label: "Corretores Treinados" },
        { number: "+3Bi", label: "VGV Gerado" }
    ];

    return (
        <div className="bg-gray-50 dark:bg-slate-900 min-h-screen font-sans">
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-slate-900 text-white py-24 lg:py-32">
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=2070"
                        alt="Background"
                        className="w-full h-full object-cover opacity-20"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent"></div>
                </div>

                <div className="container mx-auto px-6 relative z-10 text-center">
                    <span className="inline-block py-1 px-3 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-semibold mb-6 backdrop-blur-sm border border-emerald-500/30">
                        Nossa Essência
                    </span>
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight">
                        Excelência <span className="text-emerald-500">Acima</span> de Tudo
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
                        Nascida da experiência real de quem viveu cada desafio do mercado imobiliário brasileiro.
                    </p>
                </div>
            </section>

            {/* Founder Profile */}
            <section className="py-20 lg:py-28 relative">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        {/* Image Side */}
                        <div className="lg:w-1/2 relative group">
                            <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-2xl opacity-30 group-hover:opacity-50 blur-lg transition duration-500"></div>
                            <div className="relative rounded-2xl overflow-hidden shadow-2xl transform transition hover:-translate-y-1 duration-500">
                                <img
                                    src="/cristiano-profile.jpg"
                                    alt="Beluzzo"
                                    className="w-full h-auto object-cover md:max-h-[600px]"
                                />
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-8">
                                    <h3 className="text-2xl font-bold text-white">Beluzzo</h3>
                                    <p className="text-emerald-400 font-medium">Founder & CEO</p>
                                </div>
                            </div>
                        </div>

                        {/* Text Side */}
                        <div className="lg:w-1/2">
                            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                                A Visão por Trás da Inovação
                            </h2>
                            <div className="space-y-6 text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                                <p>
                                    Com mais de <strong className="text-emerald-600 dark:text-emerald-400">25 anos de estrada, BELUZZO</strong> é um corretor que escalou cada degrau. De plantões de vendas, "plantões pirata", coordenações... à gerências e diretoria de grandes incorporadoras.
                                </p>
                                <p>
                                    Sua trajetória revelou uma verdade incômoda: o mercado é hostil ao profissional autônomo. Falta apoio, falta tecnologia e sobram barreiras.
                                </p>
                                <blockquote className="border-l-4 border-emerald-500 pl-4 py-2 italic text-gray-800 dark:text-gray-200 bg-emerald-50 dark:bg-emerald-900/10 rounded-r-lg">
                                    "A iziBrokerz não é sobre software. <br />É sobre liberdade! <br />É DAR AOS CORRETORES AS <br />ARMAS PARA VENCER GIGANTES!"
                                </blockquote>
                            </div>

                            <a
                                href="https://www.linkedin.com/in/cristianobeluzo/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-3 mt-8 px-8 py-4 bg-[#0077b5] text-white rounded-xl font-semibold hover:bg-[#006396] transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            >
                                <Linkedin size={22} />
                                Conectar no LinkedIn
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats grid */}
            <section className="py-16 bg-slate-900 border-y border-slate-800">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {achievements.map((item, idx) => (
                            <div key={idx} className="text-center p-6 rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700 hover:border-emerald-500/50 transition-colors group">
                                <div className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-2 group-hover:scale-110 transition-transform">
                                    {item.number}
                                </div>
                                <div className="text-slate-400 font-medium text-sm md:text-base uppercase tracking-wider">
                                    {item.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Roadmap Timeline */}
            <section className="py-24 bg-white dark:bg-slate-950 relative overflow-hidden">
                <div className="container mx-auto px-6 relative z-10">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold tracking-wider text-sm uppercase">Minha Jornada</span>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mt-2 mb-4">Um Legado em Construção</h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            Cada passo foi um aprendizado para construir a solução definitiva para o mercado.
                        </p>
                    </div>

                    <div className="max-w-4xl mx-auto relative">
                        {/* Vertical Line */}
                        <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-emerald-200 dark:via-emerald-800 to-transparent md:-translate-x-1/2"></div>

                        <div className="space-y-12">
                            {milestones.map((item, index) => (
                                <div key={index} className={`relative flex flex-col md:flex-row gap-8 items-start ${index % 2 === 0 ? '' : 'md:flex-row-reverse'}`}>

                                    {/* Timeline Node */}
                                    <div className="absolute left-4 md:left-1/2 w-8 h-8 rounded-full bg-white dark:bg-slate-900 border-4 border-emerald-500 z-10 transform -translate-x-1/2 flex items-center justify-center shadow-lg">
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                                    </div>

                                    {/* Content */}
                                    <div className={`ml-12 md:ml-0 md:w-1/2 ${index % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12 md:text-left'}`}>
                                        <div className="inline-block px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold mb-3">
                                            {item.year}
                                        </div>
                                        <div className={`p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-800 hover:shadow-xl transition-all group ${index % 2 === 0 ? 'md:ml-auto' : 'md:mr-auto'}`}>
                                            <div className={`flex items-center gap-3 mb-4 ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                                                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                                                    {item.icon}
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                                                        {item.title}
                                                    </h4>
                                                    <div className="text-sm font-medium text-emerald-600 dark:text-emerald-500">
                                                        {item.company}
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                                                {item.description}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Spacer for the other side */}
                                    <div className="hidden md:block md:w-1/2"></div>
                                </div>
                            ))}
                        </div>

                        {/* Final Quote Node */}
                        <div className="relative pt-16 text-center">
                            <div className="inline-flex flex-col items-center">
                                <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xl mb-6 relative z-10 animate-pulse">
                                    <Trophy size={32} />
                                </div>
                                <div className="max-w-2xl px-6 py-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl text-white shadow-2xl relative animate-pulse">
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-slate-900 rotate-45"></div>
                                    <p className="text-lg italic font-light opacity-90 mb-4">
                                        "Seja você quem for, seja qual for a posição social que você tenha na vida... tenha sempre como meta MUITA FORÇA, muita DETERMINAÇÃO e sempre FAÇA TUDO COM MUITO AMOR e com MUITA FÉ EM DEUS... que um dia VOCÊ CHEGA LÁ!!!"
                                    </p>
                                    <span className="text-emerald-400 font-bold text-xl tracking-widest uppercase">— Ayrton Senna</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 relative overflow-hidden">
                <div className="absolute inset-0 bg-emerald-600">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500 rounded-full blur-3xl opacity-50"></div>
                </div>

                <div className="container mx-auto px-6 relative z-10 text-center text-white">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">Pronto para escrever sua história?</h2>
                    <p className="text-xl text-emerald-100 mb-10 max-w-2xl mx-auto">
                        A tecnologia que faltava para você alcançar o próximo nível na sua carreira.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => navigate('/login')}
                            className="px-8 py-4 bg-white text-emerald-700 rounded-xl font-bold hover:shadow-2xl hover:-translate-y-1 transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                            Começar Gratuitamente
                            <ArrowRight size={20} />
                        </button>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};
