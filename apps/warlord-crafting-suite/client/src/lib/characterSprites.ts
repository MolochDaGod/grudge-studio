export interface CharacterSpriteSheet {
  grudgeUuid: string;
  character: string;
  animation: 'walk' | 'fall' | 'spell' | 'attack' | 'idle';
  spritePath: string;
  frameWidth: number;
  frameHeight: number;
  framesPerRow: number;
  totalFrames: number;
  directions: number;
  fps: number;
}

export interface CharacterSprite {
  id: string;
  name: string;
  animations: Record<string, CharacterSpriteSheet>;
}

export const CHARACTER_SPRITES: Record<string, CharacterSprite> = {
  baldric: {
    id: 'baldric',
    name: 'Baldric',
    animations: {
      walk: {
        grudgeUuid: 'CHAR-T0-BALD-WALK-001',
        character: 'Baldric',
        animation: 'walk',
        spritePath: '/2dassets/sprites/characters/baldric/walk.png',
        frameWidth: 64,
        frameHeight: 64,
        framesPerRow: 6,
        totalFrames: 36,
        directions: 4,
        fps: 8
      },
      fall: {
        grudgeUuid: 'CHAR-T0-BALD-FALL-002',
        character: 'Baldric',
        animation: 'fall',
        spritePath: '/2dassets/sprites/characters/baldric/fall.png',
        frameWidth: 64,
        frameHeight: 64,
        framesPerRow: 6,
        totalFrames: 6,
        directions: 1,
        fps: 10
      },
      spell: {
        grudgeUuid: 'CHAR-T0-BALD-SPELL-003',
        character: 'Baldric',
        animation: 'spell',
        spritePath: '/2dassets/sprites/characters/baldric/spell.png',
        frameWidth: 64,
        frameHeight: 64,
        framesPerRow: 6,
        totalFrames: 30,
        directions: 4,
        fps: 10
      }
    }
  },
  mage: {
    id: 'mage',
    name: 'Mage',
    animations: {
      walk: {
        grudgeUuid: 'CHAR-T0-MAGE-WALK-004',
        character: 'Mage',
        animation: 'walk',
        spritePath: '/2dassets/sprites/characters/mage/walk.png',
        frameWidth: 64,
        frameHeight: 64,
        framesPerRow: 8,
        totalFrames: 56,
        directions: 4,
        fps: 8
      },
      fall: {
        grudgeUuid: 'CHAR-T0-MAGE-FALL-005',
        character: 'Mage',
        animation: 'fall',
        spritePath: '/2dassets/sprites/characters/mage/fall.png',
        frameWidth: 64,
        frameHeight: 64,
        framesPerRow: 6,
        totalFrames: 6,
        directions: 1,
        fps: 10
      },
      spell: {
        grudgeUuid: 'CHAR-T0-MAGE-SPELL-006',
        character: 'Mage',
        animation: 'spell',
        spritePath: '/2dassets/sprites/characters/mage/spell.png',
        frameWidth: 64,
        frameHeight: 64,
        framesPerRow: 8,
        totalFrames: 48,
        directions: 4,
        fps: 10
      }
    }
  }
};

export function getCharacterSprite(characterId: string): CharacterSprite | undefined {
  return CHARACTER_SPRITES[characterId.toLowerCase()];
}

export function getAnimationSheet(characterId: string, animation: string): CharacterSpriteSheet | undefined {
  const character = getCharacterSprite(characterId);
  return character?.animations[animation];
}

export function getAllCharacters(): CharacterSprite[] {
  return Object.values(CHARACTER_SPRITES);
}

export function generateGrudgeUuid(slot: string, tier: number, itemId: string, counter: number): string {
  const timestamp = Math.floor(Date.now() / 1000).toString(36).toUpperCase();
  const counterStr = counter.toString(36).toUpperCase().padStart(3, '0');
  return `${slot}-T${tier}-${itemId}-${timestamp}-${counterStr}`;
}
