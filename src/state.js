import { intToColor, colorToInt } from './utils.js';

const {
  Schema,
  types: { ObjectType, ArrayType, IntType, SimpleFloatType, StringType },
} = MultibyteStream;

let currentStateStr = '';

const stateSchema = new Schema(
  ObjectType.getInstance({
    // force version to be first value in stream
    $version: new IntType(false, 4),
    items: new ArrayType(
      ObjectType.getInstance({
        type: new IntType(false, 2),
        startX: new IntType(false),
        startY: new IntType(false),
        x: new IntType(true),
        y: new IntType(true),
        angle: new SimpleFloatType(true, 3),
        color: new IntType(false),
        text: new StringType(),
      })
    ),
  })
);

/*
[
  {
    type, -- type of the shape
    startX, -- starting drawing position, X coord
    startY,  -- starting drawing position, Y coord
    x, -- finishing drawing position, X coord
    y, -- finishing drawing position, Y coord
    angle, -- maximum deviation angle from start > end vector.
              used to draw curves.
  }
]
*/
let state = [];

export const initState = () => {
  state = [];
};

export const getState = () => state;

export const getCurrentStateStr = () => currentStateStr;

export const addToState = (item) => {
  state.push({ ...item });
  currentStateStr = exportState();
};

export const exportState = () =>
  stateSchema.saveBase64From({
    $version: 0,
    items: state.map((item) => ({ ...item, color: colorToInt(item.color) })),
  });

export const importState = (base64String) => {
  const { items = [] } = base64String ? stateSchema.loadBase64To(base64String) || {} : {};
  state = items.map((item) => ({ ...item, color: intToColor(item.color) }));
  currentStateStr = base64String;
};

export const saveStateToURL = () => {
  console.log('SAVE!', currentStateStr);
  window.history.pushState(
    Date.now(),
    '',
    `${window.location.pathname}?a=${encodeURIComponent(currentStateStr)}`
  );
};

export const loadStateFromURL = () => {
  const stateStr = new URLSearchParams(window.location.search).get('a');

  if (stateStr === currentStateStr) {
    return;
  }

  importState(stateStr);
};
