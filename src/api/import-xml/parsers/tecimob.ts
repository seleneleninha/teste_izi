export interface ImportedImovel {
    codigo_imovel: string;
    tipo_imovel: string;
    operacao: 'venda' | 'locacao';
    valor_venda: number;
    valor_locacao: number;
    valor_condominio: number;
    cidade: string;
    bairro: string;
    logradouro: string;
    cep: string;
    area_priv: number;
    area_total: number;
    quartos: number;
    suites: number;
    banheiros: number;
    vagas: number;
    titulo: string;
    descricao: string;
    foto_capa: string;
    fotos_imovel: string[];
    videos: string[];
    caracteristicas: string[];
    pronto_morar: boolean;
    uf: string;
    numero: string;
}

export const parseTecimobXML = async (xmlContent: string): Promise<ImportedImovel[]> => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
    const imoveisNodes = xmlDoc.getElementsByTagName("Imovel");
    const imoveis: ImportedImovel[] = [];

    for (let i = 0; i < imoveisNodes.length; i++) {
        const node = imoveisNodes[i];
        try {
            const imovel = parseImovelNode(node);
            if (imovel) imoveis.push(imovel);
        } catch (e) {
            console.error("Erro ao parsear imóvel:", e);
        }
    }

    return imoveis;
};

const parseImovelNode = (node: Element): ImportedImovel | null => {
    const getText = (tag: string) => node.getElementsByTagName(tag)[0]?.textContent || "";
    const getNumber = (tag: string) => parseFloat(getText(tag)) || 0;
    const getBoolean = (tag: string) => getText(tag) === "1";

    const codigo = getText("CodigoImovel");
    if (!codigo) return null;

    // Mapeamento de Tipo
    let tipo = getText("TipoImovel");
    if (tipo.includes("Flat")) tipo = "Flat";
    // Ajustes simples, pode expandir conforme necessidade

    // Mapeamento de Operação
    const tipoOferta = getText("TipoOferta");
    const operacao = tipoOferta === "4" ? "locacao" : "venda"; // Default venda

    // Tratamento de Observação (HTML)
    const obs = getText("Observacao");
    const { titulo, descricao } = stripHtmlAndExtractTitle(obs);

    // Características
    const caracteristicas = extractCaracteristicas(node);

    // Fotos
    const { foto_capa, fotos_imovel } = extractFotos(node);

    // Videos
    const videos: string[] = [];
    const videosNode = node.getElementsByTagName("Videos")[0];
    if (videosNode) {
        const videoTags = videosNode.getElementsByTagName("Video");
        for (let i = 0; i < videoTags.length; i++) {
            const url = videoTags[i].getElementsByTagName("Url")[0]?.textContent;
            if (url) videos.push(url);
        }
    }

    return {
        codigo_imovel: codigo,
        tipo_imovel: tipo,
        operacao: operacao,
        valor_venda: getNumber("PrecoVenda"),
        valor_locacao: getNumber("PrecoLocacao"),
        valor_condominio: getNumber("PrecoCondominio"),
        cidade: getText("Cidade"),
        bairro: getText("Bairro"),
        logradouro: getText("Endereco"),
        numero: getText("Numero"),
        cep: getText("CEP"),
        uf: getText("UF"),
        area_priv: getNumber("AreaUtil"),
        area_total: getNumber("AreaTotal"),
        quartos: getNumber("QtdDormitorios"),
        suites: getNumber("QtdSuites"),
        banheiros: getNumber("QtdBanheiros"),
        vagas: getNumber("QtdVagas"),
        titulo: titulo || `${tipo} em ${getText("Bairro")}`,
        descricao: descricao,
        foto_capa: foto_capa || "",
        fotos_imovel: fotos_imovel,
        videos: videos,
        caracteristicas: caracteristicas,
        pronto_morar: getBoolean("ProntoMorar"),
    };
};

function extractFotos(node: Element) {
    const fotosNode = node.getElementsByTagName("Fotos")[0];
    let foto_capa = "";
    const fotos_imovel: string[] = [];

    if (fotosNode) {
        const fotoTags = fotosNode.getElementsByTagName("Foto");
        for (let i = 0; i < fotoTags.length; i++) {
            const f = fotoTags[i];
            const url = f.getElementsByTagName("URLArquivo")[0]?.textContent || "";
            const principal = f.getElementsByTagName("Principal")[0]?.textContent === "1";

            if (url) {
                if (principal && !foto_capa) {
                    foto_capa = url;
                } else {
                    fotos_imovel.push(url);
                }
            }
        }
    }

    // Fallback se não tiver capa marcada
    if (!foto_capa && fotos_imovel.length > 0) {
        foto_capa = fotos_imovel.shift() || "";
    }

    return { foto_capa, fotos_imovel };
}

function extractCaracteristicas(node: Element): string[] {
    const features: string[] = [];
    const mapping: Record<string, string> = {
        Interfone: "Interfone",
        Academia: "Academia",
        Cerca: "Cerca",
        Churrasqueira: "Churrasqueira",
        Piscina: "Piscina",
        Playground: "Playground",
        Acesso24Horas: "Acesso 24h",
        QuadraPoliEsportiva: "Quadra Poliesportiva",
        SalaoFestas: "Salão de Festas",
        SalaoJogos: "Salão de Jogos",
        Sauna: "Sauna",
        Hidromassagem: "Hidromassagem",
        CampoFutebol: "Campo de Futebol",
        QuadraTenis: "Quadra de Tênis",
        Jardim: "Jardim",
        Quintal: "Quintal",
        EspacoGourmet: "Espaço Gourmet",
        AreaLazer: "Área de Lazer",
        Elevador: "Elevador",
        ArCondicionado: "Ar Condicionado"
    };

    for (const [tag, label] of Object.entries(mapping)) {
        if (node.getElementsByTagName(tag)[0]?.textContent === "1") {
            features.push(label);
        }
    }

    return features;
}

function stripHtmlAndExtractTitle(html: string) {
    // Cria um elemento temporário para usar o parser do browser
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    const textWithBreaks = html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '') // Remove outras tags
        .trim();

    // Pegar primeira linha não vazia como título
    const lines = textWithBreaks.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    let titulo = "";
    if (lines.length > 0) {
        titulo = lines[0];
        if (titulo.length > 100) titulo = titulo.substring(0, 97) + "...";
    }

    return { titulo, descricao: textWithBreaks };
}
