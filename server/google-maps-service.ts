import type { SearchLeads } from "@shared/schema";

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

  constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY || "";
    if (!this.apiKey) {
      throw new Error("GOOGLE_MAPS_API_KEY environment variable is required");
    }
  }

  async searchBusinesses(params: SearchLeads): Promise<any[]> {
    try {
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

      // Primeiro, obter coordenadas da localização
      const geocodeUrl = `${this.baseUrl}/findplacefromtext/json?input=${encodeURIComponent(location)}&inputtype=textquery&fields=geometry&key=${this.apiKey}`;
      
      const geocodeResponse = await fetch(geocodeUrl);
      const geocodeData = await geocodeResponse.json();

      if (geocodeData.status !== "OK" || !geocodeData.candidates?.[0]) {
        throw new Error(`Failed to geocode location: ${location}`);
      }

      const { lat, lng } = geocodeData.candidates[0].geometry.location;

      // Buscar empresas próximas
      const searchPromises = types.map(async (type) => {
        const searchUrl = `${this.baseUrl}/nearbysearch/json?location=${lat},${lng}&radius=5000&type=${type}&key=${this.apiKey}`;
        
        const response = await fetch(searchUrl);
        const data: GoogleMapsSearchResponse = await response.json();

        if (data.status !== "OK") {
          console.warn(`Google Maps API error for type ${type}:`, data.status);
          return [];
        }

        return data.results.slice(0, 3); // Limitar resultados por tipo
      });

      const results = await Promise.all(searchPromises);
      const allPlaces = results.flat();

      // Obter detalhes de cada lugar
      const detailsPromises = allPlaces.map(async (place) => {
        const detailsUrl = `${this.baseUrl}/details/json?place_id=${place.place_id}&fields=name,formatted_address,formatted_phone_number,website,business_status&key=${this.apiKey}`;
        
        try {
          const response = await fetch(detailsUrl);
          const data = await response.json();
          
          if (data.status === "OK" && data.result) {
            return {
              name: data.result.name,
              address: data.result.formatted_address,
              phone: data.result.formatted_phone_number || "Não informado",
              email: this.generateEmailFromName(data.result.name),
              status: "Não Contatado" as const,
              businessType: params.businessType || "Estabelecimento",
              location: params.location || location,
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
}