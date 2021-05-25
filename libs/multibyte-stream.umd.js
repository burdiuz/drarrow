(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = global || self, factory(global.MultibyteStream = {}));
}(this, (function (exports) { 'use strict';

    const MASK_MAX_INDEX = 32;
    const MASKS = ((index) => {
        const list = [0];
        while (index > 0) {
            list[index] = Math.pow(2, index) - 1;
            index--;
        }
        return list;
    })(MASK_MAX_INDEX);
    const getMaskOfLength = (length) => MASKS[length];

    const setDataSourceLength = (source, length) => {
        if (length < source.length) {
            return source.slice(0, length);
        }
        const { constructor: ArrayDef } = Object.getPrototypeOf(source);
        const values = new ArrayDef(length);
        values.set(source);
        return values;
    };
    class DataSource {
        constructor(source = new Uint8Array(0xff)) {
            this.position = 0;
            this.source = source;
        }
        getPosition() {
            return this.position;
        }
        setPosition(value) {
            this.position = value;
        }
        getFrameSize() {
            return this.source.BYTES_PER_ELEMENT << 3;
        }
        getCurrentFrame() {
            return this.getFrame(this.position);
        }
        setCurrentFrame(value) {
            this.setFrame(value, this.position);
        }
        nextFrame() {
            this.setPosition(this.isLastFrame() ? 0 : this.position + 1);
        }
        previousFrame() {
            this.setPosition(this.position > 0 ? this.position - 1 : 0);
        }
        isLastFrame() {
            return this.position === this.source.length - 1;
        }
        getFrame(index) {
            return this.source[index];
        }
        setFrame(value, index) {
            this.source[index] = value;
        }
        getLength() {
            return this.source.length;
        }
        setLength(length) {
            this.source = setDataSourceLength(this.source, length);
        }
        getSource() {
            return this.source;
        }
        toString(start = 0, length = this.source.length - start) {
            let str = '';
            for (let index = 0; index < length; index++) {
                const item = this.source[index] >>> 0;
                const frame = item.toString(2).padStart(this.getFrameSize(), '0');
                str = `${str} ${frame}`;
            }
            return str.trim();
        }
    }
    class DynamicDataSource extends DataSource {
        constructor(source) {
            super(source);
            this.validateLength();
        }
        setPosition(value) {
            super.setPosition(value);
            this.validateLength();
        }
        validateLength() {
            const { position, source: { length }, } = this;
            if (position >= length - 1) {
                this.setLength(Math.ceil(Math.max(length, position, 1) << 1));
            }
        }
    }

    var Endian;
    (function (Endian) {
        Endian[Endian["BIG"] = 1] = "BIG";
        Endian[Endian["LITTLE"] = 0] = "LITTLE";
    })(Endian || (Endian = {}));

    class BaseBitRW {
        constructor() {
            this.endian = Endian.BIG;
            this.framePosition = 0;
        }
        getData() {
            return this.source.getSource();
        }
        setData(data) {
            this.source = new DataSource(data || undefined);
        }
        getSource() {
            return this.source;
        }
        setSource(source) {
            this.source = source;
        }
        getBitOrder() {
            return this.endian;
        }
        setBitOrder(value) {
            this.endian = value;
        }
        getPosition() {
            return this.source.getPosition() * this.getFrameSize() + this.framePosition;
        }
        setPosition(value) {
            const frameSize = this.getFrameSize();
            this.source.setPosition((value / frameSize) | 0);
            this.framePosition = value % frameSize;
        }
        getBytePosition() {
            const frameSize = this.getFrameSize();
            return (this.source.getPosition() * (frameSize / 8) +
                Math.ceil(this.framePosition / 8));
        }
        getFrameSize() {
            return this.source.getFrameSize();
        }
    }

    const reverseBitOrder = (value, length) => {
        let pos = 0;
        let result = 0;
        while (pos < length) {
            result = ((result << 1) | ((value >> pos++) & 1)) >>> 0;
        }
        return result;
    };

    class BitReader extends BaseBitRW {
        setData(data) {
            this.source = new DataSource(data);
        }
        setSource(source) {
            this.source = source;
        }
        read(size) {
            const frameSize = this.getFrameSize();
            let value = 0;
            let leftSize = size;
            let leftSpace = frameSize - this.framePosition;
            while (leftSize > 0) {
                let shiftSize = leftSize;
                if (shiftSize > leftSpace) {
                    shiftSize = leftSpace;
                }
                let currentFrame = this.source.getCurrentFrame();
                value =
                    (value << shiftSize) |
                        ((currentFrame >> (leftSpace - shiftSize)) &
                            getMaskOfLength(shiftSize));
                leftSpace -= shiftSize;
                leftSize -= shiftSize;
                if (!leftSpace) {
                    this.source.nextFrame();
                    leftSpace = frameSize;
                }
            }
            if (this.endian === Endian.LITTLE) {
                value = reverseBitOrder(value, size);
            }
            this.framePosition = frameSize - leftSpace;
            return value;
        }
        readBit() {
            return this.read(1);
        }
        readUByte() {
            return this.read(8);
        }
        readUShort() {
            return this.read(16);
        }
        readUInt() {
            return this.read(32);
        }
    }

    const getSliceOf = (value, position, size) => (value >> position) & getMaskOfLength(size);

    const createWritableSource = (data) => new DynamicDataSource(data || new Uint8Array(0xff));
    class BitWriter extends BaseBitRW {
        setData(data) {
            this.source = new DynamicDataSource(data || undefined);
        }
        setSource(source) {
            this.source = source;
        }
        write(data, size, position = 0) {
            const frameSize = this.getFrameSize();
            let value = getSliceOf(data, position, size);
            if (this.endian === Endian.LITTLE) {
                value = reverseBitOrder(value, size);
            }
            let leftValue = value;
            let leftSize = size;
            let leftSpace = frameSize - this.framePosition;
            while (leftSize > 0) {
                let currentValue = leftValue;
                let currentSize = leftSize;
                if (leftSize > leftSpace) {
                    currentSize = leftSpace;
                    currentValue = currentValue >>> (leftSize - currentSize);
                }
                let currentFrame = this.source.getCurrentFrame();
                currentFrame = currentFrame | (currentValue << (leftSpace - currentSize));
                this.source.setCurrentFrame(currentFrame);
                leftSpace -= currentSize;
                leftSize -= currentSize;
                leftValue = leftValue & getMaskOfLength(leftSize);
                if (!leftSpace) {
                    this.source.nextFrame();
                    leftSpace = frameSize;
                }
            }
            this.framePosition = frameSize - leftSpace;
        }
        writeData(source, bitStart = 0, bitLength = source.length * (source.BYTES_PER_ELEMENT << 3) -
            bitStart) {
            const srcFrameSize = source.BYTES_PER_ELEMENT << 3;
            const start = (bitStart / srcFrameSize) | 0;
            let leftLength = bitLength;
            let index = start;
            while (leftLength > 0) {
                let size = srcFrameSize;
                let value = source[index];
                if (index === start) {
                    size = srcFrameSize - (bitStart % srcFrameSize);
                    value = value & getMaskOfLength(size);
                }
                if (leftLength < size) {
                    value = (value >> (size - leftLength)) & getMaskOfLength(leftLength);
                    size = leftLength;
                }
                this.write(value, size);
                leftLength -= size;
                index++;
            }
        }
        writeBit(value) {
            return this.write(value | 0, 1);
        }
        writeUByte(value) {
            return this.write(value | 0, 8);
        }
        writeUShort(value) {
            return this.write(value | 0, 16);
        }
        writeUInt(value) {
            return this.write(value | 0, 32);
        }
    }
    const copyWriterConfig = (writer) => {
        const copy = new BitWriter();
        const { constructor: TypedArrayDef } = Object.getPrototypeOf(writer.getData());
        copy.setBitOrder(writer.getBitOrder());
        copy.setData(new TypedArrayDef(0xff));
        return copy;
    };

    class BitStream {
        constructor(data) {
            this.writer = new BitWriter();
            this.reader = new BitReader();
            this.setData(data);
        }
        getData() {
            return this.reader.getData();
        }
        setData(data) {
            this.writer.setData(data);
            this.reader.setSource(this.writer.getSource());
        }
        getSource() {
            return this.reader.getSource();
        }
        setSource(source) {
            this.writer.setSource(source);
            this.reader.setSource(this.writer.getSource());
        }
        getBitOrder() {
            return this.reader.getBitOrder();
        }
        setBitOrder(value) {
            this.writer.setBitOrder(value);
            this.reader.setBitOrder(value);
        }
        getPosition() {
            return this.reader.getPosition();
        }
        setPosition(value) {
            this.writer.setPosition(value);
            this.reader.setPosition(value);
        }
        getBytePosition() {
            return this.reader.getBytePosition();
        }
        getFrameSize() {
            return this.reader.getFrameSize();
        }
        write(value, bitCount) {
            this.writer.write(value, bitCount);
            this.reader.setPosition(this.writer.getPosition());
        }
        writeData(value, bitStart, bitCount) {
            this.writer.writeData(value, bitStart, bitCount);
            this.reader.setPosition(this.writer.getPosition());
        }
        read(bitCount) {
            const value = this.reader.read(bitCount);
            this.writer.setPosition(this.reader.getPosition());
            return value;
        }
    }

    /**
     * Get bit count for value. Any value will have at least 1 bit length. Negative value gets +1 for sign.
     * @param Value to be calculated.
     * @param Include a sign bit into calculation
     */
    const getBitCount = (value) => {
        if (!value) {
            return 1;
        }
        if (value < 0) {
            value = -value;
        }
        return Math.ceil(Math.log2(value)) + 1;
    };
    const getBigIntBitCount = (value) => {
        if (!value) {
            return 1;
        }
        if (value < 0) {
            value = -value;
        }
        let bits = 0;
        while (value > 0) {
            bits++;
            value = value >> 1n;
        }
        return bits;
    };

    /*
    Currently BigInt is limited to 128 bits, but BigInts could be of any size, 256, 512.
    TODO Make most significant bit to signal about normal or extended mode.
         normal mode -- 128 bit
         extended bit -- 1024 bit

    BigInt is recorded using one's complement.
    */
    class BigIntType {
        writeTo(writer, value) {
            const size = getBigIntBitCount(value) + 1;
            const length = Math.ceil(size / 8 || 1) - 1;
            const negative = value < 0n;
            writer.write(length, 4);
            if (negative) {
                value = -value;
            }
            for (let index = 0; index <= length; index++) {
                const part = Number((value >> BigInt((length - index) << 3)) & 255n);
                writer.write(!index && negative ? part | (1 << 7) : part, 8);
            }
        }
        readFrom(reader) {
            const length = reader.read(4);
            let chunk = reader.read(8);
            let value = BigInt(chunk & 0b1111111);
            const negative = !!(chunk >> 7);
            for (let index = 1; index <= length; index++) {
                value = (value << 8n) | BigInt(reader.read(8));
            }
            return negative ? -value : value;
        }
        toObject() {
            return { type: BigIntType.type };
        }
        static getInstance() {
            return new BigIntType();
        }
        static getTypeKeys() {
            return [BigIntType.type, BigInt, BigIntType];
        }
        static fromObject() {
            return new BigIntType();
        }
    }
    BigIntType.type = 'bigint';

    const readLength = (reader, blocks, multiplierShift = 2) => {
        const length = (reader.read(blocks) + 1) << multiplierShift;
        return reader.read(length);
    };
    const writeLength = (writer, value, blocks, multiplierShift = 2) => {
        const length = getBitCount(value) >> multiplierShift;
        writer.write(length, blocks);
        writer.write(value, (length + 1) << multiplierShift);
    };
    const readShortLength = (reader) => readLength(reader, 2);
    const writeShortLength = (writer, value) => writeLength(writer, value, 2);

    /*
    Ideas for other string writing implementations

    static length:
    2 bits -- size of length block
    8 - 16 bits -- length of the value
    0 - ... -- value, max supported length is 65535 bytes
    */
    /*
    For variable length string it should be separated in groups:
    0 group -- 0 - 127
    1 group -- 127 - ...
    2 bits -- size of length block
    4 - 16 bits -- length of the string value

    cycle:
      1 bit -- group

      2 bits -- length of group offset(4, 8, 12, 16 bits)
      4 - 16 bits -- group offset
      2 bits -- length of char size(4, 8, 12, 16 bits)
      4 - 16 bits -- char size


      2 bits -- size of length block
      4 - 16 bits -- length of the group
    */
    /*
      Saves characters as sequence of 7 bit values. most significant bit, when set,
      tells that new character starts.
    */
    class StringType {
        writeTo(writer, value) {
            const chars = copyWriterConfig(writer);
            const { length } = value;
            for (let index = 0; index < length; index++) {
                let char = value.charCodeAt(index);
                let first = true;
                while (char) {
                    const part = char & 0b1111111;
                    chars.write(first ? 0b10000000 | part : part, 8);
                    char = char >> 7;
                    first = false;
                }
            }
            writeShortLength(writer, chars.getBytePosition());
            writer.writeData(chars.getData(), 0, chars.getPosition());
        }
        readFrom(reader) {
            let value = '';
            let charCode = 20;
            let partCount = 0;
            let length = readShortLength(reader);
            while (length) {
                const part = reader.read(8);
                if (part >> 7 === 1) {
                    value = `${value}${String.fromCharCode(charCode)}`;
                    charCode = part & 0b1111111;
                    partCount = 1;
                }
                else {
                    charCode = ((part & 0b1111111) << (7 * partCount)) | charCode;
                    partCount++;
                }
                length--;
            }
            // add last read char code and remove first space
            value = `${value.substr(1)}${String.fromCharCode(charCode)}`;
            return value;
        }
        toObject() {
            return { type: StringType.type };
        }
        static getTypeKeys() {
            return [StringType.type, String, StringType];
        }
        static getInstance() {
            return new StringType();
        }
        static fromObject() {
            return new StringType();
        }
    }
    StringType.type = 'string';

    const MAX_POW_INDEX = 31;
    const POWS = ((index) => {
        const list = [];
        while (index >= 0) {
            list[index] = (1 << index) >>> 0;
            index--;
        }
        return list;
    })(MAX_POW_INDEX);
    const getPositionBit = (index) => POWS[index];

    // https://en.wikipedia.org/wiki/Two%27s_complement#Converting_from_two's_complement_representation
    /*
      Returns uint with identical bit values to int in two's complement representation
    */
    const toTwosComplementRepresentation = (value, length) => (value >>> 0) & getMaskOfLength(length);
    /*
      Reads uint as int in two's complement representation
    */
    const fromTwosComplementRepresentation = (value, length) => {
        // checking for most negative number
        if (getPositionBit(length) === value) {
            return -value;
        }
        const valueLength = length - 1;
        const mask = getMaskOfLength(valueLength);
        const sign = (value >>> valueLength) & 0b1;
        if (sign) {
            return -(((value & mask) - 1) ^ mask);
        }
        return value & mask;
    };

    /*
      Returns uint with identical bit values.
    */
    const toOnesComplementRepresentation = (value, length) => {
        const valueLength = length - 1;
        const mask = getMaskOfLength(valueLength);
        if (value >= 0) {
            return value & mask;
        }
        return (-value & mask) | (1 << valueLength);
    };
    const fromOnesComplementRepresentation = (value, length) => {
        const valueLength = length - 1;
        const mask = getMaskOfLength(valueLength);
        const sign = (value >>> valueLength) & 0b1;
        if (sign) {
            return -(value & mask);
        }
        return value & mask;
    };

    const writeInteger = (writer, value, size, signed, twosc) => {
        if (!signed) {
            writer.write(value < 0 ? -value : value, size);
            return;
        }
        writer.write((twosc ? toTwosComplementRepresentation : toOnesComplementRepresentation)(value, size), size);
    };
    const writeVariableLengthInteger = (writer, value, signed, twosc) => {
        const size = getBitCount(value) + +signed;
        const length = Math.ceil(size / 4 || 1) - 1;
        writer.write(length, 3);
        writeInteger(writer, value, (length + 1) << 2, signed, twosc);
    };
    const readInteger = (reader, size, signed, twosc) => {
        const value = reader.read(size);
        if (!signed) {
            return value;
        }
        return (twosc
            ? fromTwosComplementRepresentation
            : fromOnesComplementRepresentation)(value, size);
    };
    const readVariableLengthInteger = (reader, signed, twosc) => {
        const size = (reader.read(3) + 1) << 2;
        return readInteger(reader, size, signed, twosc);
    };
    /*
    static length:
    1 bit -- sign
    1 - 31 bits value

    variable length:
    1 bit -- sign
    2 bits -- length
    7 - 31 bits -- value
    */
    class IntType {
        constructor(signed = true, size = 0) {
            this.useTwosComplement = true;
            this.signed = signed;
            this.size = size;
        }
        writeTo(writer, value) {
            if (this.size) {
                writeInteger(writer, value, this.size, this.signed, this.useTwosComplement);
            }
            else {
                writeVariableLengthInteger(writer, value, this.signed, this.useTwosComplement);
            }
        }
        readFrom(reader) {
            if (this.size) {
                return readInteger(reader, this.size, this.signed, this.useTwosComplement);
            }
            return readVariableLengthInteger(reader, this.signed, this.useTwosComplement);
        }
        toObject() {
            return {
                type: IntType.type,
                signed: this.signed,
                size: this.size,
                twosComplement: this.useTwosComplement,
            };
        }
        static getInstance(signed, size) {
            return new IntType(signed, size);
        }
        static getTypeKeys() {
            return [IntType.type, Number, IntType];
        }
        static fromObject(data) {
            const { signed = true, size = 0, twosComplement = true } = data;
            const instance = new IntType(signed, size);
            instance.useTwosComplement = twosComplement;
            return instance;
        }
    }
    IntType.type = 'int';
    class ShortType extends IntType {
        constructor() {
            super(true, 16);
        }
        toObject() {
            return { type: ShortType.type };
        }
        static getInstance() {
            return new ShortType();
        }
        static getTypeKeys() {
            return [ShortType.type, ShortType];
        }
        static fromObject() {
            return new ShortType();
        }
    }
    ShortType.type = 'short';
    class ByteType extends IntType {
        constructor() {
            super(true, 8);
        }
        toObject() {
            return { type: ByteType.type };
        }
        static getInstance() {
            return new ByteType();
        }
        static getTypeKeys() {
            return [ByteType.type, ByteType];
        }
        static fromObject() {
            return new ByteType();
        }
    }
    ByteType.type = 'byte';
    class UIntType extends IntType {
        constructor(size = 0) {
            super(false, size);
        }
        toObject() {
            return { type: UIntType.type };
        }
        static getInstance(size) {
            return new UIntType(size);
        }
        static getTypeKeys() {
            return [UIntType.type, UIntType];
        }
        static fromObject(data) {
            const { size = 0 } = data;
            const instance = new UIntType(size);
            return instance;
        }
    }
    UIntType.type = 'uint';
    class UShortType extends IntType {
        constructor() {
            super(false, 16);
        }
        toObject() {
            return { type: UShortType.type };
        }
        static getInstance() {
            return new UShortType();
        }
        static getTypeKeys() {
            return [UShortType.type, UShortType];
        }
        static fromObject(data) {
            return new UShortType();
        }
    }
    UShortType.type = 'ushort';
    class UByteType extends IntType {
        constructor() {
            super(false, 8);
        }
        toObject() {
            return { type: UByteType.type };
        }
        static getInstance() {
            return new UByteType();
        }
        static getTypeKeys() {
            return [UByteType.type, UByteType];
        }
        static fromObject() {
            return new UByteType();
        }
    }
    UByteType.type = 'ubyte';

    class SimpleFloatType extends IntType {
        constructor(signed = true, fractionDigits = 3, size = 0) {
            super(signed, size);
            this.fractionDigits = fractionDigits;
            this.multiplier = Math.pow(10, this.fractionDigits);
        }
        writeTo(writer, value) {
            super.writeTo(writer, (value * this.multiplier) | 0);
        }
        readFrom(reader) {
            const value = super.readFrom(reader);
            return value / this.multiplier;
        }
        toObject() {
            const { signed, fractionDigits, size } = this;
            return { type: SimpleFloatType.type, signed, fractionDigits, size };
        }
        static getInstance(signed, fractionDigits, size) {
            return new SimpleFloatType(signed, fractionDigits, size);
        }
        static getTypeKeys() {
            return [SimpleFloatType.type, SimpleFloatType];
        }
        static fromObject(data) {
            const { signed, fractionDigits, size } = data;
            const instance = new SimpleFloatType(signed, fractionDigits, size);
            return instance;
        }
    }
    SimpleFloatType.type = 'sfloat';

    class TypeRegistry {
        constructor() {
            this.map = new Map();
        }
        add(type) {
            const keys = type.getTypeKeys();
            keys.forEach((key) => this.addTypeFor(key, type));
        }
        addTypeFor(key, type) {
            this.map.set(key, type);
        }
        hasTypeFor(key) {
            return this.map.has(key);
        }
        getTypeFor(key) {
            return this.map.get(key);
        }
        fromObject(data) {
            const definition = this.getTypeFor(data.type);
            if (!definition) {
                throw new Error(`Data type "${data.type}" cannot be found`);
            }
            return definition.fromObject(data);
        }
    }
    const defaultTypeRegistry = new TypeRegistry();
    const addTypeDefinition = (...types) => types.map((type) => defaultTypeRegistry.add(type));
    const addTypeDefinitionFor = (key, type) => defaultTypeRegistry.addTypeFor(key, type);
    const hasTypeDefinitionFor = (key) => defaultTypeRegistry.hasTypeFor(key);
    const getTypeDefinitionFor = (key) => defaultTypeRegistry.getTypeFor(key);

    const readObjectFieldTypes = (data, registry = defaultTypeRegistry, target = {}) => {
        Object.keys(data).forEach((key) => {
            const value = data[key];
            if (value === null || value === undefined || key in target) {
                return;
            }
            const { constructor } = Object.getPrototypeOf(value);
            const type = registry.getTypeFor(constructor).getInstance();
            if (type) {
                target[key] = type;
            }
        });
        return target;
    };

    /*
    const stream = new BitStream();
    const obj = new ObjectType();
    const data = {
        bool: false,
        num: 777,
        big: 555555555555555555555555555555555n,
        arr: [1, 2, 3, 4, 5, 6, 7, 8, 9, 0],
        obj: {
            one: true,
            two: false,
            three: true,
            num: 8765,
        },
    };

    obj.writeTo(stream, data);
    stream.setPosition(0);
    console.log(obj.readFrom(stream));
    */
    class ObjectType {
        constructor(registry = defaultTypeRegistry) {
            this.registry = registry;
        }
        setSchemaFrom(obj) {
            this.setSchema(readObjectFieldTypes(obj, this.registry));
        }
        appendSchemaFrom(obj) {
            this.setSchema(readObjectFieldTypes(obj, this.registry, this.fields));
        }
        setSchema(fields) {
            this.fields = fields;
            this.fieldList = Object.keys(fields);
            this.fieldList.sort();
        }
        getSchema() {
            return this.fields;
        }
        writeTo(writer, obj) {
            if (!this.fields) {
                this.setSchemaFrom(obj);
            }
            const { fieldList: list, fields } = this;
            list.forEach((key) => {
                const type = fields[key];
                type.writeTo(writer, obj[key]);
            });
        }
        readFrom(reader) {
            if (!this.fields) {
                throw new Error('Object data could not be read since its schema is undefined.');
            }
            const { fieldList: list, fields } = this;
            const target = {};
            list.forEach((key) => {
                const type = fields[key];
                target[key] = type.readFrom(reader);
            });
            return target;
        }
        toObject() {
            const fields = {};
            Object.keys(this.fields).forEach((key) => {
                const type = this.fields[key];
                fields[key] = type.toObject();
            });
            return { type: ObjectType.type, fields };
        }
        static getInstanceFrom(obj, registry = defaultTypeRegistry) {
            const type = new ObjectType(registry);
            if (obj) {
                type.setSchemaFrom(obj);
            }
            return type;
        }
        static getInstance(schema, registry = defaultTypeRegistry) {
            const type = new ObjectType(registry);
            if (schema) {
                type.setSchema(schema);
            }
            return type;
        }
        static getTypeKeys() {
            return [ObjectType.type, Object, ObjectType];
        }
        static fromObject(data, registry = defaultTypeRegistry) {
            const { fields } = data;
            const instance = new ObjectType(registry);
            const schema = {};
            Object.keys(fields).forEach((key) => {
                const typeData = fields[key];
                schema[key] = registry.fromObject(typeData);
            });
            instance.setSchema(schema);
            return instance;
        }
    }
    ObjectType.type = 'object';

    /*
    3 bits -- size of length block
    4 - 16 bits -- array length
    ... -- array elements

    const stream = new BitStream();
    const arr = new ArrayType();

    arr.writeTo(stream, [77, 888, 9999, 10000, 76543, 2345678]);
    stream.setPosition(0);
    console.log(arr.readFrom(stream));
    console.log(stream.getSource().toString());
    */
    class ArrayType {
        constructor(elementType = IntType.getInstance(), registry = defaultTypeRegistry) {
            this.elementType = elementType;
            this.registry = registry;
        }
        writeTo(writer, value) {
            const { length } = value;
            writeShortLength(writer, length);
            for (let index = 0; index < length; index++) {
                this.elementType.writeTo(writer, value[index]);
            }
        }
        readFrom(reader) {
            const array = [];
            const length = readShortLength(reader);
            for (let index = 0; index < length; index++) {
                array.push(this.elementType.readFrom(reader));
            }
            return array;
        }
        toObject() {
            return {
                type: ArrayType.type,
                elementsOfType: this.elementType.toObject(),
            };
        }
        static getInstance(elementType, registry = defaultTypeRegistry) {
            return new ArrayType(elementType, registry);
        }
        static getTypeKeys() {
            return [ArrayType.type, Array, ArrayType];
        }
        static fromObject(data, registry = defaultTypeRegistry) {
            const { elementsOfType } = data;
            const instance = new ArrayType(registry.fromObject(elementsOfType), registry);
            return instance;
        }
    }
    ArrayType.type = 'array';

    /*
    1 bit -- value
    */
    class BoolType {
        writeTo(writer, value) {
            writer.write(value ? 1 : 0, 1);
        }
        readFrom(reader) {
            return reader.read(1) === 1;
        }
        toObject() {
            return { type: BoolType.type };
        }
        static getTypeKeys() {
            return [BoolType.type, Boolean, BoolType];
        }
        static getInstance() {
            return new BoolType();
        }
        static fromObject() {
            return new BoolType();
        }
    }
    BoolType.type = 'bool';

    /*
     Enumeration type receives an array of values and saves to stream an index of the value.
     To properly read/write values to stream, array must be the same at all times.
    */
    class EnumType {
        constructor(values = []) {
            this.values = values;
            this.size = getBitCount(this.values.length);
        }
        writeTo(writer, value) {
            const index = this.values.findIndex((item) => item === value);
            if (index < 0) {
                throw new Error(`Value "${value}" is not part of enumeration.`);
            }
            writer.write(index, this.size);
        }
        readFrom(reader) {
            return this.values[reader.read(this.size)];
        }
        toObject() {
            return { type: EnumType.type, values: this.values };
        }
        static getTypeKeys() {
            return [EnumType.type, EnumType];
        }
        static getInstance(values) {
            return new EnumType(values);
        }
        static fromObject({ values }) {
            return new EnumType(values);
        }
    }
    EnumType.type = 'enum';

    addTypeDefinition(BoolType);
    addTypeDefinition(IntType, ShortType, ByteType, UIntType, UShortType, UByteType);
    addTypeDefinition(SimpleFloatType);
    addTypeDefinition(BigIntType);
    addTypeDefinition(StringType);
    addTypeDefinition(ObjectType);
    addTypeDefinition(ArrayType);
    const types = {
        BigIntType,
        StringType,
        IntType,
        ShortType,
        ByteType,
        UIntType,
        UShortType,
        UByteType,
        SimpleFloatType,
        EnumType,
        ObjectType,
        ArrayType,
        BoolType,
    };

    const readSchemaFrom = (value, registry = defaultTypeRegistry) => {
        const obj = new ObjectType(registry);
        obj.setSchemaFrom(value);
        return new Schema(obj);
    };
    /*
    const data = {
      bool: false,
      num: 777,
      big: 555555555555555555555555555555555n,
      arr: [1, 2, 3, 4, 5, 6, 7, 8, 9, 0],
      obj: {
        one: true,
        two: false,
        three: true,
        num: 8765,
      },
    };

    const schema: Schema = readSchemaFrom(data);
    console.log(schema.saveBase64From(data));
    console.log(schema.toObject());
    */
    class Schema {
        constructor(obj) {
            this.type = obj;
        }
        loadDataTo(value, target) {
            const stream = new BitStream(value);
            const values = this.type.readFrom(stream);
            return target ? Object.assign(target, values) : values;
        }
        saveDataFrom(source) {
            const stream = new BitStream();
            this.type.writeTo(stream, source);
            const data = stream.getData();
            return setDataSourceLength(data, Math.ceil(stream.getBytePosition() / data.BYTES_PER_ELEMENT));
        }
        loadBase64To(str, target) {
            const data = Uint8Array.from(atob(str)
                .split('')
                .map((char) => char.charCodeAt(0)));
            return this.loadDataTo(data, target);
        }
        saveBase64From(source) {
            const data = this.saveDataFrom(source);
            return btoa(String.fromCharCode(...data));
        }
        toObject() {
            return this.type.toObject();
        }
        static fromObject(data, registry = defaultTypeRegistry) {
            return new Schema(ObjectType.fromObject(data, registry));
        }
    }

    exports.BitReader = BitReader;
    exports.BitStream = BitStream;
    exports.BitWriter = BitWriter;
    exports.Schema = Schema;
    exports.TypeRegistry = TypeRegistry;
    exports.addTypeDefinition = addTypeDefinition;
    exports.addTypeDefinitionFor = addTypeDefinitionFor;
    exports.copyWriterConfig = copyWriterConfig;
    exports.createWritableSource = createWritableSource;
    exports.defaultTypeRegistry = defaultTypeRegistry;
    exports.getTypeDefinitionFor = getTypeDefinitionFor;
    exports.hasTypeDefinitionFor = hasTypeDefinitionFor;
    exports.readSchemaFrom = readSchemaFrom;
    exports.types = types;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
