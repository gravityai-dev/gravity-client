/**
 * Cards Handler
 * Manages card accumulation, deduplication, and sorting
 */

export interface Card {
  index?: string;
  [key: string]: any;
}

export class CardsHandler {
  private cards: Card[] = [];
  private processedIds = new Set<string>();

  /**
   * Add cards to the collection
   * @param newCards - Single card or array of cards
   */
  addCards(newCards: Card | Card[]) {
    const cardsToAdd = Array.isArray(newCards) ? newCards : [newCards];
    
    // Add each card, avoiding duplicates if they have an id
    cardsToAdd.forEach(card => {
      if (card.id && this.processedIds.has(card.id)) {
        // Skip duplicate
        return;
      }
      
      if (card.id) {
        this.processedIds.add(card.id);
      }
      
      this.cards.push(card);
    });
    
    // Sort if indices are available
    this.sortCards();
  }

  /**
   * Sort cards by index if available
   */
  private sortCards() {
    // Check if any card has an index
    const hasIndex = this.cards.some(card => card.index !== undefined);
    
    if (hasIndex) {
      this.cards.sort((a, b) => {
        // Parse indices, defaulting to high number if missing
        const indexA = a.index ? parseInt(a.index, 10) : 999;
        const indexB = b.index ? parseInt(b.index, 10) : 999;
        
        // If indices are equal or both missing, maintain insertion order
        if (indexA === indexB) {
          return 0;
        }
        
        return indexA - indexB;
      });
    }
    // If no indices, maintain insertion order
  }

  /**
   * Get all cards
   */
  getCards(): Card[] {
    return [...this.cards];
  }

  /**
   * Clear all cards
   */
  clear() {
    this.cards = [];
    this.processedIds.clear();
  }

  /**
   * Get card count
   */
  count(): number {
    return this.cards.length;
  }
}

// Factory function to create card handlers per conversation
const cardHandlers = new Map<string, CardsHandler>();

export function getOrCreateCardsHandler(conversationId: string, chatId: string): CardsHandler {
  const key = `${conversationId}-${chatId}`;
  
  if (!cardHandlers.has(key)) {
    cardHandlers.set(key, new CardsHandler());
  }
  
  return cardHandlers.get(key)!;
}

export function clearCardsHandler(conversationId: string, chatId: string) {
  const key = `${conversationId}-${chatId}`;
  const handler = cardHandlers.get(key);
  
  if (handler) {
    handler.clear();
    cardHandlers.delete(key);
  }
}

export function clearAllCardHandlers() {
  cardHandlers.forEach(handler => handler.clear());
  cardHandlers.clear();
}
