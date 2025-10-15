# Principality AI - Game Design Document

## Project Overview

**Principality AI** is a solo-first deck-building game inspired by Dominion, designed for streamlined gameplay and AI integration through a phased development approach.

## Phase 1: Minimum Viable Product (Solo Sandbox)

### Core Game Loop

**Turn Structure**
- **Action Phase**: Play action cards from hand (default: 1 action)
- **Buy Phase**: Play all treasures, purchase cards (default: 1 buy)
- **Cleanup Phase**: Discard everything, draw 5 cards

**Starting Conditions**
- 7 Copper cards
- 3 Estate cards
- Shuffle to form starting deck

### Card Types

**Basic Treasures** (Always Available)
- **Copper**: +$1
- **Silver**: +$2 (Cost: $3)
- **Gold**: +$3 (Cost: $6)

**Victory Cards** (Always Available)
- **Estate**: 1 VP (Cost: $2)
- **Duchy**: 3 VP (Cost: $5)
- **Province**: 6 VP (Cost: $8)

### Kingdom Cards (MVP Set - 8 Simple Cards)

*Simplified action cards focusing on basic +Cards/+Actions/+$/+Buys*

**Draw Cards**
- **Village**: +1 Card, +2 Actions (Cost: $3)
- **Smithy**: +3 Cards (Cost: $4)
- **Laboratory**: +2 Cards, +1 Action (Cost: $5)

**Economy Cards**
- **Market**: +1 Card, +1 Action, +$1, +1 Buy (Cost: $5)
- **Woodcutter**: +$2, +1 Buy (Cost: $3)
- **Festival**: +2 Actions, +$2, +1 Buy (Cost: $5)

**Simple Utility**
- **Council Room**: +4 Cards, +1 Buy (Cost: $5)
- **Cellar**: +1 Action, Discard any number of cards, then draw that many (Cost: $2)

### Game Setup

**Randomization**
- Random seed input during setup
- Determines shuffle order for initial decks
- All 8 kingdom cards always available (no kingdom randomization yet)

### Victory Conditions

**Sandbox Mode**
- No explicit goals or time limits
- Score tracking for debugging and optimization
- Game ends when:
  - Province pile empty
  - Any 3 piles empty
- Turn counter and final score displayed

**Metrics Tracked**
- Total turns taken
- Final victory points
- Cards purchased by type
- Average coins per turn (for debugging)

## Phase 2: MCP (Model Context Protocol) Integration

### AI Play Mode

**Objective**
- LLM-based AI plays solo game
- Goal: Finish game in minimum turns possible
- No interaction with human player in this phase

### Simplified MCP Interface

**Core Tools (Minimal Set)**

```
get_game_state()
Returns JSON containing:
- current_phase: "action" | "buy" | "cleanup"
- hand: [card_names]
- actions_remaining: number
- buys_remaining: number
- coins_available: number
- cards_in_play: [card_names]
- supply_piles: {pile_name: count}
- turn_number: number
- deck_size: number
- discard_size: number

make_move(move_description)
Accepts natural language or structured commands:
- "play Village"
- "buy Silver"
- "play all treasures"
- "end action phase"
- "end turn"
- For Cellar: "discard Copper, Estate" or "discard nothing"
```

**Error Handling**
- Invalid moves return error with explanation
- AI must retry with valid move
- System enforces all game rules

### AI Performance Metrics

- Turns to game completion
- Final score achieved
- Efficiency rating (score per turn)
- Decision time per move

## Phase 3: Multiplayer Expansion

### Core Multiplayer Features

**Game Modes**
- **Human vs Simple AI**: Human plays against rule-based AI opponent
- **LLM vs Simple AI**: MCP-based LLM plays against rule-based AI
- Future: Human vs LLM, Human vs Human

**Simple AI Opponent**
- Rule-based strategy (non-LLM)
- Follows basic Big Money strategy with simple adaptations
- Configurable difficulty levels
- Fast decision making (< 100ms per turn)

**Turn Management**
- Synchronous turns (players alternate)
- Time limits optional
- State synchronization between players

### New Card Categories (Phase 3+)

**Future Expansions**
- Attack cards (requires reaction system)
- Trashing cards (Chapel, Remodel)
- Gaining cards (Workshop)
- Duration cards
- Curse cards

## Development Priorities

### Phase 1 Success Criteria
- Complete game loop functional
- All 8 kingdom cards implemented correctly
- Random seed reproducible shuffling
- Game state serializable
- Clear UI for debugging game flow
- Metrics collection for analysis

### Phase 2 Success Criteria
- MCP interface fully functional
- LLM can complete games without errors
- Performance: AI completes game in < 5 minutes
- Move validation prevents illegal actions
- Game state perfectly observable through get_game_state()

### Phase 3 Success Criteria
- Stable 2-player games
- Simple AI provides reasonable challenge
- LLM vs Simple AI games complete successfully
- Turn synchronization works reliably
- Clear winner determination

## Technical Considerations

### Data Structures (Conceptual)

**Game State**
```
{
  players: [player_states],
  supply: {card_name: count},
  turn_number: number,
  current_player_index: number,
  current_phase: string,
  random_seed: string,
  game_log: [events]
}
```

**Player State**
```
{
  deck: [cards],
  hand: [cards],
  discard: [cards],
  play_area: [cards],
  actions: number,
  buys: number,
  coins: number
}
```

### Card Effect Resolution

**Simple Effect Types**
- `+X Cards`: Draw X cards
- `+X Actions`: Add X to action count
- `+X Buys`: Add X to buy count
- `+$X`: Add X to coin count
- `Discard then Draw`: Cellar-type effect

**Resolution Order**
1. Apply all +'s in card order
2. Handle special effects (like Cellar's discard/draw)
3. Check for phase transitions

### Performance Targets

- Card play resolution: < 10ms
- Shuffle operation: < 50ms
- Full game state serialization: < 100ms
- MCP tool response: < 200ms

## Risk Mitigation

### Complexity Management
- No complex card interactions initially
- Single effect per card (except Market)
- Clear phase boundaries
- Extensive logging for debugging
- Deterministic gameplay with seeded randomness

### Solo Developer Optimizations
- Start with console/text interface
- Add GUI only after core logic complete
- Reuse player logic for AI players
- Single game engine for all modes
- Modular card system for easy additions

## Phase 4: UI & Advanced Card Mechanics

### Web UI Implementation
- **Graphical Interface**: Replace CLI with visual card game
- **Card Animations**: Basic play/buy/discard animations
- **Drag and Drop**: Intuitive card interactions
- **Responsive Design**: Desktop and tablet support

### Advanced Card Types

**Trashing Cards**
- **Chapel**: Trash up to 4 cards from hand (Cost: $2)
- **Remodel**: Trash a card, gain a card costing up to $2 more (Cost: $4)

**Gaining Cards**
- **Workshop**: Gain a card costing up to $4 (Cost: $3)
- **Bureaucrat**: Gain a Silver to top of deck (Cost: $4)

**Attack Cards**
- **Militia**: Each other player discards down to 3 cards (Cost: $4)
- **Witch**: Each other player gains a Curse (Cost: $5)

**Reaction Cards**
- **Moat**: +2 Cards; Reaction: Reveals to block attacks (Cost: $2)

**Curse Cards**
- **Curse**: -1 VP (Cost: $0, only gained through attacks)

### Enhanced Game Features
- Kingdom randomization (select 10 from available pool)
- Card hover previews
- Game history log
- Statistics tracking

## Phase 5+: Future Roadmap

### Advanced Features
1. **Kingdom Variety**: 25+ unique kingdom cards
2. **Advanced AI**: Multiple LLM personalities and strategies
3. **Game Modes**: 
   - Tournaments with brackets
   - Campaign/story mode
   - Daily challenges
   - Puzzle scenarios
4. **Social Features**:
   - Friends list
   - Spectator mode
   - Replay sharing
5. **Platform Expansion**:
   - Mobile native apps
   - Steam release
   - Cross-platform play
6. **Monetization** (if applicable):
   - Cosmetic card backs/themes
   - Expansion packs
   - Season pass for challenges