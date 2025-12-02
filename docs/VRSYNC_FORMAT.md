# 📄 DOCUMENTAÇÃO: Formato XML VrSync (OLX/VivaReal/ZAP)

## 🎯 Visão Geral

O **VrSync** é o formato XML padrão usado por:
- 🟠 **OLX**
- 🔵 **VivaReal**
- 🟢 **ZAP Imóveis**
- 🟡 **QuintoAndar**
- 🔴 **Imovelweb**

É o formato mais usado no mercado imobiliário brasileiro.

---

## 📋 Estrutura Básica

```xml
<?xml version="1.0" encoding="UTF-8"?>
<ListingDataFeed xmlns="http://www.vivareal.com/schemas/1.0/VRSync">
  <Header>...</Header>
  <Listings>
    <Listing>...</Listing>
    <Listing>...</Listing>
  </Listings>
</ListingDataFeed>
```

---

## 🏢 Header (Cabeçalho)

Informações da imobiliária/corretor:

```xml
<Header>
  <Provider>Nome da Imobiliária</Provider>
  <Email>contato@imobiliaria.com.br</Email>
  <ContactName>João Silva</ContactName>
  <Telephone>(84) 99999-9999</Telephone>
  <PublishDate>2025-01-15T10:30:00</PublishDate>
</Header>
```

---

## 🏠 Listing (Anúncio Individual)

### Campos Principais

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `ListingID` | String | ✅ | ID único do anúncio |
| `Title` | String | ✅ | Título do anúncio |
| `TransactionType` | Enum | ✅ | `Sale` ou `Rent` |
| `Featured` | Boolean | ❌ | Anúncio em destaque |
| `ListDate` | Date | ✅ | Data de publicação |
| `LastUpdateDate` | Date | ❌ | Última atualização |

---

## 📝 Details (Detalhes do Imóvel)

### Descrição
```xml
<Description>
  Texto livre descrevendo o imóvel...
</Description>
```

### Tipo de Imóvel

**PropertyType (Tipo Principal):**
- `Residential` - Residencial
- `Commercial` - Comercial
- `Industrial` - Industrial
- `Rural` - Rural

**PropertySubType (Subtipo):**

**Residencial:**
- `Apartment` - Apartamento
- `Home` / `House` - Casa
- `Penthouse` - Cobertura
- `Flat` - Flat/Studio
- `Loft` - Loft
- `Kitnet` - Kitnet

**Comercial:**
- `Office` - Sala/Escritório
- `Store` - Loja
- `Warehouse` - Galpão
- `Building` - Prédio

### Valores

```xml
<ListPrice>450000</ListPrice>          <!-- Venda -->
<RentalPrice>3500</RentalPrice>        <!-- Locação -->
<Currency>BRL</Currency>
<CondominiumFee>350</CondominiumFee>   <!-- Condomínio -->
<PropertyTax>1200</PropertyTax>        <!-- IPTU anual -->
```

### Áreas

```xml
<LivingArea unit="square metres">85</LivingArea>  <!-- Área privativa -->
<LotArea unit="square metres">100</LotArea>       <!-- Área total -->
```

### Características Numéricas

```xml
<Bedrooms>3</Bedrooms>       <!-- Quartos -->
<Suites>1</Suites>           <!-- Suítes -->
<Bathrooms>2</Bathrooms>     <!-- Banheiros -->
<Garage>2</Garage>           <!-- Vagas -->
<YearBuilt>2018</YearBuilt>  <!-- Ano construção -->
<FloorNumber>5</FloorNumber> <!-- Andar -->
```

### Features (Comodidades)

Valores padrão aceitos:

**Lazer:**
- `Pool` - Piscina
- `Gym` - Academia
- `Barbecue` - Churrasqueira
- `PartyHall` - Salão de festas
- `Playground` - Playground
- `SportsField` - Quadra esportiva
- `Sauna` - Sauna
- `Garden` - Jardim

**Segurança:**
- `Gated` - Condomínio fechado
- `Doorman` - Portaria 24h
- `Alarm` - Alarme
- `ElectronicGate` - Portão eletrônico

**Comodidades:**
- `Elevator` - Elevador
- `Furnished` - Mobiliado
- `AirConditioning` - Ar condicionado
- `AmericanKitchen` - Cozinha americana
- `ServiceArea` - Área de serviço
- `Balcony` - Varanda
- `Backyard` - Quintal

```xml
<Features>
  <Feature>Pool</Feature>
  <Feature>Gym</Feature>
  <Feature>Barbecue</Feature>
</Features>
```

---

## 📍 Location (Localização)

```xml
<Location displayAddress="Neighborhood">
  <Country abbreviation="BR">Brasil</Country>
  <State abbreviation="RN">Rio Grande do Norte</State>
  <City>Natal</City>
  <Neighborhood>Ponta Negra</Neighborhood>
  <Address>Rua das Flores</Address>
  <StreetNumber>123</StreetNumber>
  <Complement>Apto 501</Complement>
  <PostalCode>59090-100</PostalCode>
  <Latitude>-5.8814</Latitude>
  <Longitude>-35.1732</Longitude>
</Location>
```

**displayAddress:**
- `All` - Mostra endereço completo
- `Street` - Mostra até rua
- `Neighborhood` - Mostra só bairro
- `None` - Não mostra endereço

---

## 📸 Media (Fotos e Vídeos)

```xml
<Media>
  <!-- Foto principal -->
  <Item medium="image" primary="true">
    <MediaURL>https://exemplo.com/foto1.jpg</MediaURL>
    <Caption>Sala de estar</Caption>
  </Item>
  
  <!-- Outras fotos -->
  <Item medium="image">
    <MediaURL>https://exemplo.com/foto2.jpg</MediaURL>
    <Caption>Cozinha</Caption>
  </Item>
  
  <!-- Vídeo -->
  <Item medium="video">
    <MediaURL>https://youtube.com/watch?v=exemplo</MediaURL>
    <Caption>Tour virtual</Caption>
  </Item>
</Media>
```

**Tipos de mídia:**
- `image` - Foto
- `video` - Vídeo
- `tour` - Tour virtual 360°

---

## 👤 ContactInfo (Contato)

```xml
<ContactInfo>
  <Name>Maria Santos</Name>
  <Email>maria@imobiliaria.com.br</Email>
  <Telephone>(84) 98888-7777</Telephone>
  <Website>https://www.imobiliaria.com.br</Website>
</ContactInfo>
```

---

## 🗺️ Mapeamento para iziBrokerz

### TransactionType → operacoes
```javascript
const operacaoMap = {
  'Sale': 'Venda',
  'Rent': 'Locação'
};
```

### PropertyType → tipos_imovel
```javascript
const tipoMap = {
  'Residential': 'Residencial',
  'Commercial': 'Comercial',
  'Industrial': 'Industrial',
  'Rural': 'Rural'
};
```

### PropertySubType → subtipos_imovel
```javascript
const subtipoMap = {
  'Apartment': 'Apartamento',
  'Home': 'Casa',
  'House': 'Casa',
  'Penthouse': 'Cobertura',
  'Flat': 'Flat',
  'Loft': 'Loft',
  'Kitnet': 'Kitnet',
  'Office': 'Sala Comercial',
  'Store': 'Loja',
  'Warehouse': 'Galpão',
  'Building': 'Prédio'
};
```

### Features → caracteristicas
```javascript
const featureMap = {
  'Pool': 'Piscina',
  'Gym': 'Academia',
  'Barbecue': 'Churrasqueira',
  'PartyHall': 'Salão de Festas',
  'Playground': 'Playground',
  'Gated': 'Condomínio Fechado',
  'Elevator': 'Elevador',
  'Furnished': 'Mobiliado',
  'AirConditioning': 'Ar Condicionado',
  'Garden': 'Jardim',
  'Sauna': 'Sauna',
  'SportsField': 'Quadra Esportiva'
};
```

---

## ✅ Validações Importantes

### Campos Obrigatórios
- ✅ `ListingID`
- ✅ `Title`
- ✅ `TransactionType`
- ✅ `PropertyType`
- ✅ `ListPrice` OU `RentalPrice`
- ✅ `City`
- ✅ `State`
- ✅ `PostalCode`

### Validações de Valores
- `ListPrice` e `RentalPrice` devem ser números positivos
- `PostalCode` deve ter 8 dígitos (formato: 12345-678)
- `Latitude` e `Longitude` devem ser válidos
- `YearBuilt` deve ser entre 1900 e ano atual
- URLs de mídia devem ser válidas (http/https)

---

## 🚨 Erros Comuns

### 1. Encoding Incorreto
❌ **Errado:**
```xml
<?xml version="1.0" encoding="ISO-8859-1"?>
```

✅ **Correto:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
```

### 2. Namespace Faltando
❌ **Errado:**
```xml
<ListingDataFeed>
```

✅ **Correto:**
```xml
<ListingDataFeed xmlns="http://www.vivareal.com/schemas/1.0/VRSync">
```

### 3. Valores Vazios
❌ **Errado:**
```xml
<ListPrice></ListPrice>
<RentalPrice></RentalPrice>
```

✅ **Correto:**
```xml
<ListPrice>450000</ListPrice>
<!-- OU omitir o campo completamente -->
```

### 4. Coordenadas Inválidas
❌ **Errado:**
```xml
<Latitude>-5,8814</Latitude>  <!-- Vírgula -->
```

✅ **Correto:**
```xml
<Latitude>-5.8814</Latitude>  <!-- Ponto -->
```

---

## 📊 Exemplo Completo de Importação

### 1. Ler XML
```typescript
const parser = new DOMParser();
const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
```

### 2. Extrair Listings
```typescript
const listings = xmlDoc.getElementsByTagName('Listing');
```

### 3. Para cada Listing
```typescript
for (let i = 0; i < listings.length; i++) {
  const listing = listings[i];
  
  const property = {
    titulo: getTagValue(listing, 'Title'),
    operacao: mapOperacao(getTagValue(listing, 'TransactionType')),
    tipo: mapTipo(getTagValue(listing, 'PropertyType')),
    subtipo: mapSubtipo(getTagValue(listing, 'PropertySubType')),
    // ... mais campos
  };
  
  await importarImovel(property);
}
```

---

## 🔗 Referências

- [Documentação Oficial VrSync](http://xml.vivareal.com/vrsync.xsd)
- [OLX XML Feed](https://www.olx.com.br/profissional/xml-feed)
- [VivaReal Integração](https://www.vivareal.com.br/integracao)
- [ZAP Imóveis API](https://www.zapimoveis.com.br/api)

---

**Última atualização:** 23/11/2025
