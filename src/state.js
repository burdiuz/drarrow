const {
  Schema,
  types: { ObjectType, ArrayType, IntType, SimpleFloatType, StringType },
} = MultibyteStream;

let currentStateStr = '';

const stateSchema = new Schema(
  new ArrayType(
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
  )
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

export const addToState = (item) => {
  console.log('ADDED', item);
  state.push({ ...item });
};

export const exportState = () => stateSchema.saveBase64From(state);

export const importState = (base64String) => {
  state = stateSchema.loadBase64To(state) || [];
};
