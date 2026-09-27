import bookcase from './bookcase.glb?url';
import floorLamp from './floor-lamp.glb?url';
import headphones from './headphones.glb?url';
import microwave from './microwave.glb?url';
import officeChair from './office-chair.glb?url';
import phone from './phone.glb?url';
import posMachine from './pos-machine.glb?url';
import refrigerator from './refrigerator.glb?url';
import shoppingCart from './shopping-cart.glb?url';
import sofa from './sofa.glb?url';
import speaker from './speaker.glb?url';
import stove from './stove.glb?url';
import table from './table.glb?url';
import television from './television.glb?url';

export const MODEL_URLS = {
  bookcase,
  floorLamp,
  headphones,
  microwave,
  officeChair,
  phone,
  posMachine,
  refrigerator,
  shoppingCart,
  sofa,
  speaker,
  stove,
  table,
  television,
} as const;

export type ModelKey = keyof typeof MODEL_URLS;

export const MODEL_KEYS = Object.keys(MODEL_URLS) as ModelKey[];

