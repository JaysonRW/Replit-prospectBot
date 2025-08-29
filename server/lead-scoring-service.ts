interface LeadScoringData {
  website?: string;
  rating?: number;
  userRatingsTotal?: number;
  name: string;
  address: string;
  phone: string;
}

interface LeadScoreBreakdown {
  websiteScore: number;
  ratingScore: number;
  volumeScore: number;
  profileCompletenessScore: number;
  overallScore: number;
  reasoning: string[];
}

export class LeadScoringService {
  
  /**
   * Calcula o score completo de um lead baseado em múltiplas métricas
   */
  calculateLeadScore(data: LeadScoringData): { score: number; breakdown: LeadScoreBreakdown; category: string } {
    const websiteScore = this.calculateWebsiteScore(data.website);
    const ratingScore = this.calculateRatingScore(data.rating);
    const volumeScore = this.calculateVolumeScore(data.userRatingsTotal);
    const profileCompletenessScore = this.calculateProfileCompletenessScore(data);
    
    // Pesos para cada métrica (baseado na sua análise)
    const weights = {
      website: 0.25,      // 25% - Presença de site
      rating: 0.35,       // 35% - Qualidade das avaliações (mais importante)
      volume: 0.25,       // 25% - Volume de avaliações
      profile: 0.15       // 15% - Completude do perfil
    };
    
    const overallScore = Math.round(
      websiteScore * weights.website +
      ratingScore * weights.rating +
      volumeScore * weights.volume +
      profileCompletenessScore * weights.profile
    );
    
    const breakdown: LeadScoreBreakdown = {
      websiteScore,
      ratingScore,
      volumeScore,
      profileCompletenessScore,
      overallScore,
      reasoning: this.generateReasoning(data, websiteScore, ratingScore, volumeScore, profileCompletenessScore)
    };
    
    const category = this.categorizeLead(overallScore, data);
    
    return { score: overallScore, breakdown, category };
  }
  
  /**
   * Calcula o score do website (0-100)
   * Lead sem site = Score alto (oportunidade)
   * Lead com site antigo = Score médio-alto
   * Lead com site moderno = Score baixo
   */
  private calculateWebsiteScore(website?: string): number {
    if (!website) {
      return 90; // Sem site = alta oportunidade
    }
    
    // Análise básica do website
    const hasHttps = website.includes('https://');
    const hasWww = website.includes('www.');
    const isModernDomain = website.includes('.com.br') || website.includes('.com');
    
    let score = 60; // Base para sites existentes
    
    if (hasHttps) score += 10;
    if (hasWww) score += 5;
    if (isModernDomain) score += 5;
    
    // Se parece ser um site profissional, reduzir score (menos oportunidade)
    if (website.includes('wix') || website.includes('wordpress') || website.includes('shopify')) {
      score -= 20; // Sites em plataformas populares = menos oportunidade
    }
    
    return Math.min(100, Math.max(0, score));
  }
  
  /**
   * Calcula o score baseado na avaliação (0-100)
   * Notas altas = Score alto (empresa bem-sucedida)
   */
  private calculateRatingScore(rating?: number): number {
    if (!rating || rating === 0) {
      return 30; // Sem avaliações = score baixo
    }
    
    // Nota 4.5+ = Score máximo (100)
    // Nota 3.0 = Score mínimo (0)
    if (rating >= 4.5) return 100;
    if (rating <= 3.0) return 0;
    
    // Interpolação linear entre 3.0 e 4.5
    return Math.round(((rating - 3.0) / (4.5 - 3.0)) * 100);
  }
  
  /**
   * Calcula o score baseado no volume de avaliações (0-100)
   * Muitas avaliações = Score alto (empresa estabelecida)
   */
  private calculateVolumeScore(userRatingsTotal?: number): number {
    if (!userRatingsTotal || userRatingsTotal === 0) {
      return 20; // Sem avaliações = score baixo
    }
    
    // 50+ avaliações = Score máximo (100)
    // 5 avaliações = Score mínimo (0)
    if (userRatingsTotal >= 50) return 100;
    if (userRatingsTotal <= 5) return 0;
    
    // Interpolação linear entre 5 e 50
    return Math.round(((userRatingsTotal - 5) / (50 - 5)) * 100);
  }
  
  /**
   * Calcula o score baseado na completude do perfil (0-100)
   */
  private calculateProfileCompletenessScore(data: LeadScoringData): number {
    let score = 0;
    let totalFields = 4; // name, address, phone, website
    
    if (data.name && data.name.trim()) score += 25;
    if (data.address && data.address.trim()) score += 25;
    if (data.phone && data.phone.trim() && data.phone !== "Não informado") score += 25;
    if (data.website && data.website.trim()) score += 25;
    
    return score;
  }
  
  /**
   * Categoriza o lead baseado no score geral e características específicas
   */
  private categorizeLead(overallScore: number, data: LeadScoringData): string {
    // Lead "Quente" - Critérios específicos
    if (this.isHotLead(data, overallScore)) {
      return "Quente";
    }
    
    // Lead "Morno" - Score médio ou características intermediárias
    if (overallScore >= 60 || this.isWarmLead(data)) {
      return "Morno";
    }
    
    // Lead "Frio" - Score baixo
    return "Frio";
  }
  
  /**
   * Verifica se é um lead "Quente" baseado nos critérios específicos
   */
  private isHotLead(data: LeadScoringData, overallScore: number): boolean {
    // Critério principal: Muitas avaliações + boa nota + sem site
    if (data.userRatingsTotal && data.userRatingsTotal >= 30 &&
        data.rating && data.rating >= 4.5 &&
        !data.website) {
      return true;
    }
    
    // Critério secundário: Score muito alto (90+)
    if (overallScore >= 90) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Verifica se é um lead "Morno" baseado em características específicas
   */
  private isWarmLead(data: LeadScoringData): boolean {
    // Perfil bem preenchido mas sem site
    if (this.calculateProfileCompletenessScore(data) >= 75 && !data.website) {
      return true;
    }
    
    // Site existente mas pode precisar de upgrade
    if (data.website && this.calculateWebsiteScore(data.website) >= 60) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Gera explicação detalhada do score
   */
  private generateReasoning(
    data: LeadScoringData,
    websiteScore: number,
    ratingScore: number,
    volumeScore: number,
    profileScore: number
  ): string[] {
    const reasoning: string[] = [];
    
    // Website reasoning
    if (websiteScore >= 80) {
      reasoning.push("🎯 Alta oportunidade: Empresa sem presença digital");
    } else if (websiteScore >= 60) {
      reasoning.push("📱 Oportunidade média: Site pode precisar de upgrade");
    } else {
      reasoning.push("💻 Baixa oportunidade: Site já bem estabelecido");
    }
    
    // Rating reasoning
    if (ratingScore >= 80) {
      reasoning.push("⭐ Excelente reputação: Empresa bem-sucedida e confiável");
    } else if (ratingScore >= 50) {
      reasoning.push("👍 Boa reputação: Empresa com clientes satisfeitos");
    } else {
      reasoning.push("⚠️ Reputação baixa: Pode ter problemas de qualidade");
    }
    
    // Volume reasoning
    if (volumeScore >= 80) {
      reasoning.push("🔥 Muito estabelecida: Alto volume de clientes");
    } else if (volumeScore >= 50) {
      reasoning.push("📈 Estabelecida: Volume moderado de clientes");
    } else {
      reasoning.push("🌱 Em crescimento: Volume baixo de clientes");
    }
    
    // Profile reasoning
    if (profileScore >= 80) {
      reasoning.push("📋 Perfil completo: Empresa atenta aos detalhes");
    } else if (profileScore >= 50) {
      reasoning.push("📝 Perfil parcial: Algumas informações disponíveis");
    } else {
      reasoning.push("❓ Perfil incompleto: Poucas informações disponíveis");
    }
    
    return reasoning;
  }
  
  /**
   * Filtra leads baseado nos critérios de scoring
   */
  filterLeadsByScore(leads: any[], filters: {
    minRating?: number;
    minUserRatings?: number;
    hasWebsite?: boolean;
    leadCategory?: string;
    minLeadScore?: number;
  }): any[] {
    return leads.filter(lead => {
      // Filtro por rating mínimo
      if (filters.minRating && lead.rating < filters.minRating) {
        return false;
      }
      
      // Filtro por número mínimo de avaliações
      if (filters.minUserRatings && lead.userRatingsTotal < filters.minUserRatings) {
        return false;
      }
      
      // Filtro por presença de website
      if (filters.hasWebsite !== undefined) {
        const hasWebsite = !!lead.website;
        if (filters.hasWebsite !== hasWebsite) {
          return false;
        }
      }
      
      // Filtro por categoria de lead
      if (filters.leadCategory && lead.leadCategory !== filters.leadCategory) {
        return false;
      }
      
      // Filtro por score mínimo
      if (filters.minLeadScore && lead.leadScore < filters.minLeadScore) {
        return false;
      }
      
      return true;
    });
  }
}
