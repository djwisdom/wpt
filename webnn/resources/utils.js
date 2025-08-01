'use strict';

const operatorToleranceDict = {
  argMax: {float32: 0, float16: 0},
  argMin: {float32: 0, float16: 0},
  batchNormalization: {float32: 6, float16: 6},
  clamp: {float32: 0, float16: 0},

  // Element-wise binary operations
  add: {float32: 1, float16: 1},
  sub: {
    float32: 1,
    float16: 1,
    int8: 0,
    uint8: 0,
    int32: 0,
    uint32: 0,
    int64: 0,
    uint64: 0
  },
  mul: {float32: 1, float16: 1},
  max: {float32: 0, float16: 0},
  min: {float32: 0, float16: 0},
  // Element-wise binary operations

  elu: {float32: 18, float16: 18},
  gelu: {float32: 18, float16: 18},
  hardSigmoid: {float32: 2, float16: 2},
  hardSwish: {float32: 4, float16: 4},
  leakyRelu: {float32: 1, float16: 2},
  linear: {float32: 2, float16: 2},
  prelu: {float32: 1, float16: 1},
  relu: {float32: 0, float16: 0, int8: 0, int32: 0},
  sigmoid: {float32: 34, float16: 10},
  softplus: {float32: 18, float16: 18},
  softsign: {float32: 3, float16: 3},
  tanh: {float32: 16, float16: 16},
};

const zeroULPToleranceOperatorList = [
  // data movement operators
  'concat', 'expand', 'gather', 'gatherElements', 'gatherND', 'identity', 'pad',
  'reshape', 'reverse', 'scatterElements', 'scatterND', 'slice', 'split',
  'tile', 'transpose',

  // element-wise logical operators
  'equal', 'notEqual', 'greater', 'greaterOrEqual', 'lesser', 'lesserOrEqual',
  'logicalNot', 'logicalAnd', 'logicalOr', 'logicalXor'
];

const getZeroULPTolerance = () => {
  return {metricType: 'ULP', value: 0};
};

const getSoftmaxPrecisionTolerance =
    (op, graphResources, intermediateOperands) => {
      const {inputs} = graphResources;
      const args = op.arguments;
      let inputShape;
      const inputIndex = args[0][Object.keys(args[0])[0]];
      if (inputs[inputIndex]) {
        inputShape = inputs[inputIndex].descriptor.shape;
      } else {
        inputShape = intermediateOperands[inputIndex].shape;
      }
      const axis = args.length === 2 ? args[1][Object.keys(args[1])[0]] : 1;
      const tolerance = inputShape[axis] * 3 + 3;
      const toleranceValueDict = {float32: tolerance, float16: tolerance};
      const expectedDataType =
          getExpectedDataTypeOfSingleOutput(graphResources.expectedOutputs);
      return {metricType: 'ULP', value: toleranceValueDict[expectedDataType]};
    };

const getPrecisionTolerance = (graphResources, intermediateOperands) => {
  const expectedDataType =
      getExpectedDataTypeOfSingleOutput(graphResources.expectedOutputs);
  let toleranceValue = 0;
  graphResources.operators.forEach(op => {
    switch (op.name) {
      case 'conv2d':
        toleranceValue += getConv2dPrecisionTolerance(op, graphResources,
            intermediateOperands).value;
        break;
      case 'convTranspose2d':
        toleranceValue += getConv2dPrecisionTolerance(op, graphResources,
            intermediateOperands).value;
        break;
      case 'gemm':
        toleranceValue += getGemmPrecisionTolerance(op, graphResources,
            intermediateOperands).value;
        break;
      case 'softmax':
        toleranceValue += getSoftmaxPrecisionTolerance(
                              op, graphResources, intermediateOperands)
                              .value;
        break;
      case 'averagePool2d':
      case 'maxPool2d':
      case 'l2Pool2d':
        toleranceValue += getPoolingOperatorsPrecisionTolerance(
                              op, graphResources, intermediateOperands)
                              .value;
        break;
      case 'reduceL1':
      case 'reduceL2':
      case 'reduceLogSum':
      case 'reduceLogSumExp':
      case 'reduceMax':
      case 'reduceMean':
      case 'reduceMin':
      case 'reduceProduct':
      case 'reduceSum':
      case 'reduceSumSquare':
        toleranceValue += getReductionOperatorsPrecisionTolerance(
                              op, graphResources, intermediateOperands)
                              .value;
        break;
      case 'resample2d':
        toleranceValue += getResample2dPrecisionTolerance(
                              op, graphResources, intermediateOperands)
                              .value;
        break;
      default:
        if (zeroULPToleranceOperatorList.includes(op.name)) {
          toleranceValue += getZeroULPTolerance().value;
        } else {
          const operatorTolerance =
              operatorToleranceDict[op.name]?.[expectedDataType];
          if (operatorTolerance !== undefined) {
            toleranceValue += operatorTolerance;
          }
        }
    }
  });
  return {metricType: 'ULP', value: toleranceValue};
};

// https://www.w3.org/TR/webnn/#enumdef-mloperanddatatype
const TypedArrayDict = {
  float32: Float32Array,

  // Proposal to add float16 TypedArrays to JavaScript.
  // URL: https://tc39.es/proposal-float16array/
  // Use workaround Uint16 for Float16
  float16: Uint16Array,

  int64: BigInt64Array,
  uint64: BigUint64Array,
  int32: Int32Array,
  uint32: Uint32Array,
  int8: Int8Array,
  uint8: Uint8Array,
  int4: Uint8Array,
  uint4: Uint8Array,
};

const kIntTypes =
    ['uint4', 'int4', 'uint8', 'int8', 'uint32', 'int32', 'uint64', 'int64'];
const kFloatTypes = ['float16', 'float32'];

const findCompatibleType = (dataType, supportedTypes, castOpSupportLimits) => {
  if (!castOpSupportLimits.input.dataTypes.includes(dataType)) {
    // Cannot cast from `dataType` to any other type.
    return null;
  }

  for (let supportedType of supportedTypes) {
    if (kIntTypes.includes(dataType) &&
        castOpSupportLimits.output.dataTypes.includes(dataType) &&
        kIntTypes.indexOf(supportedType) > kIntTypes.indexOf(dataType)) {
      return supportedType;
    }

    if (kFloatTypes.includes(dataType)) {
      if (kFloatTypes.indexOf(supportedType) > kFloatTypes.indexOf(dataType)) {
        return supportedType;
      }
    }
  }
  return null;
};

// The maximum index to validate for the output's expected value.
const kMaximumIndexToValidate = 1000;

const kContextOptionsForVariant = {
  cpu: {
    deviceType: 'cpu',
  },
  gpu: {
    deviceType: 'gpu',
  },
  npu: {
    deviceType: 'npu',
  },
};

const searchParams = new URLSearchParams(location.search);
const variant = searchParams.get('device') || location.search.substring(1);
const contextOptions = kContextOptionsForVariant[variant];

const tcNameArray = searchParams.getAll('tc');

function isTargetTest(test) {
  return tcNameArray.length === 0 || tcNameArray.includes(test.name);
}

const assertDescriptorsEquals = (outputOperand, expected) => {
  const dataType =
      expected.castedType ? expected.castedType : expected.dataType;
  assert_equals(
      outputOperand.dataType, dataType,
      'actual output dataType should be equal to expected output dataType');
  assert_array_equals(
      outputOperand.shape, expected.shape,
      'actual output shape should be equal to expected output shape');
};

// ref:
// http://stackoverflow.com/questions/32633585/how-do-you-convert-to-half-floats-in-javascript
const toHalf = (value) => {
  let floatView = new Float32Array(1);
  let int32View = new Int32Array(floatView.buffer);

  /* This method is faster than the OpenEXR implementation (very often
   * used, eg. in Ogre), with the additional benefit of rounding, inspired
   * by James Tursa's half-precision code. */

  floatView[0] = value;
  let x = int32View[0];

  let bits = (x >> 16) & 0x8000; /* Get the sign */
  let m = (x >> 12) & 0x07ff;    /* Keep one extra bit for rounding */
  let e = (x >> 23) & 0xff;      /* Using int is faster here */

  /* If zero, or denormal, or exponent underflows too much for a denormal
   * half, return signed zero. */
  if (e < 103) {
    return bits;
  }

  /* If NaN, return NaN. If Inf or exponent overflow, return Inf. */
  if (e > 142) {
    bits |= 0x7c00;
    /* If exponent was 0xff and one mantissa bit was set, it means NaN,
     * not Inf, so make sure we set one mantissa bit too. */
    bits |= ((e == 255) ? 0 : 1) && (x & 0x007fffff);
    return bits;
  }

  /* If exponent underflows but not too much, return a denormal */
  if (e < 113) {
    m |= 0x0800;
    /* Extra rounding may overflow and set mantissa to 0 and exponent
     * to 1, which is OK. */
    bits |= (m >> (114 - e)) + ((m >> (113 - e)) & 1);
    return bits;
  }

  bits |= ((e - 112) << 10) | (m >> 1);
  /* Extra rounding. An overflow will set mantissa to 0 and increment
   * the exponent, which is OK. */
  bits += m & 1;
  return bits;
};

const getTypedArrayData = (type, size, data) => {
  let outData;

  if (type === 'float16') {
    if (typeof (data) === 'number' && size > 1) {
      return new TypedArrayDict[type](size).fill(toHalf(data));
    }
    // workaround to convert Float16 to Uint16
    outData = new TypedArrayDict[type](data.length);
    for (let i = 0; i < data.length; i++) {
      outData[i] = toHalf(data[i]);
    }
  } else if (type === 'int64' || type === 'uint64') {
    if (typeof (data) === 'number' && size > 1) {
      return new TypedArrayDict[type](size).fill(BigInt(data));
    }
    outData = new TypedArrayDict[type](data.length);
    for (let i = 0; i < data.length; i++) {
      outData[i] = BigInt(data[i]);
    }
  } else if (type === 'uint4' || type === 'int4') {
    // The first nybble is stored in the first bits 0-3, and later bits 4-7
    // store the later nybble. The data is packed, without any padding between
    // dimensions. For example: an array of uint4:
    //   size = [2,5]
    //   values = [1,2,3,4,5,6,7,8,9,10]
    // Would yield 5 hex bytes:
    //   Uint8Array.of(0x21, 0x43, 0x65, 0x87, 0xA9);
    const array = new TypedArrayDict[type](Math.ceil(size / 2));
    let i = 0;
    while (i < size - 1) {
      const packedByte = ((data[i + 1] & 0xF) << 4) | (data[i] & 0xF);
      array[Math.floor(i / 2)] = packedByte;
      i = i + 2;
    }
    // Handle the odd size.
    if (i === size - 1) {
      const packedByte = data[i] & 0xF;
      array[Math.floor(i / 2)] = packedByte;
    }
    return array;
  } else {
    if (typeof (data) === 'number' && size > 1) {
      return new TypedArrayDict[type](size).fill(data);
    }
    outData = new TypedArrayDict[type](data);
  }
  return outData;
};

const sizeOfShape = (array) => {
  return array.reduce((accumulator, currentValue) => accumulator * currentValue, 1);
};

/**
 * Get bitwise of the given value.
 * @param {Number} value
 * @param {String} dataType - A data type string; currently only "float32" is
 *     supported by this function.
 * @return {BigInt} A 64-bit signed integer.
 */
const getBitwise = (value, dataType) => {
  const buffer = new ArrayBuffer(8);
  const int64Array = new BigInt64Array(buffer);
  let typedArray;
  if (dataType === "float32") {
    typedArray = new Float32Array(buffer);
  } else {
    throw new AssertionError(`Data type ${dataType} is not supported`);
  }
  typedArray[0] = Math.abs(value);
  const int64 = int64Array[0];
  return (value < 0) ? -int64 : int64;
};

/**
 * Assert that each array property in ``actual`` is a number being close enough
 * to the corresponding property in ``expected`` by the acceptable ULP distance
 * ``nulp`` with given ``dataType`` data type.
 *
 * @param {Array} actual - Array of test values.
 * @param {Array} expected - Array of values expected to be close to the values
 *     in ``actual``.
 * @param {(Number|BigInt)} nulp - A value indicates acceptable ULP distance.
 * @param {String} dataType - A data type string, value: "float32",
 *     more types, please see:
 *     https://www.w3.org/TR/webnn/#enumdef-mloperanddatatype
 * @param {String} description - Description of the condition being tested.
 */
const assert_array_approx_equals_ulp = (actual, expected, nulp, dataType, description) => {
  /*
    * Test if two primitive arrays are equal within acceptable ULP distance
    */
  assert_equals(
      actual.length, expected.length,
      `assert_array_approx_equals_ulp: ${description} lengths differ`);
  for (let i = 0; i < actual.length; i++) {
    if (actual[i] === expected[i]) {
      continue;
    } else {
      let distance = ulpDistance(actual[i], expected[i], dataType);

      // TODO: See if callers can be updated to pass matching type.
      nulp = typeof distance === 'bigint' ? BigInt(nulp) : Number(nulp);

      assert_less_than_equal(distance, nulp,
            `assert_array_approx_equals_ulp: ${description} actual ` +
                `${
                    dataType === 'float16' ?
                        float16AsUint16ToNumber(actual[i]) :
                        actual[i]} should be close enough to expected ` +
                `${expected[i]} by ULP distance:`);
    }
  }
};

/**
 * Compute the ULP distance between ``a`` and ``b`` for the given ``dataType``.
 *
 * @param {(Number|BigInt)} a - First value.
 * @param {(Number|BigInt)} b - Second value.
 * @param {String} dataType - A data type string, value: "float32",
 *     more types, please see:
 *     https://www.w3.org/TR/webnn/#enumdef-mloperanddatatype
 */
const ulpDistance = (a, b, dataType) => {
  let aBitwise, bBitwise;
  // measure the ULP distance
  if (dataType === 'float32') {
    aBitwise = getBitwise(a, dataType);
    bBitwise = getBitwise(b, dataType);
  } else if (dataType === 'float16') {
    aBitwise = a;
    // convert b data of Float16 to Uint16
    bBitwise = toHalf(b);

    // Workaround to use mask to check returned special float16 value -0.0 which
    // is 32768 (1000 0000 0000 0000) of uint16
    const signExclusionMask = 0x00007FFF;
    if ((aBitwise & signExclusionMask) === 0 &&
        (bBitwise & signExclusionMask) === 0) {
      return 0;
    }
  } else if (dataType === 'int64' || dataType === 'uint64') {
    aBitwise = BigInt(a);
    bBitwise = BigInt(b);
  } else if (
      dataType === 'int8' || dataType === 'uint8' || dataType === 'int32' ||
      dataType === 'uint32' || dataType === 'int4' || dataType === 'uint4') {
    aBitwise = a;
    bBitwise = b;
  } else {
    throw new AssertionError(`Data type ${dataType} is not supported`);
  }
  const distance = aBitwise - bBitwise;
  return distance >= 0 ? distance : -distance;
};

/**
 * This function converts a Float16 stored as the bits of a Uint16 into a
 * JavaScript Number.
 * @param {Number} uint16 - a Float16 stored as the bits of a Uint16
 * @returns An emulated Float16 number.
 */
function float16AsUint16ToNumber(uint16) {
  const sign = (uint16 >> 15) & 0x1;
  const exponent = (uint16 >> 10) & 0x1F;
  const mantissa = uint16 & 0x3FF;
  let float16;

  if (exponent === 0) {
    // Subnormal number
    float16 = (mantissa / 1024) * Math.pow(2, -14);
  } else if (exponent === 0x1F) {
    // NaN or Infinity
    float16 = mantissa ? NaN : Infinity;
  } else {
    // Normalized number
    float16 = (1 + mantissa / 1024) * Math.pow(2, exponent - 15);
  }

  // Apply the sign
  return sign ? -float16 : float16;
}

/**
 * Assert actual results with expected results.
 * @param {String} operatorName
 * @param {(Number[]|Number)} actual
 * @param {(Number[]|Number)} expected
 * @param {String} metricType - Value: 'ULP', 'ATOL'
 * @param {Number} toleranceValue
 * @param {String} dataType  - An operand type string, value: "float32",
 *     more types, please see:
 *     https://www.w3.org/TR/webnn/#enumdef-mloperanddatatype
 */
const doAssert =
    (operatorName, actual, expected, metricType, toleranceValue, dataType) => {
      const description = `test ${operatorName} ${dataType}`;
      if (typeof expected === 'number') {
        expected = [expected];
        actual = [actual];
      }
      if (metricType === 'ULP') {
        assert_array_approx_equals_ulp(
            actual, expected, toleranceValue, dataType, description);
      } else if (metricType === 'ATOL') {
        let actualData;
        if (dataType === 'float16') {
          // workaround for float16
          actualData = new Array(actual.length);
          actual.forEach(
              (x, index) => actualData[index] = float16AsUint16ToNumber(x));
        } else {
          actualData = actual;
        }
        assert_array_approx_equals(
            actualData, expected, toleranceValue, description);
      } else {
        throw new AssertionError(
            `Tolerance Metric type '${metricType}' is not supported`);
      }
    };

/**
 * Assert computed results be equal to expected data.
 * @param {Object} toleranceFunc
 * @param {Map<String, ArrayBufferView> |
 *     Array[Map<String, ArrayBufferView>]} actual
 * @param {Object} graphResources - Resources used for building a graph
 */
const assertResultsEquals =
    (toleranceFunc, actual, graphResources, intermediateOperands) => {
      const operatorName =
          graphResources.operators.map(operator => operator.name).join(' ');
      const expectedOutputs = graphResources.expectedOutputs;
      const toleranceInfo = toleranceFunc(graphResources, intermediateOperands);
      const metricType = toleranceInfo.metricType;
      const toleranceValue = toleranceInfo.value;
      let outputData;

      for (let operandName in actual) {
        const expectedSuboutput = expectedOutputs[operandName];
        const expectedDescriptor = expectedSuboutput.descriptor;
        let expectedData = expectedSuboutput.data;
        outputData = actual[operandName];
        // If data is scalar and shape is not, it means it's expecting to be
        // filled by the scalar value. Also limit the array size so it doesn't
        // timeout.
        if (typeof (expectedData) === 'number' && expectedDescriptor.shape &&
            sizeOfShape(expectedDescriptor.shape) > 1) {
          const size = Math.min(
              kMaximumIndexToValidate, sizeOfShape(expectedDescriptor.shape));
          expectedData = new Array(size).fill(expectedData);
          outputData = outputData.subarray(0, kMaximumIndexToValidate);
        } else if (
            expectedDescriptor.dataType === 'uint4' ||
            expectedDescriptor.dataType === 'int4') {
          // The int4/uint4 data were packed in Uint8Array.
          // The first nybble and later nybble of one int8/uint8 value store two
          // consecutive 4-bits values separately. After unpacking each 4-bits
          // value, the unpacked int4 value is stored in an element of
          // Int8Array, and the unpacked uint4 value is stored in an element of
          // Uint8Array. For example: an array of uint4:
          //   size = [1, 5]
          //   Uint8Array.of(0x21, 0x43, 0x65, 0x87, 0xA9)
          // Would yield 5 * 2 uint4 data:
          //   Uint8Array.of(1,2,3,4,5,6,7,8,9,10);
          // Another example: an array of int4:
          //   size = [1, 5]
          //   Uint8Array.of(0xA9, 0xCB, 0xED, 0x0F, 0x21)
          // Would yield 5 * 2 int4 data:
          //   Int8Array.of(-7, -6, -5, -4, -3, -2, -1, 0, 1, 2);
          let newOutputData;
          if (expectedDescriptor.dataType === 'uint4') {
            newOutputData =
                new Uint8Array(sizeOfShape(expectedDescriptor.shape));
          } else {
            newOutputData =
                new Int8Array(sizeOfShape(expectedDescriptor.shape));
          }
          const signMask =
              (expectedDescriptor.dataType === 'int4') ? 0x08 : 0x00;
          for (let i = 0; i < sizeOfShape(expectedDescriptor.shape); i++) {
            const byteIndex = Math.floor(i / 2);
            let value = (outputData[byteIndex] >> ((i & 1) << 2)) & 0xF;
            // Handle the negative numbers.
            if (value & signMask) {
              value |= 0xF0;
            }
            newOutputData[i] = value;
          }
          outputData = newOutputData;
        }
        doAssert(
            operatorName, outputData, expectedData, metricType, toleranceValue,
            expectedDescriptor.dataType);
      }
    };

const createOperand = (context, builder, operandName, resources) => {
  let operand;
  const descriptor = resources.descriptor;
  const dataType = descriptor.dataType;

  const supportedDataTypes = resources.constant ?
      context.opSupportLimits().constant.dataTypes :
      context.opSupportLimits().input.dataTypes;

  // If input data type is not supported on current platform, attempt to use
  // a supported type to pass the data, then cast back to original type.
  if (!supportedDataTypes.includes(dataType)) {
    const compatibleType = findCompatibleType(
        dataType, supportedDataTypes, context.opSupportLimits().cast);
    if (compatibleType) {
      descriptor.castedType = compatibleType;
      descriptor.dataType = compatibleType;
    }
  }

  operand = resources.constant ?
      builder.constant(
          descriptor,
          getTypedArrayData(
              descriptor.dataType, sizeOfShape(descriptor.shape),
              resources.data)) :
      builder.input(operandName, descriptor);

  if (descriptor.castedType) {
    operand = builder.cast(operand, dataType);
  }

  return operand;
};

/**
 * Create inputs or outputs tensor.
 * @param {MLContext} context - the context used to create inputs or outputs
 *     tensor.
 * @param {String} dataType - dataType of inputs / outputs operands
 * @param {Array} shape - dimensions of inputs / outputs operands
 * @param {Object} [data] - optional data for inputs tensor
 * @returns {MLTensor}
 */
async function createTensorWithData(context, dataType, shape, data) {
  const tensorDesc = {dataType, shape};
  if (data) {
    tensorDesc.writable = true;
  } else {
    tensorDesc.readable = true;
  }
  let tensor = await context.createTensor(tensorDesc);
  if (data) {
    context.writeTensor(tensor, data);
  }
  return tensor;
}

async function prepareInputsForGraph(context, resources) {
  const inputOperandNameArray = Object.keys(resources).filter(
      operandName => !resources[operandName].constant);
  const tensors = await Promise.all(inputOperandNameArray.map((operandName) => {
    const inputOperandResources = resources[operandName];
    const descriptor = inputOperandResources.descriptor;
    const targetDataType =
        descriptor.castedType ? descriptor.castedType : descriptor.dataType;
    const inputBuffer = getTypedArrayData(
        targetDataType, sizeOfShape(descriptor.shape),
        inputOperandResources.data);
    return createTensorWithData(
        context, targetDataType, descriptor.shape, inputBuffer);
  }));

  const inputs = {};
  inputOperandNameArray.forEach((name, index) => inputs[name] = tensors[index]);
  return inputs;
}

async function prepareOutputsForGraph(context, resources) {
  const outputOperandNameArray = Object.keys(resources);
  const tensors =
      await Promise.all(outputOperandNameArray.map((operandName) => {
        const descriptor = resources[operandName].descriptor;
        const dataType =
            descriptor.castedType ? descriptor.castedType : descriptor.dataType;
        return createTensorWithData(context, dataType, descriptor.shape);
      }));

  const outputs = {};
  outputOperandNameArray.forEach(
      (name, index) => outputs[name] = tensors[index]);
  return outputs;
}

function getInputName(operatorArguments, operandName) {
  for (let argument of operatorArguments) {
    const name = Object.keys(argument)[0];
    if (name === operandName) {
      return argument[operandName];
    } else if (name === 'options') {
      if (Object.keys(argument[name]).includes(operandName)) {
        return argument[name][operandName];
      }
    }
  }
  return null;
}

// This assert() function is to check whether configurations of test case are
// set correctly.
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Wrong test case, ${message}`);
  }
}

function validateContextSupportsGraph(context, graph) {
  const supportLimits = context.opSupportLimits();
  const inputDataTypes = supportLimits.input.dataTypes;
  const constantDataTypes = supportLimits.constant.dataTypes;
  const outputDataTypes = supportLimits.output.dataTypes;

  function validateInputOrConstantDataType(
      inputName, operatorSupportLimits, operand) {
    const inputDataType = graph.inputs[inputName].descriptor.dataType;
    if (graph.inputs[inputName].constant) {
      if (!constantDataTypes.includes(inputDataType)) {
        throw new TypeError(
            `Unsupported data type, constant '${operand}' data type ${
                inputDataType} must be one of [${constantDataTypes}].`);
      }
    } else {
      if (!inputDataTypes.includes(inputDataType)) {
        throw new TypeError(
            `Unsupported data type, input '${operand}' data type ${
                inputDataType} must be one of [${inputDataTypes}].`);
      }
    }

    if (!operatorSupportLimits[operand].dataTypes.includes(inputDataType)) {
      throw new TypeError(`Unsupported data type, input '${
          operand}' data type ${inputDataType} must be one of [${
          operatorSupportLimits[operand].dataTypes}].`);
    }
  }

  function validateOutputDataType(outputName, operatorSupportLimits, operand) {
    const outputDataType =
        graph.expectedOutputs[outputName].descriptor.dataType;
    if (!outputDataTypes.includes(outputDataType)) {
      throw new TypeError(
          `Unsupported data type, output '${operand}' data type ${
              outputDataType} must be one of [${outputDataTypes}].`);
    }

    if (!operatorSupportLimits[operand].dataTypes.includes(outputDataType)) {
      throw new TypeError(`Unsupported data type, output '${
          operand}' data type ${outputDataType} must be one of [${
          operatorSupportLimits[operand].dataTypes}].`);
    }
  }

  for (let operator of graph.operators) {
    const operatorName = operator.name;
    const operatorSupportLimits = supportLimits[operatorName];
    for (let operand of Object.keys(operatorSupportLimits)) {
      if (operand === 'output') {
        // single output operand
        assert(
            typeof operator.outputs === 'string',
            `the outputs of ${operatorName} should be a string.`);
        if (!graph.expectedOutputs[operator.outputs]) {
          // intermediate output
          continue;
        }
        validateOutputDataType(
            operator.outputs, operatorSupportLimits, 'output');
      } else if (operand === 'outputs') {
        // multiples output operands
        assert(
            Array.isArray(operator.outputs),
            `the outputs of ${operatorName} should be a string array.`);
        for (const outputName of operator.outputs) {
          assert(
              typeof outputName === 'string',
              `the outputs' item of ${operatorName} should be a string.`);
          if (!graph.expectedOutputs[outputName]) {
            // intermediate output
            continue;
          }
          validateOutputDataType(outputName, operatorSupportLimits, 'outputs');
        }
      } else {
        // input operand(s)
        if (operatorName === 'concat') {
          const inputNameArray = operator.arguments[0][operand];
          assert(
              Array.isArray(inputNameArray),
              `the inputs of ${operatorName} should be a string array.`);
          for (const inputName of inputNameArray) {
            assert(
                typeof inputName === 'string',
                `the inputs' item of ${operatorName} should be a string.`);
            if (!graph.inputs[inputName]) {
              // intermediate input
              continue;
            }
            validateInputOrConstantDataType(
                inputName, operatorSupportLimits, 'inputs');
          }
        } else {
          const inputName = getInputName(operator.arguments, operand);
          if (inputName === null || !graph.inputs[inputName]) {
            // default options argument or intermediate input
            continue;
          }
          validateInputOrConstantDataType(
              inputName, operatorSupportLimits, operand);
        }
      }
    }
  }
}

/**
 * This function is to execute the compiled graph.
 * @param {MLContext} context
 * @param {MLGraph} graph
 * @param {Map<String, {
 *                       data: Array.<Number>|Number,
 *                       descriptor: MLOperandDescriptor,
 *                       constant?: Boolean
 *                     }>} graphInputs
 * @param {Map<String, {
 *                      data: Array.<Number>|Number,
 *                      descriptor: MLOperandDescriptor,
 *                     }>} expectedOutputs
 * @returns A result object.
 */
async function computeGraph(context, graph, graphInputs, expectedOutputs) {
  const inputs = await prepareInputsForGraph(context, graphInputs);
  const outputs = await prepareOutputsForGraph(context, expectedOutputs);

  // Execute the compiled graph.
  context.dispatch(graph, inputs, outputs);

  const result = {};
  const outputNameArray = Object.keys(expectedOutputs);
  const outputBuffers = await Promise.all(Object.values(outputs).map(
      (tensor) => {return context.readTensor(tensor)}));
  outputNameArray.forEach((name, index) => {
    const dataType = expectedOutputs[name].descriptor.castedType ?
        expectedOutputs[name].descriptor.castedType :
        expectedOutputs[name].descriptor.dataType;
    result[name] = new TypedArrayDict[dataType](outputBuffers[index])
  });

  return result;
}

/**
 * This function is to compile and execute the constructed graph.
 * @param {MLContext} context
 * @param {MLGraphBuilder} builder
 * @param {{
 *           inputs: Map<String, {
 *                                 data: Array.<Number>|Number,
 *                                 descriptor: MLOperandDescriptor,
 *                                 constant?: Boolean
 *                               }>,
 *           operators: Array.<{
 *                               name: String,
 *                               arguments: Array.<Map<String, Object>> ,
 *                               outputs: Array.<String>|String
 *                             }>,
 *           expectedOutputs: Map<String, {
 *                                          data: Array.<Number>|Number,
 *                                          descriptor: MLOperandDescriptor,
 *                                        }>
 *        }} graphResources - Resources used for building a graph
 * @returns A Promise of MLComputeResult.
 */
const buildAndExecuteGraph = async (context, builder, graphResources) => {
  const outputOperands = [];
  const graphInputs = graphResources.inputs;
  const graphOperators = graphResources.operators;
  const intermediateOperands = {};
  for (const operator of graphOperators) {
    const argumentArray = [];
    for (const argument of operator.arguments) {
      for (const argumentName in argument) {
        if (argumentName !== 'options') {
          if (operator.name === 'concat' && argumentName === 'inputs') {
            const concatInputs = [];
            for (const inputName of argument[argumentName]) {
              if (graphInputs.hasOwnProperty(inputName)) {
                const operandName = inputName;
                const operand = createOperand(
                    context, builder, operandName, graphInputs[operandName]);
                concatInputs.push(operand);
              } else if (intermediateOperands.hasOwnProperty(inputName)) {
                concatInputs.push(intermediateOperands[inputName]);
              }
              // concatInputs.push(intermediateOperands[inputName]);
            }
            argumentArray.push(concatInputs);
          } else if (graphInputs.hasOwnProperty(argument[argumentName])) {
            const operandName = argument[argumentName];
            const operand = createOperand(
                context, builder, operandName, graphInputs[operandName]);
            argumentArray.push(operand);
          } else if (intermediateOperands.hasOwnProperty(
                         argument[argumentName])) {
            argumentArray.push(intermediateOperands[argument[argumentName]]);
          } else {
            argumentArray.push(argument[argumentName]);
          }
        } else {
          for (const [optionalArgumentName, value] of Object.entries(
                   argument['options'])) {
            if (typeof value === 'string' &&
                graphInputs.hasOwnProperty(value)) {
              const operandName = value;
              const operand = createOperand(
                  context, builder, operandName, graphInputs[operandName]);
              argument['options'][optionalArgumentName] = operand;
            } else if (
                typeof value === 'string' &&
                intermediateOperands.hasOwnProperty(value)) {
              argument['options'][optionalArgumentName] =
                  intermediateOperands[value];
            }
          }
          argumentArray.push(argument['options']);
        }
      }
    }

    const currentOutput = builder[operator.name](...argumentArray);
    if (Array.isArray(operator.outputs)) {
      operator.outputs.forEach((outputName, index) => {
        intermediateOperands[outputName] = currentOutput[index];
      });
    } else {
      intermediateOperands[operator.outputs] = currentOutput;
    }
  }

  const outputNames = Object.keys(graphResources.expectedOutputs);
  outputNames.forEach(outputName => {
    if (intermediateOperands.hasOwnProperty(outputName)) {
      outputOperands.push(intermediateOperands[outputName]);
    }
  });

  if (outputOperands.length !== outputNames.length) {
    throw new Error('Graph outputs are not properly defined');
  }

  for (let i = 0; i < outputOperands.length; ++i) {
    const expectedDescriptor =
        graphResources
            .expectedOutputs[Object.keys(graphResources.expectedOutputs)[i]]
            .descriptor;
    if (!context.opSupportLimits().output.dataTypes.includes(
            expectedDescriptor.dataType)) {
      const compatibleType = findCompatibleType(
          expectedDescriptor.dataType,
          context.opSupportLimits().output.dataTypes,
          context.opSupportLimits().cast);
      outputOperands[i] = builder.cast(outputOperands[i], compatibleType);
      expectedDescriptor.castedType = compatibleType;
    }
  }

  const outputNameArray = Object.keys(graphResources.expectedOutputs);
  for (let i = 0; i < outputOperands.length; ++i) {
    assertDescriptorsEquals(
        outputOperands[i],
        graphResources.expectedOutputs[outputNameArray[i]].descriptor);
  }

  const namedOutputOperand = {};
  outputNameArray.forEach(
      (name, index) => namedOutputOperand[name] = outputOperands[index]);

  // Compile the constructed graph.
  const graph = await builder.build(namedOutputOperand);

  // Execute the compiled graph.
  const result = await computeGraph(
      context, graph, graphInputs, graphResources.expectedOutputs);

  return {result, intermediateOperands};
};

const getGemmPrecisionTolerance =
    (op, graphResources, intermediateOperands) => {
  // GEMM : alpha * (A x B) + beta * C
  // An upper bound for the worst serial ordering is bounded by
  // the number of lossy operations, where matrix multiplication
  // is a dot product (mul and add times the number of elements)
  // plus bias operations.
  const {inputs} = graphResources;
  const args = op.arguments;
  let ShapeA;
  const indexA = args[0][Object.keys(args[0])[0]];
  if (inputs[indexA]) {
    ShapeA = inputs[indexA].descriptor.shape;
  } else {
    ShapeA = intermediateOperands[indexA].shape;
  }
  const options =
      args.length === 3 ? {...args[2][Object.keys(args[2])[0]]} : {};
  const width = options.aTranspose ? ShapeA[0] : ShapeA[1];
  let tolerance = width * 2;
  // default options.alpha is 1.0
  if (options.alpha !== undefined && options.alpha !== 1.0) {
    tolerance++;
  }
  if (options.c && options.beta !== 0.0) {
    // default options.beta is 1.0
    if (options.beta !== undefined && options.beta !== 1.0) {
      tolerance++;
    }
    tolerance++;
  }

  const toleranceValueDict = {float32: tolerance, float16: tolerance};
  const expectedDataType =
      getExpectedDataTypeOfSingleOutput(graphResources.expectedOutputs);
  return {metricType: 'ULP', value: toleranceValueDict[expectedDataType]};
};

const getConv2dPrecisionTolerance =
    (op, graphResources, intermediateOperands) => {
  // number of reduced input elements multiplied by filter and summed (a sliding
  // dot product like pooling)
  const {inputs} = graphResources;
  const operatorName = op.name;
  const args = op.arguments;
  let inputShape;
  const inputIndex = args[0][Object.keys(args[0])[0]];
  const filterIndex = args[1][Object.keys(args[1])[0]];
  if (inputs[inputIndex]) {
    inputShape = inputs[inputIndex].descriptor.shape;
  } else {
    inputShape = intermediateOperands[inputIndex].shape;
  }
  let filterShape;
  if (inputs[filterIndex]) {
    filterShape = inputs[filterIndex].descriptor.shape;
  } else {
    filterShape = intermediateOperands[filterIndex].shape;
  }
  const options =
      args.length === 3 ? {...args[2][Object.keys(args[2])[0]]} : {};
  let inputChannels = inputShape[1];  // default nchw inputLayout
  // default oihw filterLayout for conv2d or default iohw filterLayout for
  // convTranspose2d
  let filterWidth = filterShape[3];
  let filterHeight = filterShape[2];
  const groups = options.groups ? options.groups : 1;

  if (options.inputLayout) {
    if (!['nchw', 'nhwc'].includes(options.inputLayout)) {
      throw new Error(`Unknown inputLayout ${options.inputLayout}`);
    }
    inputChannels =
        options.inputLayout === 'nchw' ? inputChannels : inputShape[3];
  }
  if (options.filterLayout) {
    let filterLayouts = ['oihw', 'hwio', 'ohwi', 'ihwo'];  // default for conv2d
    if (operatorName === 'convTranspose2d') {
      filterLayouts = ['iohw', 'hwoi', 'ohwi'];
    }
    if (!filterLayouts.includes(options.filterLayout)) {
      throw new Error(`Unknown filterLayout ${options.filterLayout}`);
    }
    switch (options.filterLayout) {
      case 'oihw':
      case 'iohw':
        // Just use the existing filterWidth and filterHeight above.
        break;
      case 'hwio':
      case 'hwoi':
        filterWidth = filterShape[1];
        filterHeight = filterShape[0];
        break;
      case 'ohwi':
      case 'ihwo':
        filterWidth = filterShape[2];
        filterHeight = filterShape[1];
        break;
      default:
        break;
    }
  }

  const tolerance = filterWidth * filterHeight * (inputChannels / groups) * 2;
  const toleranceValueDict = {float32: tolerance, float16: tolerance};
  const expectedDataType =
      getExpectedDataTypeOfSingleOutput(graphResources.expectedOutputs);
  return {metricType: 'ULP', value: toleranceValueDict[expectedDataType]};
};

const getPoolingOperatorsPrecisionTolerance =
    (op, graphResources, intermediateOperands) => {
  const args = op.arguments;
  const operatorName = op.name;
  const {inputs} = graphResources;
  let inputShape;
  const inputIndex = args[0][Object.keys(args[0])[0]];
  if (inputs[inputIndex]) {
    inputShape = inputs[inputIndex].descriptor.shape;
  } else {
    inputShape = intermediateOperands[inputIndex].shape;
  }
  const options =
      args.length === 2 ? {...args[1][Object.keys(args[1])[0]]} : {};
  let height;
  let width;

  if (options.windowDimensions) {
    height = options.windowDimensions[0];
    width = options.windowDimensions[1];
  } else {
    // If not present, the window dimensions are assumed to be the height
    // and width dimensions of the input shape
    if (options.layout && options.layout === 'nhwc') {
      height = inputShape[1];
      width = inputShape[2];
    } else {
      // nhwc layout of input
      height = inputShape[2];
      width = inputShape[3];
    }
  }

  const tolerance = height * width + 2;
  const toleranceDict = {
    averagePool2d: {float32: tolerance, float16: tolerance},
    l2Pool2d: {float32: tolerance, float16: tolerance},
    maxPool2d: {float32: 0, float16: 0},
  };
  const expectedDataType =
      getExpectedDataTypeOfSingleOutput(graphResources.expectedOutputs);
  return {
    metricType: 'ULP',
    value: toleranceDict[operatorName][expectedDataType]
  };
};

const getInstanceNormPrecisionTolerance = (graphResources) => {
  // according to
  // https://github.com/web-platform-tests/wpt/pull/43891#discussion_r1457026316
  const toleranceValueDict = {float32: 840, float16: 8400};
  const expectedDataType =
      getExpectedDataTypeOfSingleOutput(graphResources.expectedOutputs);
  return {metricType: 'ULP', value: toleranceValueDict[expectedDataType]};
};

const getExpectedDataTypeOfSingleOutput = (expectedOutput) => {
  const expectedDescriptor =
      expectedOutput[Object.keys(expectedOutput)[0]].descriptor;
  const dataType = expectedDescriptor.castedType ?
      expectedDescriptor.castedType :
      expectedDescriptor.dataType;
  return dataType;
};

const getReductionOperatorsPrecisionTolerance =
    (op, graphResources, intermediateOperands) => {
      let tolerance;
      const operatorName = op.name;
      if (op.name === 'reduceMax' || op.name === 'reduceMin') {
        tolerance = 0;
      } else {
        // other reduction operators
        const args = op.arguments;
        const {inputs} = graphResources;
        let inputShape;
        const inputIndex = args[0][Object.keys(args[0])[0]];
        if (inputs[inputIndex]) {
          inputShape = inputs[inputIndex].descriptor.shape;
        } else {
          inputShape = intermediateOperands[inputIndex].shape;
        }

        const rank = inputShape.length;
        const options =
            args.length === 2 ? {...args[1][Object.keys(args[1])[0]]} : {};
        let sizes;

        if (options && options.axes) {
          sizes = options.axes.map(
              (axis) => axis < 0 ? inputShape[axis + rank] : inputShape[axis]);
        } else {
          sizes = inputShape;
        }

        const elementCount = sizes.reduce(
            (accumulator, currentValue) => accumulator * currentValue, 1);
        tolerance = elementCount;
      }

      const toleranceDict = {
        reduceL1: tolerance,
        reduceL2: tolerance * 2 + 2,
        reduceLogSum: tolerance + 18,
        reduceLogSumExp: tolerance * 2 + 18,
        reduceMax: tolerance,
        reduceMean: tolerance + 2,
        reduceMin: tolerance,
        reduceProduct: tolerance,
        reduceSum: tolerance,
        reduceSumSquare: tolerance * 2
      };
      return {metricType: 'ULP', value: toleranceDict[operatorName]};
    };

const getResample2dPrecisionTolerance =
    (op, graphResources, intermediateOperands) => {
      const args = op.arguments;
      const options =
          args.length === 2 ? {...args[1][Object.keys(args[1])[0]]} : {};
      const expectedOutputs = graphResources.expectedOutputs;
      const dataType =
          expectedOutputs[Object.keys(expectedOutputs)[0]].descriptor.dataType;
      let tolerance;

      if (options.mode && options.mode === 'linear') {
        // interpolation mode is linear
        if (dataType === 'float32') {
          tolerance = 84;
        } else if (dataType === 'float16') {
          tolerance = 10;
        } else {
          tolerance = 1;
        }
      } else {
        // interpolation mode is nearest-neighbor
        tolerance = 0;
      }

      return {metricType: 'ULP', value: tolerance};
    };

// `cast_to_supported_type` will check if the graph input/output is
// supported by current context, if not, it will try to find a compatible
// type that's supported and use that type, then cast back to original type.
const webnn_conformance_test =
    (buildAndExecuteGraphFunc, toleranceFunc, testResources,
     cast_to_supported_type = false) => {
      promise_test(async () => {
        let context;
        try {
          context = await navigator.ml.createContext(contextOptions);
        } catch (e) {
          throw new AssertionError(
              `Unable to create context for ${variant} variant. ${e}`);
        }
        if (!cast_to_supported_type) {
          validateContextSupportsGraph(context, testResources.graph);
        }
        const builder = new MLGraphBuilder(context);
        const {result, intermediateOperands} = await buildAndExecuteGraphFunc(
            context, builder, testResources.graph);
        assertResultsEquals(
            toleranceFunc, result, testResources.graph, intermediateOperands);
      }, testResources.name);
    };
