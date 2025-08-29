import type { SearchLeads } from "@shared/schema";
import { LeadScoringService } from "./lead-scoring-service";

interface GoogleMapsPlace {
  place_id: string;
  name: string;
  formatted_address: string;
  formatted_phone_number?: string;
  website?: string;
  business_status?: string;
  rating?: number;
  types: string[];
}

interface GoogleMapsSearchResponse {
  results: GoogleMapsPlace[];
  status: string;
  next_page_token?: string;
}

export class GoogleMapsService {
  private apiKey: string;
  private baseUrl = "https://maps.googleapis.com/maps/api/place";
  private leadScoringService: LeadScoringService;

  constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY || "";
    if (!this.apiKey) {
      throw new Error("GOOGLE_MAPS_API_KEY environment variable is required");
    }
    
    // Validar formato da API key
    if (!this.apiKey.match(/^[A-Za-z0-9_-]+$/)) {
      console.warn("⚠️ API Key do Google Maps pode ter formato inválido");
    }
    
    this.leadScoringService = new LeadScoringService();
  }

  async searchBusinesses(params: SearchLeads): Promise<any[]> {
    try {
      console.log("🔍 Iniciando busca no Google Maps com parâmetros:", params);
      console.log("🔑 API Key configurada:", this.apiKey ? "Sim" : "Não");
      
      // Testar conectividade da API primeiro
      const isConnected = await this.testApiConnection();
      if (!isConnected) {
        throw new Error("API do Google Maps não está acessível. Verifique sua conexão e API key.");
      }
      
      // Verificar se é uma busca livre ou por tipo predefinido
      const isFreeSearch = params.freeSearch && params.freeSearch.trim().length > 0;
      
      if (isFreeSearch) {
        console.log("🔍 Busca livre detectada:", params.freeSearch);
        return await this.searchByFreeText(params);
      }
      
      // Mapeamento dos tipos de negócio para categorias do Google Maps
      const businessTypeMapping: Record<string, string[]> = {
        "Restaurantes": ["restaurant", "food", "meal_takeaway"],
        "Academias": ["gym", "fitness", "health"],
        "Clínicas": ["hospital", "doctor", "health", "medical"],
        "Escritórios": ["lawyer", "accounting", "real_estate_agency"],
        "Comércio": ["store", "shopping_mall", "clothing_store"]
      };

      const types = businessTypeMapping[params.businessType || "Restaurantes"] || ["establishment"];
      const location = params.location || "São Paulo, SP";
      
      console.log("📍 Localização:", location);
      console.log("🏢 Tipos de negócio:", types);

      // Primeiro, obter coordenadas da localização
      const geocodeUrl = `${this.baseUrl}/findplacefromtext/json?input=${encodeURIComponent(location)}&inputtype=textquery&fields=geometry&key=${this.apiKey}`;
      console.log("🌐 URL de geocodificação:", geocodeUrl);
      
      const geocodeResponse = await fetch(geocodeUrl);
      const geocodeData = await geocodeResponse.json();
      
      console.log("📡 Resposta da geocodificação:", geocodeData.status);

      if (geocodeData.status !== "OK" || !geocodeData.candidates?.[0]) {
        console.error("❌ Erro na geocodificação:", geocodeData);
        
        // Tratamento específico para diferentes tipos de erro
        if (geocodeData.status === "OVER_QUERY_LIMIT") {
          throw new Error("Limite de consultas da API do Google Maps foi excedido. Tente novamente mais tarde.");
        } else if (geocodeData.status === "REQUEST_DENIED") {
          throw new Error("API Key do Google Maps foi rejeitada. Verifique se está correta e ativa.");
        } else if (geocodeData.status === "INVALID_REQUEST") {
          throw new Error("Parâmetros de busca inválidos.");
        } else {
          throw new Error(`Erro na geocodificação: ${geocodeData.status} - ${geocodeData.error_message || "Localização não encontrada"}`);
        }
      }

      const { lat, lng } = geocodeData.candidates[0].geometry.location;

      // Buscar empresas próximas
      console.log("🎯 Coordenadas obtidas:", { lat, lng });
      
      const searchPromises = types.map(async (type) => {
        const searchUrl = `${this.baseUrl}/nearbysearch/json?location=${lat},${lng}&radius=5000&type=${type}&key=${this.apiKey}`;
        console.log(`🔍 Buscando tipo ${type}:`, searchUrl);
        
        const response = await fetch(searchUrl);
        const data: GoogleMapsSearchResponse = await response.json();
        
        console.log(`📊 Resposta para ${type}:`, data.status, "Resultados:", data.results?.length || 0);

        if (data.status !== "OK") {
          console.warn(`⚠️ Google Maps API error for type ${type}:`, data.status);
          return [];
        }

        return data.results.slice(0, 3); // Limitar resultados por tipo
      });

      const results = await Promise.all(searchPromises);
      const allPlaces = results.flat();

      // Obter detalhes de cada lugar
      const detailsPromises = allPlaces.map(async (place) => {
        const detailsUrl = `${this.baseUrl}/details/json?place_id=${place.place_id}&fields=name,formatted_address,formatted_phone_number,website,business_status,rating,user_ratings_total&key=${this.apiKey}`;
        
        try {
          const response = await fetch(detailsUrl);
          const data = await response.json();
          
          if (data.status === "OK" && data.result) {
            const leadData = {
              name: data.result.name,
              address: data.result.formatted_address,
              phone: data.result.formatted_phone_number || "Não informado",
              email: this.generateEmailFromName(data.result.name),
              status: "Não Contatado" as const,
              businessType: params.businessType || "Estabelecimento",
              location: params.location || location,
              website: data.result.website,
              rating: data.result.rating,
              userRatingsTotal: data.result.user_ratings_total,
            };
            
            // Calcular Lead Score
            const { score, breakdown, category } = this.leadScoringService.calculateLeadScore(leadData);
            
            return {
              ...leadData,
              leadScore: score.toString(),
              leadScoreBreakdown: JSON.stringify(breakdown),
              leadCategory: category,
            };
          }
        } catch (error) {
          console.warn(`Failed to get details for place ${place.place_id}:`, error);
        }
        
        return null;
      });

      const detailedPlaces = await Promise.all(detailsPromises);
      const validPlaces = detailedPlaces.filter(place => place !== null);

      // Remover duplicatas baseado no nome
      const uniquePlaces = validPlaces.filter((place, index, self) => 
        index === self.findIndex(p => p?.name === place?.name)
      );

      return uniquePlaces.slice(0, 8); // Limitar a 8 resultados

    } catch (error) {
      console.error("Error searching Google Maps:", error);
      throw new Error("Failed to search businesses on Google Maps");
    }
  }

  private generateEmailFromName(name: string): string {
    // Gerar email baseado no nome do negócio
    const cleanName = name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "")
      .substring(0, 15);
    
    const domains = ["gmail.com", "hotmail.com", "outlook.com", "yahoo.com"];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    
    return `contato@${cleanName}.com.br`;
  }

  // Método para testar a conectividade da API
  async testApiConnection(): Promise<boolean> {
    try {
      const testUrl = `${this.baseUrl}/findplacefromtext/json?input=test&inputtype=textquery&fields=formatted_address&key=${this.apiKey}`;
      console.log("🧪 Testando conectividade da API:", testUrl);
      
      const response = await fetch(testUrl);
      const data = await response.json();
      
      console.log("🧪 Resposta do teste:", data.status);
      
      // Se retornar OVER_QUERY_LIMIT, significa que a API key está funcionando mas excedeu o limite
      if (data.status === "OVER_QUERY_LIMIT") {
        console.warn("⚠️ API Key válida mas excedeu o limite de consultas");
        return true;
      }
      
      return data.status === "OK" || data.status === "ZERO_RESULTS";
    } catch (error) {
      console.error("❌ Erro ao testar conectividade da API:", error);
      return false;
    }
  }

  // Método para busca livre por texto
  private async searchByFreeText(params: SearchLeads): Promise<any[]> {
    try {
      const searchTerm = params.freeSearch!.trim();
      const location = params.location || "São Paulo, SP";
      
      console.log("🔍 Iniciando busca livre:", { searchTerm, location });
      
      // Primeiro, obter coordenadas da localização
      const geocodeUrl = `${this.baseUrl}/findplacefromtext/json?input=${encodeURIComponent(location)}&inputtype=textquery&fields=geometry&key=${this.apiKey}`;
      const geocodeResponse = await fetch(geocodeUrl);
      const geocodeData = await geocodeResponse.json();
      
      if (geocodeData.status !== "OK" || !geocodeData.candidates?.[0]) {
        throw new Error(`Erro na geocodificação: ${geocodeData.status} - ${geocodeData.error_message || "Localização não encontrada"}`);
      }
      
      const { lat, lng } = geocodeData.candidates[0].geometry.location;
      console.log("🎯 Coordenadas obtidas para busca livre:", { lat, lng });
      
      // Usar a API de busca por texto para encontrar estabelecimentos
      const searchUrl = `${this.baseUrl}/textsearch/json?query=${encodeURIComponent(searchTerm)}&location=${lat},${lng}&radius=10000&key=${this.apiKey}`;
      console.log("🔍 URL de busca livre:", searchUrl);
      
      const response = await fetch(searchUrl);
      const data = await response.json();
      
      console.log("📊 Resposta da busca livre:", data.status, "Resultados:", data.results?.length || 0);
      
      if (data.status !== "OK") {
        console.warn("⚠️ Erro na busca livre:", data.status);
        return [];
      }
      
      // Obter detalhes de cada lugar encontrado
      const detailsPromises = data.results.slice(0, 10).map(async (place: any) => {
        const detailsUrl = `${this.baseUrl}/details/json?place_id=${place.place_id}&fields=name,formatted_address,formatted_phone_number,website,business_status,rating,user_ratings_total&key=${this.apiKey}`;
        
        try {
          const detailsResponse = await fetch(detailsUrl);
          const detailsData = await detailsResponse.json();
          
          if (detailsData.status === "OK" && detailsData.result) {
            const leadData = {
              name: detailsData.result.name,
              address: detailsData.result.formatted_address,
              phone: detailsData.result.formatted_phone_number || "Não informado",
              email: this.generateEmailFromName(detailsData.result.name),
              status: "Não Contatado" as const,
              businessType: searchTerm, // Usar o termo de busca como tipo de negócio
              location: location,
              website: detailsData.result.website,
              rating: detailsData.result.rating,
              userRatingsTotal: detailsData.result.user_ratings_total,
            };
            
            // Calcular Lead Score
            const { score, breakdown, category } = this.leadScoringService.calculateLeadScore(leadData);
            
            return {
              ...leadData,
              leadScore: score.toString(),
              leadScoreBreakdown: JSON.stringify(breakdown),
              leadCategory: category,
            };
          }
        } catch (error) {
          console.warn(`Failed to get details for place ${place.place_id}:`, error);
        }
        
        return null;
      });
      
      const detailedPlaces = await Promise.all(detailsPromises);
      const validPlaces = detailedPlaces.filter(place => place !== null);
      
      // Remover duplicatas baseado no nome
      const uniquePlaces = validPlaces.filter((place, index, self) => 
        index === self.findIndex(p => p?.name === place?.name)
      );
      
      console.log("✅ Busca livre concluída. Resultados únicos:", uniquePlaces.length);
      return uniquePlaces.slice(0, 8); // Limitar a 8 resultados
      
    } catch (error) {
      console.error("❌ Erro na busca livre:", error);
      throw new Error(`Falha na busca livre: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    }
  }
}