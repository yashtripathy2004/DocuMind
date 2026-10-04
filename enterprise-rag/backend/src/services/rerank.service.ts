import { SearchResult } from '../types/index.js';

export class RerankService {
  /**
   * Reciprocal Rank Fusion (RRF)
   * Score = SUM( 1 / (k + rank_i) )
   * where k = 60 (standard constant preventing top rank bias)
   */
  public static reciprocalRankFusion(
    denseResults: SearchResult[],
    sparseResults: SearchResult[],
    k = 60
  ): SearchResult[] {
    const scoreMap = new Map<string, { result: SearchResult; score: number }>();

    // Process dense ranks
    denseResults.forEach((item, index) => {
      const rank = index + 1;
      const rrfContribution = 1 / (k + rank);
      if (!scoreMap.has(item.id)) {
        scoreMap.set(item.id, { result: item, score: rrfContribution });
      } else {
        scoreMap.get(item.id)!.score += rrfContribution;
      }
    });

    // Process sparse ranks
    sparseResults.forEach((item, index) => {
      const rank = index + 1;
      const rrfContribution = 1 / (k + rank);
      if (!scoreMap.has(item.id)) {
        scoreMap.set(item.id, { result: item, score: rrfContribution });
      } else {
        scoreMap.get(item.id)!.score += rrfContribution;
      }
    });

    // Sort by aggregated RRF score descending
    const fused = Array.from(scoreMap.values())
      .map(({ result, score }) => ({
        ...result,
        score,
      }))
      .sort((a, b) => b.score - a.score);

    return fused;
  }
}
