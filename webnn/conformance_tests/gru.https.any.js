// META: title=test WebNN API gru operation
// META: global=window
// META: variant=?cpu
// META: variant=?gpu
// META: variant=?npu
// META: script=../resources/utils.js
// META: timeout=long

'use strict';

// https://www.w3.org/TR/webnn/#api-mlgraphbuilder-gru
// Gated Recurrent Unit recurrent network uses an update, reset, and new gate
// to compute the output state that rolls into the output across the temporal
// sequence of the network.
//
// enum MLGruWeightLayout {
//   "zrn",  // update-reset-new gate ordering
//   "rzn"   // reset-update-new gate ordering
// };
//
// enum MLRecurrentNetworkActivation {
//   "relu",
//   "sigmoid",
//   "tanh"
// };
//
// enum MLRecurrentNetworkDirection {
//   "forward",
//   "backward",
//   "both"
// };
//
// dictionary MLGruOptions {
//   MLOperand bias;
//   MLOperand recurrentBias;
//   MLOperand initialHiddenState;
//   boolean resetAfter = true;
//   boolean returnSequence = false;
//   MLRecurrentNetworkDirection direction = "forward";
//   MLGruWeightLayout layout = "zrn";
//   sequence<MLRecurrentNetworkActivation> activations;
// };
//
// sequence<MLOperand> gru(MLOperand input,
//                         MLOperand weight,
//                         MLOperand recurrentWeight,
//                         [EnforceRange] unsigned long steps,
//                         [EnforceRange] unsigned long hiddenSize,
//                         optional MLGruOptions options = {});


const getGruPrecisionTolerance = (graphResources) => {
  const toleranceValueDict = {float32: 6, float16: 6};
  const expectedDataType =
      graphResources
          .expectedOutputs[Object.keys(graphResources.expectedOutputs)[0]]
          .descriptor.dataType;
  return {metricType: 'ULP', value: toleranceValueDict[expectedDataType]};
};

const gruTests = [
  // float32 tests
  {
    'name':
        "gru float32 tensors steps=1 with options.bias, options.recurrentBias and options.activations=['relu', 'relu']",
    'graph': {
      'inputs': {
        'gruInput': {
          'data': [1, 2, 2, 1, 1, 1],
          'descriptor': {shape: [1, 3, 2], dataType: 'float32'}
        },
        'gruWeight': {
          'data': [
            1,   -1,   2, -2,  0.5, -0.5, 0, 0.1, 1,   -1,   2, -2,
            0.5, -0.5, 0, 0.1, 1,   -1,   2, -2,  0.5, -0.5, 0, 0.1
          ],
          'descriptor': {shape: [1, 12, 2], dataType: 'float32'}
        },
        'gruRecurrentWeight': {
          'data': [
            0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1,
            0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1,
            0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1,
            0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1
          ],
          'descriptor': {shape: [1, 12, 4], dataType: 'float32'}
        },
        'gruBias': {
          'data': [1, 2, 1, 2, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5],
          'descriptor': {shape: [1, 12], dataType: 'float32'}
        },
        'gruRecurrentBias': {
          'data': [1, 2, 1, 2, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5],
          'descriptor': {shape: [1, 12], dataType: 'float32'}
        },
      },
      'operators': [{
        'name': 'gru',
        'arguments': [
          {'input': 'gruInput'}, {'weight': 'gruWeight'},
          {'recurrentWeight': 'gruRecurrentWeight'}, {'steps': 1},
          {'hiddenSize': 4}, {
            'options': {
              'bias': 'gruBias',
              'recurrentBias': 'gruRecurrentBias',
              'resetAfter': false,
              'activations': ['relu', 'relu']
            }
          }
        ],
        'outputs': ['gruOutput']
      }],
      'expectedOutputs': {
        'gruOutput': {
          'data':
              [0, 0, -0.25, -3.84, -4, -15, -2.25, -3.41, -1, -3, -1, -3.41],
          'descriptor': {shape: [1, 3, 4], dataType: 'float32'}
        }
      }
    }
  },
  {
    'name':
        "gru float32 tensors steps=1 with options.bias, options.recurrentBias and options.activations=['relu', 'relu'] and reset_after=true",
    'graph': {
      'inputs': {
        'gruInput': {
          'data': [1, 2, 2, 1, 1, 1],
          'descriptor': {shape: [1, 3, 2], dataType: 'float32'}
        },
        'gruWeight': {
          'data': [
            1,   -1,   2, -2,  0.5, -0.5, 0, 0.1, 1,   -1,   2, -2,
            0.5, -0.5, 0, 0.1, 1,   -1,   2, -2,  0.5, -0.5, 0, 0.1
          ],
          'descriptor': {shape: [1, 12, 2], dataType: 'float32'}
        },
        'gruRecurrentWeight': {
          'data': [
            0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1,
            0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1,
            0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1,
            0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1
          ],
          'descriptor': {shape: [1, 12, 4], dataType: 'float32'}
        },
        'gruBias': {
          'data': [1, 2, 1, 2, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5],
          'descriptor': {shape: [1, 12], dataType: 'float32'}
        },
        'gruRecurrentBias': {
          'data': [1, 2, 1, 2, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5],
          'descriptor': {shape: [1, 12], dataType: 'float32'}
        },
      },
      'operators': [{
        'name': 'gru',
        'arguments': [
          {'input': 'gruInput'}, {'weight': 'gruWeight'},
          {'recurrentWeight': 'gruRecurrentWeight'}, {'steps': 1},
          {'hiddenSize': 4}, {
            'options': {
              'bias': 'gruBias',
              'recurrentBias': 'gruRecurrentBias',
              'resetAfter': true,
              'activations': ['relu', 'relu']
            }
          }
        ],
        'outputs': ['gruOutput']
      }],
      'expectedOutputs': {
        'gruOutput': {
          'data': [
            0, 0, -0.375, -5.7599992752075195, -6, -22.5, -3.375,
            -5.114999771118164, -1.5, -4.5, -1.5, -5.114999771118164
          ],
          'descriptor': {shape: [1, 3, 4], dataType: 'float32'}
        }
      }
    }
  },
  {
    'name':
        "gru float32 tensors steps=1 with options.bias, options.recurrentBias, options.activations=['relu', 'relu'] and explicit options.direction='forward'",
    'graph': {
      'inputs': {
        'gruInput': {
          'data': [1, 2, 2, 1, 1, 1],
          'descriptor': {shape: [1, 3, 2], dataType: 'float32'}
        },
        'gruWeight': {
          'data': [
            1,   -1,   2, -2,  0.5, -0.5, 0, 0.1, 1,   -1,   2, -2,
            0.5, -0.5, 0, 0.1, 1,   -1,   2, -2,  0.5, -0.5, 0, 0.1
          ],
          'descriptor': {shape: [1, 12, 2], dataType: 'float32'}
        },
        'gruRecurrentWeight': {
          'data': [
            0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1,
            0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1,
            0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1,
            0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1
          ],
          'descriptor': {shape: [1, 12, 4], dataType: 'float32'}
        },
        'gruBias': {
          'data': [1, 2, 1, 2, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5],
          'descriptor': {shape: [1, 12], dataType: 'float32'}
        },
        'gruRecurrentBias': {
          'data': [1, 2, 1, 2, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5],
          'descriptor': {shape: [1, 12], dataType: 'float32'}
        },
      },
      'operators': [{
        'name': 'gru',
        'arguments': [
          {'input': 'gruInput'}, {'weight': 'gruWeight'},
          {'recurrentWeight': 'gruRecurrentWeight'}, {'steps': 1},
          {'hiddenSize': 4}, {
            'options': {
              'bias': 'gruBias',
              'recurrentBias': 'gruRecurrentBias',
              'resetAfter': false,
              'direction': 'forward',
              'activations': ['relu', 'relu']
            }
          }
        ],
        'outputs': ['gruOutput']
      }],
      'expectedOutputs': {
        'gruOutput': {
          'data':
              [0, 0, -0.25, -3.84, -4, -15, -2.25, -3.41, -1, -3, -1, -3.41],
          'descriptor': {shape: [1, 3, 4], dataType: 'float32'}
        }
      }
    }
  },
  {
    'name':
        "gru float32 tensors steps=1 with options.bias, options.recurrentBias, options.activations=['relu', 'relu'] and explicit options.layout='zrn'",
    'graph': {
      'inputs': {
        'gruInput': {
          'data': [1, 2, 2, 1, 1, 1],
          'descriptor': {shape: [1, 3, 2], dataType: 'float32'}
        },
        'gruWeight': {
          'data': [
            1,   -1,   2, -2,  0.5, -0.5, 0, 0.1, 1,   -1,   2, -2,
            0.5, -0.5, 0, 0.1, 1,   -1,   2, -2,  0.5, -0.5, 0, 0.1
          ],
          'descriptor': {shape: [1, 12, 2], dataType: 'float32'}
        },
        'gruRecurrentWeight': {
          'data': [
            0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1,
            0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1,
            0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1,
            0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1
          ],
          'descriptor': {shape: [1, 12, 4], dataType: 'float32'}
        },
        'gruBias': {
          'data': [1, 2, 1, 2, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5],
          'descriptor': {shape: [1, 12], dataType: 'float32'}
        },
        'gruRecurrentBias': {
          'data': [1, 2, 1, 2, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5],
          'descriptor': {shape: [1, 12], dataType: 'float32'}
        },
      },
      'operators': [{
        'name': 'gru',
        'arguments': [
          {'input': 'gruInput'}, {'weight': 'gruWeight'},
          {'recurrentWeight': 'gruRecurrentWeight'}, {'steps': 1},
          {'hiddenSize': 4}, {
            'options': {
              'bias': 'gruBias',
              'recurrentBias': 'gruRecurrentBias',
              'resetAfter': false,
              'layout': 'zrn',
              'activations': ['relu', 'relu']
            }
          }
        ],
        'outputs': ['gruOutput']
      }],
      'expectedOutputs': {
        'gruOutput': {
          'data':
              [0, 0, -0.25, -3.84, -4, -15, -2.25, -3.41, -1, -3, -1, -3.41],
          'descriptor': {shape: [1, 3, 4], dataType: 'float32'}
        }
      }
    }
  },
  {
    'name':
        "gru float32 tensors steps=1 with options.bias, options.recurrentBias, options.activations=['relu', 'relu'] and options.layout='rzn'",
    'graph': {
      'inputs': {
        'gruInput': {
          'data': [1, 2, 2, 1, 1, 1],
          'descriptor': {shape: [1, 3, 2], dataType: 'float32'}
        },
        'gruWeight': {
          'data': [
            1,   -1,   2, -2,  0.5, -0.5, 0, 0.1, 1,   -1,   2, -2,
            0.5, -0.5, 0, 0.1, 1,   -1,   2, -2,  0.5, -0.5, 0, 0.1
          ],
          'descriptor': {shape: [1, 12, 2], dataType: 'float32'}
        },
        'gruRecurrentWeight': {
          'data': [
            0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1,
            0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1,
            0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1,
            0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1
          ],
          'descriptor': {shape: [1, 12, 4], dataType: 'float32'}
        },
        'gruBias': {
          'data': [1, 1, 1, 1, 1, 2, 1, 2, 0.5, 0.5, 0.5, 0.5],
          'descriptor': {shape: [1, 12], dataType: 'float32'}
        },
        'gruRecurrentBias': {
          'data': [1, 1, 1, 1, 1, 2, 1, 2, 0.5, 0.5, 0.5, 0.5],
          'descriptor': {shape: [1, 12], dataType: 'float32'}
        },
      },
      'operators': [{
        'name': 'gru',
        'arguments': [
          {'input': 'gruInput'}, {'weight': 'gruWeight'},
          {'recurrentWeight': 'gruRecurrentWeight'}, {'steps': 1},
          {'hiddenSize': 4}, {
            'options': {
              'bias': 'gruBias',
              'recurrentBias': 'gruRecurrentBias',
              'resetAfter': false,
              'layout': 'rzn',
              'activations': ['relu', 'relu']
            }
          }
        ],
        'outputs': ['gruOutput']
      }],
      'expectedOutputs': {
        'gruOutput': {
          'data':
              [0, 0, -0.25, -3.84, -4, -15, -2.25, -3.41, -1, -3, -1, -3.41],
          'descriptor': {shape: [1, 3, 4], dataType: 'float32'}
        }
      }
    }
  },
  {
    'name':
        "gru float32 tensors steps=1 with options.bias, options.recurrentBias, options.activations=['relu', 'relu'] and options.initialHiddenState",
    'graph': {
      'inputs': {
        'gruInput': {
          'data': [1, 2, 2, 1, 1, 1],
          'descriptor': {shape: [1, 3, 2], dataType: 'float32'}
        },
        'gruWeight': {
          'data': [
            1,   -1,   2, -2,  0.5, -0.5, 0, 0.1, 1,   -1,   2, -2,
            0.5, -0.5, 0, 0.1, 1,   -1,   2, -2,  0.5, -0.5, 0, 0.1
          ],
          'descriptor': {shape: [1, 12, 2], dataType: 'float32'}
        },
        'gruRecurrentWeight': {
          'data': [
            0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1,
            0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1,
            0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1,
            0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1
          ],
          'descriptor': {shape: [1, 12, 4], dataType: 'float32'}
        },
        'gruBias': {
          'data': [1, 2, 1, 2, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5],
          'descriptor': {shape: [1, 12], dataType: 'float32'}
        },
        'gruRecurrentBias': {
          'data': [1, 2, 1, 2, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5],
          'descriptor': {shape: [1, 12], dataType: 'float32'}
        },
        'gruInitialHiddenState': {
          'data': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          'descriptor': {shape: [1, 3, 4], dataType: 'float32'}
        }
      },
      'operators': [{
        'name': 'gru',
        'arguments': [
          {'input': 'gruInput'}, {'weight': 'gruWeight'},
          {'recurrentWeight': 'gruRecurrentWeight'}, {'steps': 1},
          {'hiddenSize': 4}, {
            'options': {
              'bias': 'gruBias',
              'recurrentBias': 'gruRecurrentBias',
              'initialHiddenState': 'gruInitialHiddenState',
              'resetAfter': false,
              'activations': ['relu', 'relu']
            }
          }
        ],
        'outputs': ['gruOutput']
      }],
      'expectedOutputs': {
        'gruOutput': {
          'data':
              [0, 0, -0.25, -3.84, -4, -15, -2.25, -3.41, -1, -3, -1, -3.41],
          'descriptor': {shape: [1, 3, 4], dataType: 'float32'}
        }
      }
    }
  },
  {
    'name': 'gru float32 tensors steps=1 all options',
    'graph': {
      'inputs': {
        'gruInput': {
          'data': [1, 2, 2, 1, 1, 1],
          'descriptor': {shape: [1, 3, 2], dataType: 'float32'}
        },
        'gruWeight': {
          'data': [
            1,   -1,   2, -2,  0.5, -0.5, 0, 0.1, 1,   -1,   2, -2,
            0.5, -0.5, 0, 0.1, 1,   -1,   2, -2,  0.5, -0.5, 0, 0.1
          ],
          'descriptor': {shape: [1, 12, 2], dataType: 'float32'}
        },
        'gruRecurrentWeight': {
          'data': [
            0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1,
            0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1,
            0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1,
            0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1
          ],
          'descriptor': {shape: [1, 12, 4], dataType: 'float32'}
        },
        'gruBias': {
          'data': [1, 2, 1, 2, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5],
          'descriptor': {shape: [1, 12], dataType: 'float32'}
        },
        'gruRecurrentBias': {
          'data': [1, 2, 1, 2, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5],
          'descriptor': {shape: [1, 12], dataType: 'float32'}
        },
        'gruInitialHiddenState': {
          'data': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          'descriptor': {shape: [1, 3, 4], dataType: 'float32'}
        }
      },
      'operators': [{
        'name': 'gru',
        'arguments': [
          {'input': 'gruInput'}, {'weight': 'gruWeight'},
          {'recurrentWeight': 'gruRecurrentWeight'}, {'steps': 1},
          {'hiddenSize': 4}, {
            'options': {
              'bias': 'gruBias',
              'recurrentBias': 'gruRecurrentBias',
              'initialHiddenState': 'gruInitialHiddenState',
              'resetAfter': false,
              'returnSequence': true,
              'direction': 'forward',
              'layout': 'zrn',
              'activations': ['relu', 'relu']
            }
          }
        ],
        'outputs': ['gruOutput1', 'gruOutput2']
      }],
      'expectedOutputs': {
        'gruOutput1': {
          'data':
              [0, 0, -0.25, -3.84, -4, -15, -2.25, -3.41, -1, -3, -1, -3.41],
          'descriptor': {shape: [1, 3, 4], dataType: 'float32'}
        },
        'gruOutput2': {
          'data':
              [0, 0, -0.25, -3.84, -4, -15, -2.25, -3.41, -1, -3, -1, -3.41],
          'descriptor': {shape: [1, 1, 3, 4], dataType: 'float32'}
        }
      }
    }
  },
  {
    'name':
        "gru float32 tensors steps=2 with options.bias, options.recurrentBias, options.activations=['relu', 'relu'] and options.direction='backward'",
    'graph': {
      'inputs': {
        'gruInput': {
          'data': [1, 2, 2, 1, 1, 1, 3, 4, 1, 2, 1, 1],
          'descriptor': {shape: [2, 3, 2], dataType: 'float32'}
        },
        'gruWeight': {
          'data': [
            1,   -1,   2, -2,  0.5, -0.5, 0, 0.1, 1,   -1,   2, -2,
            0.5, -0.5, 0, 0.1, 1,   -1,   2, -2,  0.5, -0.5, 0, 0.1
          ],
          'descriptor': {shape: [1, 12, 2], dataType: 'float32'}
        },
        'gruRecurrentWeight': {
          'data': [
            0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1,
            0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1,
            0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1,
            0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1
          ],
          'descriptor': {shape: [1, 12, 4], dataType: 'float32'}
        },
        'gruBias': {
          'data': [1, 2, 1, 2, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5],
          'descriptor': {shape: [1, 12], dataType: 'float32'}
        },
        'gruRecurrentBias': {
          'data': [1, 2, 1, 2, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5],
          'descriptor': {shape: [1, 12], dataType: 'float32'}
        },
      },
      'operators': [{
        'name': 'gru',
        'arguments': [
          {'input': 'gruInput'}, {'weight': 'gruWeight'},
          {'recurrentWeight': 'gruRecurrentWeight'}, {'steps': 2},
          {'hiddenSize': 4}, {
            'options': {
              'bias': 'gruBias',
              'recurrentBias': 'gruRecurrentBias',
              'resetAfter': false,
              'direction': 'backward',
              'activations': ['relu', 'relu']
            }
          }
        ],
        'outputs': ['gruOutput']
      }],
      'expectedOutputs': {
        'gruOutput': {
          'data': [
            0, 0, -0.24974998831748963, -18.59588623046875, -2.0657243728637697,
            -10.551867485046387, -1.3937838077545167, -15.2454833984375,
            -1.1589999198913575, -9.476999282836914, -1.1589999198913575,
            -11.319169044494629
          ],
          'descriptor': {shape: [1, 3, 4], dataType: 'float32'}
        }
      }
    }
  },
  {
    'name':
        "gru float32 tensors steps=2 with options.bias, options.recurrentBias, options.direction='backward', options.activations=['relu', 'relu'] and explicit options.returnSequence=false",
    'graph': {
      'inputs': {
        'gruInput': {
          'data': [1, 2, 2, 1, 1, 1, 3, 4, 1, 2, 1, 1],
          'descriptor': {shape: [2, 3, 2], dataType: 'float32'}
        },
        'gruWeight': {
          'data': [
            1,   -1,   2, -2,  0.5, -0.5, 0, 0.1, 1,   -1,   2, -2,
            0.5, -0.5, 0, 0.1, 1,   -1,   2, -2,  0.5, -0.5, 0, 0.1
          ],
          'descriptor': {shape: [1, 12, 2], dataType: 'float32'}
        },
        'gruRecurrentWeight': {
          'data': [
            0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1,
            0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1,
            0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1,
            0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1
          ],
          'descriptor': {shape: [1, 12, 4], dataType: 'float32'}
        },
        'gruBias': {
          'data': [1, 2, 1, 2, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5],
          'descriptor': {shape: [1, 12], dataType: 'float32'}
        },
        'gruRecurrentBias': {
          'data': [1, 2, 1, 2, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5],
          'descriptor': {shape: [1, 12], dataType: 'float32'}
        },
      },
      'operators': [{
        'name': 'gru',
        'arguments': [
          {'input': 'gruInput'}, {'weight': 'gruWeight'},
          {'recurrentWeight': 'gruRecurrentWeight'}, {'steps': 2},
          {'hiddenSize': 4}, {
            'options': {
              'bias': 'gruBias',
              'recurrentBias': 'gruRecurrentBias',
              'resetAfter': false,
              'returnSequence': false,
              'direction': 'backward',
              'activations': ['relu', 'relu']
            }
          }
        ],
        'outputs': ['gruOutput']
      }],
      'expectedOutputs': {
        'gruOutput': {
          'data': [
            0, 0, -0.24974998831748963, -18.59588623046875, -2.0657243728637697,
            -10.551867485046387, -1.3937838077545167, -15.2454833984375,
            -1.1589999198913575, -9.476999282836914, -1.1589999198913575,
            -11.319169044494629
          ],
          'descriptor': {shape: [1, 3, 4], dataType: 'float32'}
        }
      }
    }
  },
  {
    'name':
        "gru float32 tensors steps=2 with options.bias, options.recurrentBias, options.direction='backward', options.activations=['relu', 'relu'] and options.returnSequence=true",
    'graph': {
      'inputs': {
        'gruInput': {
          'data': [1, 2, 2, 1, 1, 1, 3, 4, 1, 2, 1, 1],
          'descriptor': {shape: [2, 3, 2], dataType: 'float32'}
        },
        'gruWeight': {
          'data': [
            1,   -1,   2, -2,  0.5, -0.5, 0, 0.1, 1,   -1,   2, -2,
            0.5, -0.5, 0, 0.1, 1,   -1,   2, -2,  0.5, -0.5, 0, 0.1
          ],
          'descriptor': {shape: [1, 12, 2], dataType: 'float32'}
        },
        'gruRecurrentWeight': {
          'data': [
            0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1,
            0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1,
            0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1,
            0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1
          ],
          'descriptor': {shape: [1, 12, 4], dataType: 'float32'}
        },
        'gruBias': {
          'data': [1, 2, 1, 2, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5],
          'descriptor': {shape: [1, 12], dataType: 'float32'}
        },
        'gruRecurrentBias': {
          'data': [1, 2, 1, 2, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5],
          'descriptor': {shape: [1, 12], dataType: 'float32'}
        },
      },
      'operators': [{
        'name': 'gru',
        'arguments': [
          {'input': 'gruInput'}, {'weight': 'gruWeight'},
          {'recurrentWeight': 'gruRecurrentWeight'}, {'steps': 2},
          {'hiddenSize': 4}, {
            'options': {
              'bias': 'gruBias',
              'recurrentBias': 'gruRecurrentBias',
              'resetAfter': false,
              'returnSequence': true,
              'direction': 'backward',
              'activations': ['relu', 'relu']
            }
          }
        ],
        'outputs': ['gruOutput1', 'gruOutput2']
      }],
      'expectedOutputs': {
        'gruOutput1': {
          'data': [
            0, 0, -0.24974998831748963, -18.59588623046875, -2.0657243728637697,
            -10.551867485046387, -1.3937838077545167, -15.2454833984375,
            -1.1589999198913575, -9.476999282836914, -1.1589999198913575,
            -11.319169044494629
          ],
          'descriptor': {shape: [1, 3, 4], dataType: 'float32'}
        },
        'gruOutput2': {
          'data': [
            0,
            0,
            -0.24974998831748963,
            -18.59588623046875,
            -2.0657243728637697,
            -10.551867485046387,
            -1.3937838077545167,
            -15.2454833984375,
            -1.1589999198913575,
            -9.476999282836914,
            -1.1589999198913575,
            -11.319169044494629,
            0,
            0,
            -0.25,
            -4.760000228881836,
            0,
            0,
            -0.25,
            -3.8399999141693117,
            -1,
            -3,
            -1,
            -3.4100000858306886
          ],
          'descriptor': {shape: [2, 1, 3, 4], dataType: 'float32'}
        }
      }
    }
  },
  {
    'name':
        "gru float32 tensors steps=2 with options.bias, options.recurrentBias, options.direction='both' and options.returnSequence=true",
    'graph': {
      'inputs': {
        'gruInput': {
          'data': [1, 2, 2, 1, 1, 1, 3, 4, 1, 2, 1, 1],
          'descriptor': {shape: [2, 3, 2], dataType: 'float32'}
        },
        'gruWeight': {
          'data': [
            1, -1, 2, -2, 0.5, -0.5, 0, 0.1, 1, -1, 2, -2, 0.5, -0.5, 0, 0.1,
            1, -1, 2, -2, 0.5, -0.5, 0, 0.1, 1, -1, 2, -2, 0.5, -0.5, 0, 0.1,
            1, -1, 2, -2, 0.5, -0.5, 0, 0.1, 1, -1, 2, -2, 0.5, -0.5, 0, 0.1
          ],
          'descriptor': {shape: [2, 12, 2], dataType: 'float32'}
        },
        'gruRecurrentWeight': {
          'data': [
            0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1,
            0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1,
            0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1,
            0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1,
            0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1,
            0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1,
            0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1,
            0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1
          ],
          'descriptor': {shape: [2, 12, 4], dataType: 'float32'}
        },
        'gruBias': {
          'data': [
            1, 2, 1, 2, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5,
            1, 2, 1, 2, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5
          ],
          'descriptor': {shape: [2, 12], dataType: 'float32'}
        },
        'gruRecurrentBias': {
          'data': [
            1, 2, 1, 2, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5,
            1, 2, 1, 2, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5
          ],
          'descriptor': {shape: [2, 12], dataType: 'float32'}
        },
      },
      'operators': [{
        'name': 'gru',
        'arguments': [
          {'input': 'gruInput'}, {'weight': 'gruWeight'},
          {'recurrentWeight': 'gruRecurrentWeight'}, {'steps': 2},
          {'hiddenSize': 4}, {
            'options': {
              'bias': 'gruBias',
              'recurrentBias': 'gruRecurrentBias',
              'resetAfter': true,
              'returnSequence': true,
              'activations': ['relu', 'relu'],
              'direction': 'both'
            }
          }
        ],
        'outputs': ['gruOutput1', 'gruOutput2']
      }],
      'expectedOutputs': {
        'gruOutput1': {
          'data': [
            0,
            0,
            -0.33243751525878906,
            -23.753076553344727,
            0,
            0,
            0,
            -2.213315725326538,
            -1.1077498197555542,
            -12.323249816894531,
            -1.1077498197555542,
            -14.518925666809082,
            0,
            0,
            -0.28068751096725464,
            -25.444257736206055,
            -1.7041922807693481,
            -9.28022289276123,
            -1.4041223526000977,
            -21.154621124267578,
            -1.1077498197555542,
            -12.323249816894531,
            -1.1077498197555542,
            -14.518925666809082
          ],
          'descriptor': {shape: [2, 3, 4], dataType: 'float32'}
        },
        'gruOutput2': {
          'data': [
            0,
            0,
            -0.375,
            -5.7599992752075195,
            -6,
            -22.5,
            -3.375,
            -5.114999771118164,
            -1.5,
            -4.5,
            -1.5,
            -5.114999771118164,
            0,
            0,
            -0.28068751096725464,
            -25.444257736206055,
            -1.7041922807693481,
            -9.28022289276123,
            -1.4041223526000977,
            -21.154621124267578,
            -1.1077498197555542,
            -12.323249816894531,
            -1.1077498197555542,
            -14.518925666809082,
            0,
            0,
            -0.33243751525878906,
            -23.753076553344727,
            0,
            0,
            0,
            -2.213315725326538,
            -1.1077498197555542,
            -12.323249816894531,
            -1.1077498197555542,
            -14.518925666809082,
            0,
            0,
            -0.375,
            -7.139999866485596,
            0,
            0,
            -0.375,
            -5.7599992752075195,
            -1.5,
            -4.5,
            -1.5,
            -5.114999771118164
          ],
          'descriptor': {shape: [2, 2, 3, 4], dataType: 'float32'}
        }
      }
    }
  },
  {
    'name': 'gru float32 tensors steps=2 with all options',
    'graph': {
      'inputs': {
        'gruInput': {
          'data': [1, 2, 2, 1, 1, 1, 3, 4, 1, 2, 1, 1],
          'descriptor': {shape: [2, 3, 2], dataType: 'float32'}
        },
        'gruWeight': {
          'data': [
            1,   -1,   2, -2,  0.5, -0.5, 0, 0.1, 1,   -1,   2, -2,
            0.5, -0.5, 0, 0.1, 1,   -1,   2, -2,  0.5, -0.5, 0, 0.1
          ],
          'descriptor': {shape: [1, 12, 2], dataType: 'float32'}
        },
        'gruRecurrentWeight': {
          'data': [
            0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1,
            0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1,
            0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1,
            0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1
          ],
          'descriptor': {shape: [1, 12, 4], dataType: 'float32'}
        },
        'gruBias': {
          'data': [1, 2, 1, 2, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5],
          'descriptor': {shape: [1, 12], dataType: 'float32'}
        },
        'gruRecurrentBias': {
          'data': [1, 2, 1, 2, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5],
          'descriptor': {shape: [1, 12], dataType: 'float32'}
        },
        'gruInitialHiddenState': {
          'data': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          'descriptor': {shape: [1, 3, 4], dataType: 'float32'}
        }
      },
      'operators': [{
        'name': 'gru',
        'arguments': [
          {'input': 'gruInput'}, {'weight': 'gruWeight'},
          {'recurrentWeight': 'gruRecurrentWeight'}, {'steps': 2},
          {'hiddenSize': 4}, {
            'options': {
              'bias': 'gruBias',
              'recurrentBias': 'gruRecurrentBias',
              'initialHiddenState': 'gruInitialHiddenState',
              'resetAfter': false,
              'returnSequence': true,
              'direction': 'backward',
              'layout': 'zrn',
              'activations': ['relu', 'relu']
            }
          }
        ],
        'outputs': ['gruOutput1', 'gruOutput2']
      }],
      'expectedOutputs': {
        'gruOutput1': {
          'data': [
            0, 0, -0.24974998831748963, -18.59588623046875, -2.0657243728637697,
            -10.551867485046387, -1.3937838077545167, -15.2454833984375,
            -1.1589999198913575, -9.476999282836914, -1.1589999198913575,
            -11.319169044494629
          ],
          'descriptor': {shape: [1, 3, 4], dataType: 'float32'}
        },
        'gruOutput2': {
          'data': [
            0,
            0,
            -0.24974998831748963,
            -18.59588623046875,
            -2.0657243728637697,
            -10.551867485046387,
            -1.3937838077545167,
            -15.2454833984375,
            -1.1589999198913575,
            -9.476999282836914,
            -1.1589999198913575,
            -11.319169044494629,
            0,
            0,
            -0.25,
            -4.760000228881836,
            0,
            0,
            -0.25,
            -3.8399999141693117,
            -1,
            -3,
            -1,
            -3.4100000858306886
          ],
          'descriptor': {shape: [2, 1, 3, 4], dataType: 'float32'}
        }
      }
    }
  },

  // float16 tests
  {
    'name':
        "gru float16 tensors steps=1 with options.bias, options.recurrentBias and options.activations=['relu', 'relu']",
    'graph': {
      'inputs': {
        'gruInput': {
          'data': [1, 2, 2, 1, 1, 1],
          'descriptor': {shape: [1, 3, 2], dataType: 'float16'}
        },
        'gruWeight': {
          'data': [
            1, -1, 2, -2, 0.5, -0.5, 0, 0.0999755859375,
            1, -1, 2, -2, 0.5, -0.5, 0, 0.0999755859375,
            1, -1, 2, -2, 0.5, -0.5, 0, 0.0999755859375
          ],
          'descriptor': {shape: [1, 12, 2], dataType: 'float16'}
        },
        'gruRecurrentWeight': {
          'data': [
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375
          ],
          'descriptor': {shape: [1, 12, 4], dataType: 'float16'}
        },
        'gruBias': {
          'data': [1, 2, 1, 2, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5],
          'descriptor': {shape: [1, 12], dataType: 'float16'}
        },
        'gruRecurrentBias': {
          'data': [1, 2, 1, 2, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5],
          'descriptor': {shape: [1, 12], dataType: 'float16'}
        }
      },
      'operators': [{
        'name': 'gru',
        'arguments': [
          {'input': 'gruInput'}, {'weight': 'gruWeight'},
          {'recurrentWeight': 'gruRecurrentWeight'}, {'steps': 1},
          {'hiddenSize': 4}, {
            'options': {
              'bias': 'gruBias',
              'recurrentBias': 'gruRecurrentBias',
              'resetAfter': false,
              'activations': ['relu', 'relu']
            }
          }
        ],
        'outputs': ['gruOutput']
      }],
      'expectedOutputs': {
        'gruOutput': {
          'data': [
            0, 0, -0.25, -3.83984375, -4, -15, -2.25, -3.41015625, -1, -3, -1,
            -3.41015625
          ],
          'descriptor': {shape: [1, 3, 4], dataType: 'float16'}
        }
      }
    }
  },
  {
    'name':
        "gru float16 tensors steps=1 with options.bias, options.recurrentBias and options.activations=['relu', 'relu'] and resetAfter=true",
    'graph': {
      'inputs': {
        'gruInput': {
          'data': [1, 2, 2, 1, 1, 1],
          'descriptor': {shape: [1, 3, 2], dataType: 'float16'}
        },
        'gruWeight': {
          'data': [
            1, -1, 2, -2, 0.5, -0.5, 0, 0.0999755859375,
            1, -1, 2, -2, 0.5, -0.5, 0, 0.0999755859375,
            1, -1, 2, -2, 0.5, -0.5, 0, 0.0999755859375
          ],
          'descriptor': {shape: [1, 12, 2], dataType: 'float16'}
        },
        'gruRecurrentWeight': {
          'data': [
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375
          ],
          'descriptor': {shape: [1, 12, 4], dataType: 'float16'}
        },
        'gruBias': {
          'data': [1, 2, 1, 2, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5],
          'descriptor': {shape: [1, 12], dataType: 'float16'}
        },
        'gruRecurrentBias': {
          'data': [1, 2, 1, 2, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5],
          'descriptor': {shape: [1, 12], dataType: 'float16'}
        }
      },
      'operators': [{
        'name': 'gru',
        'arguments': [
          {'input': 'gruInput'}, {'weight': 'gruWeight'},
          {'recurrentWeight': 'gruRecurrentWeight'}, {'steps': 1},
          {'hiddenSize': 4}, {
            'options': {
              'bias': 'gruBias',
              'recurrentBias': 'gruRecurrentBias',
              'resetAfter': true,
              'activations': ['relu', 'relu']
            }
          }
        ],
        'outputs': ['gruOutput']
      }],
      'expectedOutputs': {
        'gruOutput': {
          'data': [
            0, 0, -0.375, -5.7578125, -6, -22.5, -3.375, -5.11328125, -1.5,
            -4.5, -1.5, -5.11328125
          ],
          'descriptor': {shape: [1, 3, 4], dataType: 'float16'}
        }
      }
    }
  },
  {
    'name':
        "gru float16 tensors steps=1 with options.bias, options.recurrentBias, options.activations=['relu', 'relu'] and explicit options.direction='forward'",
    'graph': {
      'inputs': {
        'gruInput': {
          'data': [1, 2, 2, 1, 1, 1],
          'descriptor': {shape: [1, 3, 2], dataType: 'float16'}
        },
        'gruWeight': {
          'data': [
            1, -1, 2, -2, 0.5, -0.5, 0, 0.0999755859375,
            1, -1, 2, -2, 0.5, -0.5, 0, 0.0999755859375,
            1, -1, 2, -2, 0.5, -0.5, 0, 0.0999755859375
          ],
          'descriptor': {shape: [1, 12, 2], dataType: 'float16'}
        },
        'gruRecurrentWeight': {
          'data': [
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375
          ],
          'descriptor': {shape: [1, 12, 4], dataType: 'float16'}
        },
        'gruBias': {
          'data': [1, 2, 1, 2, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5],
          'descriptor': {shape: [1, 12], dataType: 'float16'}
        },
        'gruRecurrentBias': {
          'data': [1, 2, 1, 2, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5],
          'descriptor': {shape: [1, 12], dataType: 'float16'}
        }
      },
      'operators': [{
        'name': 'gru',
        'arguments': [
          {'input': 'gruInput'}, {'weight': 'gruWeight'},
          {'recurrentWeight': 'gruRecurrentWeight'}, {'steps': 1},
          {'hiddenSize': 4}, {
            'options': {
              'bias': 'gruBias',
              'recurrentBias': 'gruRecurrentBias',
              'resetAfter': false,
              'direction': 'forward',
              'activations': ['relu', 'relu']
            }
          }
        ],
        'outputs': ['gruOutput']
      }],
      'expectedOutputs': {
        'gruOutput': {
          'data': [
            0, 0, -0.25, -3.83984375, -4, -15, -2.25, -3.41015625, -1, -3, -1,
            -3.41015625
          ],
          'descriptor': {shape: [1, 3, 4], dataType: 'float16'}
        }
      }
    }
  },
  {
    'name':
        "gru float16 tensors steps=1 with options.bias, options.recurrentBias, options.activations=['relu', 'relu'] and explicit options.layout='zrn'",
    'graph': {
      'inputs': {
        'gruInput': {
          'data': [1, 2, 2, 1, 1, 1],
          'descriptor': {shape: [1, 3, 2], dataType: 'float16'}
        },
        'gruWeight': {
          'data': [
            1, -1, 2, -2, 0.5, -0.5, 0, 0.0999755859375,
            1, -1, 2, -2, 0.5, -0.5, 0, 0.0999755859375,
            1, -1, 2, -2, 0.5, -0.5, 0, 0.0999755859375
          ],
          'descriptor': {shape: [1, 12, 2], dataType: 'float16'}
        },
        'gruRecurrentWeight': {
          'data': [
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375
          ],
          'descriptor': {shape: [1, 12, 4], dataType: 'float16'}
        },
        'gruBias': {
          'data': [1, 2, 1, 2, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5],
          'descriptor': {shape: [1, 12], dataType: 'float16'}
        },
        'gruRecurrentBias': {
          'data': [1, 2, 1, 2, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5],
          'descriptor': {shape: [1, 12], dataType: 'float16'}
        }
      },
      'operators': [{
        'name': 'gru',
        'arguments': [
          {'input': 'gruInput'}, {'weight': 'gruWeight'},
          {'recurrentWeight': 'gruRecurrentWeight'}, {'steps': 1},
          {'hiddenSize': 4}, {
            'options': {
              'bias': 'gruBias',
              'recurrentBias': 'gruRecurrentBias',
              'resetAfter': false,
              'layout': 'zrn',
              'activations': ['relu', 'relu']
            }
          }
        ],
        'outputs': ['gruOutput']
      }],
      'expectedOutputs': {
        'gruOutput': {
          'data': [
            0, 0, -0.25, -3.83984375, -4, -15, -2.25, -3.41015625, -1, -3, -1,
            -3.41015625
          ],
          'descriptor': {shape: [1, 3, 4], dataType: 'float16'}
        }
      }
    }
  },
  {
    'name':
        "gru float16 tensors steps=1 with options.bias, options.recurrentBias, options.activations=['relu', 'relu'] and options.layout='rzn'",
    'graph': {
      'inputs': {
        'gruInput': {
          'data': [1, 2, 2, 1, 1, 1],
          'descriptor': {shape: [1, 3, 2], dataType: 'float16'}
        },
        'gruWeight': {
          'data': [
            1, -1, 2, -2, 0.5, -0.5, 0, 0.0999755859375,
            1, -1, 2, -2, 0.5, -0.5, 0, 0.0999755859375,
            1, -1, 2, -2, 0.5, -0.5, 0, 0.0999755859375
          ],
          'descriptor': {shape: [1, 12, 2], dataType: 'float16'}
        },
        'gruRecurrentWeight': {
          'data': [
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375
          ],
          'descriptor': {shape: [1, 12, 4], dataType: 'float16'}
        },
        'gruBias': {
          'data': [1, 1, 1, 1, 1, 2, 1, 2, 0.5, 0.5, 0.5, 0.5],
          'descriptor': {shape: [1, 12], dataType: 'float16'}
        },
        'gruRecurrentBias': {
          'data': [1, 1, 1, 1, 1, 2, 1, 2, 0.5, 0.5, 0.5, 0.5],
          'descriptor': {shape: [1, 12], dataType: 'float16'}
        }
      },
      'operators': [{
        'name': 'gru',
        'arguments': [
          {'input': 'gruInput'}, {'weight': 'gruWeight'},
          {'recurrentWeight': 'gruRecurrentWeight'}, {'steps': 1},
          {'hiddenSize': 4}, {
            'options': {
              'bias': 'gruBias',
              'recurrentBias': 'gruRecurrentBias',
              'resetAfter': false,
              'layout': 'rzn',
              'activations': ['relu', 'relu']
            }
          }
        ],
        'outputs': ['gruOutput']
      }],
      'expectedOutputs': {
        'gruOutput': {
          'data': [
            0, 0, -0.25, -3.83984375, -4, -15, -2.25, -3.41015625, -1, -3, -1,
            -3.41015625
          ],
          'descriptor': {shape: [1, 3, 4], dataType: 'float16'}
        }
      }
    }
  },
  {
    'name':
        "gru float16 tensors steps=1 with options.bias, options.recurrentBias, options.activations=['relu', 'relu'] and options.initialHiddenState",
    'graph': {
      'inputs': {
        'gruInput': {
          'data': [1, 2, 2, 1, 1, 1],
          'descriptor': {shape: [1, 3, 2], dataType: 'float16'}
        },
        'gruWeight': {
          'data': [
            1, -1, 2, -2, 0.5, -0.5, 0, 0.0999755859375,
            1, -1, 2, -2, 0.5, -0.5, 0, 0.0999755859375,
            1, -1, 2, -2, 0.5, -0.5, 0, 0.0999755859375
          ],
          'descriptor': {shape: [1, 12, 2], dataType: 'float16'}
        },
        'gruRecurrentWeight': {
          'data': [
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375
          ],
          'descriptor': {shape: [1, 12, 4], dataType: 'float16'}
        },
        'gruBias': {
          'data': [1, 2, 1, 2, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5],
          'descriptor': {shape: [1, 12], dataType: 'float16'}
        },
        'gruRecurrentBias': {
          'data': [1, 2, 1, 2, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5],
          'descriptor': {shape: [1, 12], dataType: 'float16'}
        },
        'gruInitialHiddenState': {
          'data': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          'descriptor': {shape: [1, 3, 4], dataType: 'float16'}
        }
      },
      'operators': [{
        'name': 'gru',
        'arguments': [
          {'input': 'gruInput'}, {'weight': 'gruWeight'},
          {'recurrentWeight': 'gruRecurrentWeight'}, {'steps': 1},
          {'hiddenSize': 4}, {
            'options': {
              'bias': 'gruBias',
              'recurrentBias': 'gruRecurrentBias',
              'initialHiddenState': 'gruInitialHiddenState',
              'resetAfter': false,
              'activations': ['relu', 'relu']
            }
          }
        ],
        'outputs': ['gruOutput']
      }],
      'expectedOutputs': {
        'gruOutput': {
          'data': [
            0, 0, -0.25, -3.83984375, -4, -15, -2.25, -3.41015625, -1, -3, -1,
            -3.41015625
          ],
          'descriptor': {shape: [1, 3, 4], dataType: 'float16'}
        }
      }
    }
  },
  {
    'name': 'gru float16 tensors steps=1 all options',
    'graph': {
      'inputs': {
        'gruInput': {
          'data': [1, 2, 2, 1, 1, 1],
          'descriptor': {shape: [1, 3, 2], dataType: 'float16'}
        },
        'gruWeight': {
          'data': [
            1, -1, 2, -2, 0.5, -0.5, 0, 0.0999755859375,
            1, -1, 2, -2, 0.5, -0.5, 0, 0.0999755859375,
            1, -1, 2, -2, 0.5, -0.5, 0, 0.0999755859375
          ],
          'descriptor': {shape: [1, 12, 2], dataType: 'float16'}
        },
        'gruRecurrentWeight': {
          'data': [
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375
          ],
          'descriptor': {shape: [1, 12, 4], dataType: 'float16'}
        },
        'gruBias': {
          'data': [1, 2, 1, 2, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5],
          'descriptor': {shape: [1, 12], dataType: 'float16'}
        },
        'gruRecurrentBias': {
          'data': [1, 2, 1, 2, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5],
          'descriptor': {shape: [1, 12], dataType: 'float16'}
        },
        'gruInitialHiddenState': {
          'data': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          'descriptor': {shape: [1, 3, 4], dataType: 'float16'}
        }
      },
      'operators': [{
        'name': 'gru',
        'arguments': [
          {'input': 'gruInput'}, {'weight': 'gruWeight'},
          {'recurrentWeight': 'gruRecurrentWeight'}, {'steps': 1},
          {'hiddenSize': 4}, {
            'options': {
              'bias': 'gruBias',
              'recurrentBias': 'gruRecurrentBias',
              'initialHiddenState': 'gruInitialHiddenState',
              'resetAfter': false,
              'returnSequence': true,
              'direction': 'forward',
              'layout': 'zrn',
              'activations': ['relu', 'relu']
            }
          }
        ],
        'outputs': ['gruOutput1', 'gruOutput2']
      }],
      'expectedOutputs': {
        'gruOutput1': {
          'data': [
            0, 0, -0.25, -3.83984375, -4, -15, -2.25, -3.41015625, -1, -3, -1,
            -3.41015625
          ],
          'descriptor': {shape: [1, 3, 4], dataType: 'float16'}
        },
        'gruOutput2': {
          'data': [
            0, 0, -0.25, -3.83984375, -4, -15, -2.25, -3.41015625, -1, -3, -1,
            -3.41015625
          ],
          'descriptor': {shape: [1, 1, 3, 4], dataType: 'float16'}
        }
      }
    }
  },
  {
    'name':
        "gru float16 tensors steps=2 with options.bias, options.recurrentBias, options.activations=['relu', 'relu'] and options.direction='backward'",
    'graph': {
      'inputs': {
        'gruInput': {
          'data': [1, 2, 2, 1, 1, 1, 3, 4, 1, 2, 1, 1],
          'descriptor': {shape: [2, 3, 2], dataType: 'float16'}
        },
        'gruWeight': {
          'data': [
            1, -1, 2, -2, 0.5, -0.5, 0, 0.0999755859375,
            1, -1, 2, -2, 0.5, -0.5, 0, 0.0999755859375,
            1, -1, 2, -2, 0.5, -0.5, 0, 0.0999755859375
          ],
          'descriptor': {shape: [1, 12, 2], dataType: 'float16'}
        },
        'gruRecurrentWeight': {
          'data': [
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375
          ],
          'descriptor': {shape: [1, 12, 4], dataType: 'float16'}
        },
        'gruBias': {
          'data': [1, 2, 1, 2, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5],
          'descriptor': {shape: [1, 12], dataType: 'float16'}
        },
        'gruRecurrentBias': {
          'data': [1, 2, 1, 2, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5],
          'descriptor': {shape: [1, 12], dataType: 'float16'}
        }
      },
      'operators': [{
        'name': 'gru',
        'arguments': [
          {'input': 'gruInput'}, {'weight': 'gruWeight'},
          {'recurrentWeight': 'gruRecurrentWeight'}, {'steps': 2},
          {'hiddenSize': 4}, {
            'options': {
              'bias': 'gruBias',
              'recurrentBias': 'gruRecurrentBias',
              'resetAfter': false,
              'direction': 'backward',
              'activations': ['relu', 'relu']
            }
          }
        ],
        'outputs': ['gruOutput']
      }],
      'expectedOutputs': {
        'gruOutput': {
          'data': [
            0, 0, -0.249755859375, -18.59375, -2.06640625, -10.5546875,
            -1.39453125, -15.2421875, -1.1591796875, -9.4765625, -1.1591796875,
            -11.3203125
          ],
          'descriptor': {shape: [1, 3, 4], dataType: 'float16'}
        }
      }
    }
  },
  {
    'name':
        "gru float16 tensors steps=2 with options.bias, options.recurrentBias, options.direction='backward', options.activations=['relu', 'relu'] and explicit options.returnSequence=false",
    'graph': {
      'inputs': {
        'gruInput': {
          'data': [1, 2, 2, 1, 1, 1, 3, 4, 1, 2, 1, 1],
          'descriptor': {shape: [2, 3, 2], dataType: 'float16'}
        },
        'gruWeight': {
          'data': [
            1, -1, 2, -2, 0.5, -0.5, 0, 0.0999755859375,
            1, -1, 2, -2, 0.5, -0.5, 0, 0.0999755859375,
            1, -1, 2, -2, 0.5, -0.5, 0, 0.0999755859375
          ],
          'descriptor': {shape: [1, 12, 2], dataType: 'float16'}
        },
        'gruRecurrentWeight': {
          'data': [
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375
          ],
          'descriptor': {shape: [1, 12, 4], dataType: 'float16'}
        },
        'gruBias': {
          'data': [1, 2, 1, 2, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5],
          'descriptor': {shape: [1, 12], dataType: 'float16'}
        },
        'gruRecurrentBias': {
          'data': [1, 2, 1, 2, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5],
          'descriptor': {shape: [1, 12], dataType: 'float16'}
        }
      },
      'operators': [{
        'name': 'gru',
        'arguments': [
          {'input': 'gruInput'}, {'weight': 'gruWeight'},
          {'recurrentWeight': 'gruRecurrentWeight'}, {'steps': 2},
          {'hiddenSize': 4}, {
            'options': {
              'bias': 'gruBias',
              'recurrentBias': 'gruRecurrentBias',
              'resetAfter': false,
              'returnSequence': false,
              'direction': 'backward',
              'activations': ['relu', 'relu']
            }
          }
        ],
        'outputs': ['gruOutput']
      }],
      'expectedOutputs': {
        'gruOutput': {
          'data': [
            0, 0, -0.249755859375, -18.59375, -2.06640625, -10.5546875,
            -1.39453125, -15.2421875, -1.1591796875, -9.4765625, -1.1591796875,
            -11.3203125
          ],
          'descriptor': {shape: [1, 3, 4], dataType: 'float16'}
        }
      }
    }
  },
  {
    'name':
        "gru float16 tensors steps=2 with options.bias, options.recurrentBias, options.direction='backward', options.activations=['relu', 'relu'] and options.returnSequence=true",
    'graph': {
      'inputs': {
        'gruInput': {
          'data': [1, 2, 2, 1, 1, 1, 3, 4, 1, 2, 1, 1],
          'descriptor': {shape: [2, 3, 2], dataType: 'float16'}
        },
        'gruWeight': {
          'data': [
            1, -1, 2, -2, 0.5, -0.5, 0, 0.0999755859375,
            1, -1, 2, -2, 0.5, -0.5, 0, 0.0999755859375,
            1, -1, 2, -2, 0.5, -0.5, 0, 0.0999755859375
          ],
          'descriptor': {shape: [1, 12, 2], dataType: 'float16'}
        },
        'gruRecurrentWeight': {
          'data': [
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375
          ],
          'descriptor': {shape: [1, 12, 4], dataType: 'float16'}
        },
        'gruBias': {
          'data': [1, 2, 1, 2, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5],
          'descriptor': {shape: [1, 12], dataType: 'float16'}
        },
        'gruRecurrentBias': {
          'data': [1, 2, 1, 2, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5],
          'descriptor': {shape: [1, 12], dataType: 'float16'}
        }
      },
      'operators': [{
        'name': 'gru',
        'arguments': [
          {'input': 'gruInput'}, {'weight': 'gruWeight'},
          {'recurrentWeight': 'gruRecurrentWeight'}, {'steps': 2},
          {'hiddenSize': 4}, {
            'options': {
              'bias': 'gruBias',
              'recurrentBias': 'gruRecurrentBias',
              'resetAfter': false,
              'returnSequence': true,
              'direction': 'backward',
              'activations': ['relu', 'relu']
            }
          }
        ],
        'outputs': ['gruOutput1', 'gruOutput2']
      }],
      'expectedOutputs': {
        'gruOutput1': {
          'data': [
            0, 0, -0.249755859375, -18.59375, -2.06640625, -10.5546875,
            -1.39453125, -15.2421875, -1.1591796875, -9.4765625, -1.1591796875,
            -11.3203125
          ],
          'descriptor': {shape: [1, 3, 4], dataType: 'float16'}
        },
        'gruOutput2': {
          'data': [
            0,
            0,
            -0.249755859375,
            -18.59375,
            -2.06640625,
            -10.5546875,
            -1.39453125,
            -15.2421875,
            -1.1591796875,
            -9.4765625,
            -1.1591796875,
            -11.3203125,
            0,
            0,
            -0.25,
            -4.7578125,
            0,
            0,
            -0.25,
            -3.83984375,
            -1,
            -3,
            -1,
            -3.41015625
          ],
          'descriptor': {shape: [2, 1, 3, 4], dataType: 'float16'}
        }
      }
    }
  },
  {
    'name':
        "gru float16 tensors steps=2 with options.bias, options.recurrentBias, options.direction='both' and options.returnSequence=true",
    'graph': {
      'inputs': {
        'gruInput': {
          'data': [1, 2, 2, 1, 1, 1, 3, 4, 1, 2, 1, 1],
          'descriptor': {shape: [2, 3, 2], dataType: 'float16'}
        },
        'gruWeight': {
          'data': [
            1, -1, 2, -2, 0.5, -0.5, 0, 0.0999755859375,
            1, -1, 2, -2, 0.5, -0.5, 0, 0.0999755859375,
            1, -1, 2, -2, 0.5, -0.5, 0, 0.0999755859375,
            1, -1, 2, -2, 0.5, -0.5, 0, 0.0999755859375,
            1, -1, 2, -2, 0.5, -0.5, 0, 0.0999755859375,
            1, -1, 2, -2, 0.5, -0.5, 0, 0.0999755859375
          ],
          'descriptor': {shape: [2, 12, 2], dataType: 'float16'}
        },
        'gruRecurrentWeight': {
          'data': [
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375
          ],
          'descriptor': {shape: [2, 12, 4], dataType: 'float16'}
        },
        'gruBias': {
          'data': [
            1, 2, 1, 2, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5,
            1, 2, 1, 2, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5
          ],
          'descriptor': {shape: [2, 12], dataType: 'float16'}
        },
        'gruRecurrentBias': {
          'data': [
            1, 2, 1, 2, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5,
            1, 2, 1, 2, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5
          ],
          'descriptor': {shape: [2, 12], dataType: 'float16'}
        }
      },
      'operators': [{
        'name': 'gru',
        'arguments': [
          {'input': 'gruInput'}, {'weight': 'gruWeight'},
          {'recurrentWeight': 'gruRecurrentWeight'}, {'steps': 2},
          {'hiddenSize': 4}, {
            'options': {
              'bias': 'gruBias',
              'recurrentBias': 'gruRecurrentBias',
              'resetAfter': true,
              'returnSequence': true,
              'activations': ['relu', 'relu'],
              'direction': 'both'
            }
          }
        ],
        'outputs': ['gruOutput1', 'gruOutput2']
      }],
      'expectedOutputs': {
        'gruOutput1': {
          'data': [
            0,
            0,
            -0.33251953125,
            -23.75,
            0,
            0,
            0,
            -2.21875,
            -1.1083984375,
            -12.328125,
            -1.1083984375,
            -14.5234375,
            0,
            0,
            -0.28076171875,
            -25.4375,
            -1.705078125,
            -9.28125,
            -1.404296875,
            -21.15625,
            -1.1083984375,
            -12.328125,
            -1.1083984375,
            -14.5234375
          ],
          'descriptor': {shape: [2, 3, 4], dataType: 'float16'}
        },
        'gruOutput2': {
          'data': [
            0,
            0,
            -0.375,
            -5.7578125,
            -6,
            -22.5,
            -3.375,
            -5.11328125,
            -1.5,
            -4.5,
            -1.5,
            -5.11328125,
            0,
            0,
            -0.28076171875,
            -25.4375,
            -1.705078125,
            -9.28125,
            -1.404296875,
            -21.15625,
            -1.1083984375,
            -12.328125,
            -1.1083984375,
            -14.5234375,
            0,
            0,
            -0.33251953125,
            -23.75,
            0,
            0,
            0,
            -2.21875,
            -1.1083984375,
            -12.328125,
            -1.1083984375,
            -14.5234375,
            0,
            0,
            -0.375,
            -7.140625,
            0,
            0,
            -0.375,
            -5.7578125,
            -1.5,
            -4.5,
            -1.5,
            -5.11328125
          ],
          'descriptor': {shape: [2, 2, 3, 4], dataType: 'float16'}
        }
      }
    }
  },
  {
    'name': 'gru float16 tensors steps=2 with all options',
    'graph': {
      'inputs': {
        'gruInput': {
          'data': [1, 2, 2, 1, 1, 1, 3, 4, 1, 2, 1, 1],
          'descriptor': {shape: [2, 3, 2], dataType: 'float16'}
        },
        'gruWeight': {
          'data': [
            1, -1, 2, -2, 0.5, -0.5, 0, 0.0999755859375,
            1, -1, 2, -2, 0.5, -0.5, 0, 0.0999755859375,
            1, -1, 2, -2, 0.5, -0.5, 0, 0.0999755859375
          ],
          'descriptor': {shape: [1, 12, 2], dataType: 'float16'}
        },
        'gruRecurrentWeight': {
          'data': [
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375,
            0.0999755859375, 0.0999755859375, 0.0999755859375, 0.0999755859375
          ],
          'descriptor': {shape: [1, 12, 4], dataType: 'float16'}
        },
        'gruBias': {
          'data': [1, 2, 1, 2, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5],
          'descriptor': {shape: [1, 12], dataType: 'float16'}
        },
        'gruRecurrentBias': {
          'data': [1, 2, 1, 2, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5],
          'descriptor': {shape: [1, 12], dataType: 'float16'}
        },
        'gruInitialHiddenState': {
          'data': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          'descriptor': {shape: [1, 3, 4], dataType: 'float16'}
        }
      },
      'operators': [{
        'name': 'gru',
        'arguments': [
          {'input': 'gruInput'}, {'weight': 'gruWeight'},
          {'recurrentWeight': 'gruRecurrentWeight'}, {'steps': 2},
          {'hiddenSize': 4}, {
            'options': {
              'bias': 'gruBias',
              'recurrentBias': 'gruRecurrentBias',
              'initialHiddenState': 'gruInitialHiddenState',
              'resetAfter': false,
              'returnSequence': true,
              'direction': 'backward',
              'layout': 'zrn',
              'activations': ['relu', 'relu']
            }
          }
        ],
        'outputs': ['gruOutput1', 'gruOutput2']
      }],
      'expectedOutputs': {
        'gruOutput1': {
          'data': [
            0, 0, -0.249755859375, -18.59375, -2.06640625, -10.5546875,
            -1.39453125, -15.2421875, -1.1591796875, -9.4765625, -1.1591796875,
            -11.3203125
          ],
          'descriptor': {shape: [1, 3, 4], dataType: 'float16'}
        },
        'gruOutput2': {
          'data': [
            0,
            0,
            -0.249755859375,
            -18.59375,
            -2.06640625,
            -10.5546875,
            -1.39453125,
            -15.2421875,
            -1.1591796875,
            -9.4765625,
            -1.1591796875,
            -11.3203125,
            0,
            0,
            -0.25,
            -4.7578125,
            0,
            0,
            -0.25,
            -3.83984375,
            -1,
            -3,
            -1,
            -3.41015625
          ],
          'descriptor': {shape: [2, 1, 3, 4], dataType: 'float16'}
        }
      }
    }
  }
];

if (navigator.ml) {
  gruTests.filter(isTargetTest).forEach((test) => {
    webnn_conformance_test(
        buildAndExecuteGraph, getGruPrecisionTolerance, test);
  });

} else {
  test(() => assert_implements(navigator.ml, 'missing navigator.ml'));
}
