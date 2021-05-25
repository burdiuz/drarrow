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
state = [
  {
    type: 1,
    startX: 120,
    startY: 118,
    angle: 0.6717954426417881,
    x: 415,
    y: 330,
    color: '#6cc15a',
    text: ' Hello World!\nSecond line\nthird line\nfourth line',
  },
  {
    type: 0,
    startX: 786,
    startY: 345,
    angle: 0.853091186091417,
    x: -237,
    y: -30,
    color: '#ff8feb',
    text: '',
  },
  {
    type: 0,
    startX: 153,
    startY: 453,
    angle: 0.1317622664779265,
    x: 368,
    y: 333,
    color: '#48bfea',
    text: '',
  },
  {
    type: 0,
    startX: 443,
    startY: 793,
    angle: 0.005836509601319674,
    x: -154,
    y: -332,
    color: '#db6161',
    text: '',
  },
  {
    type: 1,
    startX: 502,
    startY: 800,
    angle: 0.28872952851239736,
    x: 505,
    y: 150,
    color: '#ff50c9',
    text: '',
  },
  {
    type: 1,
    startX: 771,
    startY: 465,
    angle: 0.6307377174012572,
    x: 367,
    y: 268,
    color: '#5d7a8a',
    text: '',
  },
];

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
