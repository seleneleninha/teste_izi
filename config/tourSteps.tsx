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
                <div className="bg-blue-50 bg-blue-900/20 rounded-2xl p-3 mb-3">
                    <p className="text-sm font-semibold mb-2">✅ Benefícios de um perfil completo:</p>
                    <ul className="text-xs space-y-1 ml-4 list-disc">
                        <li>Clientes confiam mais em Corretores com perfil completo</li>
                        <li>Sua página pública fica muito mais profissional</li>
                        <li><strong>Melhora seu ranking nos mecanismos de busca (Google)</strong></li>
                    </ul>
                </div>
                <p className="text-md text-amber-400 text-amber-400 font-medium">
                    💡 Dica Importante: Informe seu endereço, bairro e cidade, isso <span className="font-semibold text-white">Ativa o Módulo de Parcerias</span> e traz credibilidade para seus Clientes!
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
                    <strong>Suba suas logos e personalize sua Página</strong> para criar uma identidade visual e profissional única!
                </p>
                <div className="bg-purple-50 bg-purple-900/20 rounded-2xl p-3 mb-3">
                    <p className="text-sm font-semibold mb-2">🌟 Por que isso é importante:</p>
                    <ul className="text-xs space-y-1 ml-4 list-disc">
                        <li>Sua página terá sua marca <strong>(ex: izibrokerz.com/seu-nome)</strong></li>
                        <li>Clientes vêem sua logo em todos os imóveis</li>
                        <li>Suas fotos de imóveis terão a sua marca d´água</li>
                        <li>Transmite profissionalismo e credibilidade</li>
                        <li>Fale um pouco sobre sua história. Isso ajuda a construir confiança com seus clientes</li>
                    </ul>
                </div>
                <p className="text-md text-yellow-400 font-medium">
                    💡 Dica: Use logos em alta qualidade (.PNG com fundo transparente, para melhor resultado)
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
                    Ao cadastrar seu endereço, coletamos suas coordenadas e, com base nelas... calculamos automaticamente a distância dos Anúncios Parceiros!
                </p>
                <div className="bg-green-50 bg-green-900/20 rounded-2xl p-3 mb-3">
                    <p className="text-sm font-semibold mb-2">🎯 Defina sua região de trabalho:</p>
                    <ul className="text-xs space-y-1 ml-4 list-disc">
                        <li>1km, 3km, 5km - Para Corretores que trabalham em áreas específicas</li>
                        <li>10km, 20km - Para maior abrangência</li>
                        <li>+20km - Para máxima abrangência e oportunidades</li>
                        <li>Na aba <span className="font-bold text-yellow-400">"Imóveis Parceiros"</span>, você é quem define seu raio de atuação!</li>
                    </ul>
                </div>
                <p className="text-xs text-yellow-400 text-green-400 font-medium">
                    💡 Você escolhe a distância antes de aceitar as Parcerias"
                </p>
            </div >
        )
    },
    {
        target: 'partner-properties',
        title: '🤝 Imóveis Parceiros - Aumente sua possbilidade de ganhos',
        placement: 'bottom',
        content: (
            <div>
                <p className="mb-3">
                    <strong>Este é um dos recursos mais atraentes da <span className="font-bold text-red-500">izi</span>Brokerz! Pouquíssimas Plataformas oferecem isso!</strong>
                </p>
                <div className="bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 rounded-2xl p-3 mb-3">
                    <p className="text-sm font-semibold mb-2">✨ Como funciona:</p>
                    <ul className="text-xs space-y-1 ml-4 list-disc">
                        <li>Veja imóveis de outros Corretores da sua região</li>
                        <li>Aceite parcerias e divida a comissão 50/50 (fifty)</li>
                        <li>Amplie seu portfólio sem precisar captar novos imóveis</li>
                        <li>Aumente sua visibilidade e suas chances de fechar mais negócios e faturar muito mais</li>
                    </ul>
                </div>
                <p className="text-xs text-emerald-600 text-yellow-400 font-medium">
                    🚀 Corretores que usam este recurso aumentam suas vendas em até 40%!
                </p>
            </div>
        )
    },
    {
        target: 'partner-properties',
        title: '🎯 Sistema de "MATCH" para seus Clientes',
        placement: 'bottom',
        content: (
            <div>
                <p className="mb-3">
                    <strong>Este é outro recurso que poucas Plataformas tem!</strong>
                </p>
                <div className="bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 rounded-2xl p-3 mb-3">
                    <p className="text-sm font-semibold mb-2">✨ Como funciona:</p>
                    <ul className="text-xs space-y-1 ml-4 list-disc">
                        <li>1 - Você cadastra o Cliente e qual o perfil do imóvel que ele busca</li>
                        <li>2 - Ao final, <span className="font-bold text-yellow-400">buscamos em nossa base de dados</span> se existe algum imóvel compatível, AUTOMATICAMENTE</li>
                        <li>3 - Caso exista, o sistema lhe mostra as opções com o percentual de Match (100 a 70%)</li>
                        <li>4 - Você analisa o imóvel, confirma a disponibilidade e a possibilidade de Parceria com o Corretor "Dono do Anúncio"</li>
                        <li>5 - Você dispara o anúncio para o seu Cliente <span className="font-bold text-yellow-400">COM OS SEUS DADOS DE CONTATO</span> e agenda a visita</li>
                    </ul>
                </div>
                <p className="text-xs text-emerald-600 text-yellow-400 font-medium">
                    🚀 É como se você captasse um imóvel INSTANTANEAMENTE e já oferece para seu Cliente!
                </p>
            </div >
        )
    },
    {
        target: 'body',
        title: '🎉 Tudo Pronto! 🎉',
        placement: 'center',
        content: (
            <div>
                <p className="mb-3">
                    Parabéns! Agora você conhece os principais recursos da Plataforma.
                </p>
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-4 mb-3">
                    <p className="text-sm font-semibold mb-2">📝 Próximos passos recomendados:</p>
                    <ol className="text-xs space-y-2 ml-4 list-decimal">
                        <li><span className="font-bold text-yellow-400">Complete seu perfil</span> nas Configurações</li>
                        <li>Informe seu endereço e <span className="font-bold text-yellow-400">personalize toda sua Página</span></li>
                        <li><span className="font-bold text-yellow-400">Cadastre seus imóveis...</span> "Quanto mais melhor!"</li>
                        <li>Explore os IMÓVEIS PARCEIROS, <span className="font-bold text-yellow-400"> amplie seu portfólio e ganhe +</span></li>
                        <li>Cadastre seus Clientes e <span className="font-bold text-yellow-400">utilize a ferramenta MATCH</span> para aumentar suas vendas</li>
                    </ol>
                </div>
                <p className="text-lg font-bold text-center text-purple-400">
                    🤩 Boa sorte e boas vendas! 🤑
                </p>
            </div>
        )
    }
];
