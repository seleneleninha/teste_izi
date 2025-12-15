import { TourStep } from '../components/OnboardingTour';

export const ONBOARDING_TOUR_STEPS: TourStep[] = [
    {
        target: 'body',
        title: '👋 Bem-vindo(a) à iziBrokerz!',
        placement: 'center',
        content: (
            <div>
                <p className="mb-3">
                    Estamos felizes em ter você aqui! Vamos fazer um tour rápido para você aproveitar 100% das funcionalidades da Plataforma, ok?
                </p>
                <p className="text-xs text-gray-400">
                    Você pode pular este tour a qualquer momento, mas recomendamos fortemente que complete-o para não perder nenhum recurso importante.
                </p>
            </div>
        )
    },
    {
        target: 'profile-settings',
        title: '📋 Complete seu Perfil',
        placement: 'right',
        content: (
            <div>
                <p className="mb-3">
                    <strong>Preencher todos os dados do seu cadastro é essencial!</strong> Isso traz mais confiabilidade e profissionalismo para seus Clientes.
                </p>
                <div className="bg-blue-50 bg-blue-900/20 rounded-full p-3 mb-3">
                    <p className="text-sm font-semibold mb-2">✅ Benefícios de um perfil completo:</p>
                    <ul className="text-xs space-y-1 ml-4 list-disc">
                        <li>Clientes confiam mais em Corretores com perfil completo</li>
                        <li>Sua página pública fica mais profissional</li>
                        <li>Desbloqueia recursos como Imóveis Parceiros</li>
                        <li>Melhora seu ranking nos resultados de busca</li>
                    </ul>
                </div>
                <p className="text-md text-amber-600 text-amber-400 font-medium">
                    💡 Dica: Informe seu endereço, bairro e cidade, isso traz credibilidade para seus Clientes!
                </p>
            </div>
        )
    },
    {
        target: 'logo-upload',
        title: '🎨 Personalize sua Marca',
        placement: 'left',
        content: (
            <div>
                <p className="mb-3">
                    <strong>Suba suas logos e personalize sua Página (slug)</strong> para criar uma identidade profissional única!
                </p>
                <div className="bg-purple-50 bg-purple-900/20 rounded-full p-3 mb-3">
                    <p className="text-sm font-semibold mb-2">🌟 Por que isso é importante:</p>
                    <ul className="text-xs space-y-1 ml-4 list-disc">
                        <li>Sua página terá sua marca (ex: izibrokerz.com/seu-nome)</li>
                        <li>Clientes veem seu logo em todos os imóveis</li>
                        <li>Transmite profissionalismo e credibilidade</li>
                        <li>Diferencia você da concorrência</li>
                    </ul>
                </div>
                <p className="text-md text-purple-600 text-purple-400 font-medium">
                    💡 Dica: Use logos em alta qualidade (PNG com fundo transparente)
                </p>
            </div>
        )
    },
    {
        target: 'radius-field',
        title: '📍 Defina seu Raio de Atuação',
        placement: 'right',
        content: (
            <div>
                <p className="mb-3">
                    Configure até onde você está disposto a se deslocar para mostrar imóveis. Isso otimiza seu tempo e foca em oportunidades próximas!
                </p>
                <div className="bg-green-50 bg-green-900/20 rounded-full p-3 mb-3">
                    <p className="text-sm font-semibold mb-2">🎯 Opções disponíveis:</p>
                    <ul className="text-xs space-y-1 ml-4 list-disc">
                        <li>1km, 3km, 5km - Para Corretores que trabalham em áreas específicas</li>
                        <li>10km, 20km - Para maior abrangência</li>
                        <li>Estado - Para máxima abrangência e oportunidades</li>
                    </ul>
                </div>
                <p className="text-xs text-green-600 text-green-400 font-medium">
                    💡 Você pode alterar isso a qualquer momento nas Configurações
                </p>
            </div>
        )
    },
    {
        target: 'partner-properties',
        title: '🤝 Imóveis Parceiros - Aumente sua possbilidade de ganhos, afinal é melhor <strong>50% de algo</strong> do que 100% de nada, correto??!',
        placement: 'bottom',
        content: (
            <div>
                <p className="mb-3">
                    <strong>Este é um dos recursos mais atraentes da iziBrokerz!</strong> Pouquíssimas Plataformas oferecem isso!
                </p>
                <div className="bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 rounded-full p-3 mb-3">
                    <p className="text-sm font-semibold mb-2">✨ Como funciona:</p>
                    <ul className="text-xs space-y-1 ml-4 list-disc">
                        <li>Veja imóveis de outros Corretores da sua região</li>
                        <li>Aceite parcerias e divida a comissão 50/50 (fifty)</li>
                        <li>Amplie seu portfólio sem precisar captar novos imóveis</li>
                        <li>Aumente suas chances de fechar negócios e faturar mais</li>
                    </ul>
                </div>
                <p className="text-xs text-emerald-600 text-emerald-400 font-medium">
                    🚀 Corretores que usam este recurso aumentam suas vendas em até 40%!
                </p>
            </div>
        )
    },
    {
        target: 'body',
        title: '🎉 Tudo Pronto!',
        placement: 'center',
        content: (
            <div>
                <p className="mb-3">
                    Parabéns! Agora você conhece os principais recursos da Plataforma.
                </p>
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full p-4 mb-3">
                    <p className="text-sm font-semibold mb-2">📝 Próximos passos recomendados:</p>
                    <ol className="text-xs space-y-2 ml-4 list-decimal">
                        <li>Complete seu perfil nas Configurações</li>
                        <li>Personalize sua Página</li>
                        <li>Cadastre seu primeiro imóvel</li>
                        <li>Explore os Imóveis Parceiros</li>
                        <li>Configure seu raio de atuação</li>
                    </ol>
                </div>
                <p className="text-sm font-bold text-center text-primary-600 text-primary-400">
                    Boa sorte e boas vendas! 🚀
                </p>
            </div>
        )
    }
];
