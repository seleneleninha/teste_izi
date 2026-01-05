export interface ImportedImovel {
    cod_imovel: string;
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
        cod_imovel: codigo,
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

    // Lista de campos que NÃO são características (metadata, preços, etc)
    const ignoredTags = new Set([
        'CodigoImovel', 'TipoImovel', 'SubTipoImovel', 'CategoriaImovel', 'Modelo',
        'TituloImovel', 'Observacao', 'PrecoVenda', 'PrecoLocacao', 'PrecoCondominio', 'PrecoIptu',
        'PrecoTemporada', 'PrecoDiaria', 'ValorVenda', 'ValorLocacao', 'ValorCondominio', 'ValorIptu',
        'Cidade', 'Bairro', 'Endereco', 'Numero', 'Complemento', 'CEP', 'UF', 'Estado',
        'AreaUtil', 'AreaTotal', 'AreaPrivativa', 'AreaTerreno', 'AreaConstruida',
        'QtdDormitorios', 'QtdSuites', 'QtdBanheiros', 'QtdVagas', 'QtdSalas',
        'Fotos', 'Videos', 'UrlVideo', 'TourVirtual', 'Mapa', 'Latitude', 'Longitude',
        'DataCadastro', 'DataAtualizacao', 'Destaque', 'SuperDestaque', 'Lancamento',
        'ProntoMorar', 'EmConstrucao', 'NaPlanta', 'Ocupado', 'Reservado', 'Vendido',
        'Permuta', 'Financiamento', 'AceitaPermuta', 'AceitaFinanciamento',
        'NomeCondominio', 'AnoConstrucao', 'Construtora', 'InscricaoMunicipal'
    ]);

    // Itera sobre todos os filhos diretos do nó Imóvel
    const children = node.children;
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        const tagName = child.tagName;
        const textContent = child.textContent;

        // Se o valor for "1" (true) e não estiver na lista de ignorados
        if (textContent === "1" && !ignoredTags.has(tagName)) {
            // Formata o nome da tag (Ex: "SalaoFestas" -> "Salao Festas")
            // Insere espaço antes de letras maiúsculas (exceto a primeira)
            const formatted = tagName.replace(/([A-Z])/g, ' $1').trim();
            features.push(formatted);
        }
    }

    return features;
}

function stripHtmlAndExtractTitle(html: string) {
    if (!html) return { titulo: "", descricao: "" };

    // 1. Decode HTML identifiers (e.g. &lt; -> <)
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    const decoded = tempDiv.textContent || tempDiv.innerText || "";

    // 2. Convert <br> to newlines (in the decoded string)
    // Note: If the input was &lt;br&gt;, decoded is <br>.
    const withBreaks = decoded.replace(/<br\s*\/?>/gi, '\n');

    // 3. Strip remaining tags
    const cleanText = withBreaks.replace(/<[^>]+>/g, '').trim();

    // 4. Extract Title (first line)
    const lines = cleanText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    let titulo = "";
    if (lines.length > 0) {
        titulo = lines[0];
        if (titulo.length > 100) titulo = titulo.substring(0, 97) + "...";
    }

    return { titulo, descricao: cleanText };
}
