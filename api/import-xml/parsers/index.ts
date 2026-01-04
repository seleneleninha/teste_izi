import { parseTecimobXML } from "./tecimob";

export type XMLFormat = 'tecimob' | 'unknown';

export const detectXMLFormat = (xmlContent: string): XMLFormat => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, "text/xml");

    if (xmlDoc.getElementsByTagName("Carga").length > 0 &&
        xmlDoc.getElementsByTagName("Imovel").length > 0) {
        return 'tecimob';
    }

    return 'unknown';
};

export const parsers = {
    tecimob: parseTecimobXML,
};
