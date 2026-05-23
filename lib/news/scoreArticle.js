import {
      POSITIVE_TERMS,
          NEGATIVE_TERMS,
              SOURCE_WEIGHTS
                } from './constants.js';
                  
                    export function scoreArticle(article, config) {
                      
                          const text =
                                `${article.title || ''} ${article.contentSnippet || ''}`.toLowerCase();
                                  
                                      let score = 0;
                                        
                                            // COUNTRY RELEVANCE
                                                if (
                                                      config.aliases.some(alias =>
                                                              text.includes(alias.toLowerCase())
                                                                    )
                                                                        ) {
                                                                              score += 8;
                                                                                  }
                                                                                    
                                                                                        // POSITIVE TERMS
                                                                                            POSITIVE_TERMS.forEach(term => {
                                                                                                  const regex = new RegExp(`\\b${term}\\b`, 'i');
                                                                                                    
                                                                                                          if (regex.test(text)) {
                                                                                                                  score += 3;
                                                                                                                        }
                                                                                                                            });
                                                                                                                              
                                                                                                                                  // NEGATIVE TERMS
                                                                                                                                      NEGATIVE_TERMS.forEach(term => {
                                                                                                                                            const regex = new RegExp(`\\b${term}\\b`, 'i');
                                                                                                                                              
                                                                                                                                                    if (regex.test(text)) {
                                                                                                                                                            score -= 6;
                                                                                                                                                                  }
                                                                                                                                                                      });
                                                                                                                                                                        
                                                                                                                                                                            // SOURCE CREDIBILITY
                                                                                                                                                                                try {
                                                                                                                                                                                      const url = new URL(article.link);
                                                                                                                                                                                        
                                                                                                                                                                                              const domain =
                                                                                                                                                                                                      url.hostname.replace('www.', '');
                                                                                                                                                                                                        
                                                                                                                                                                                                              score += SOURCE_WEIGHTS[domain] || 0;
                                                                                                                                                                                                                
                                                                                                                                                                                                                    } catch {}
                                                                                                                                                                                                                      
                                                                                                                                                                                                                          // TEMPORAL DECAY
                                                                                                                                                                                                                              if (article.pubDate) {
                                                                                                                                                                                                                                
                                                                                                                                                                                                                                      const hoursOld =
                                                                                                                                                                                                                                              (Date.now() - new Date(article.pubDate))
                                                                                                                                                                                                                                                      / (1000 * 60 * 60);
                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                              score -= Math.min(hoursOld * 0.5, 5);
                                                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                        return score;
                                                                                                                                                                                                                                                                          
}