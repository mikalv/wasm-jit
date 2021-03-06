'use strict';

var Select = require('./select');
var fixtures = require('../../../../test/fixtures');

describe('x64/reductions/SelectOpcode', function() {
  var select;
  beforeEach(function() {
    select = new Select();
  });

  describe('unary ops', function() {
    it('should reduce i64.extend_s', function() {
      fixtures.testReduction(select, function() {/*
        pipeline {
          b0 {
            i0 = i32.const 123
            i1 = i64.extend_s i0
            i2 = ret ^b0, i1
          }
        }
      */}, function() {/*
        pipeline {
          b0 {
            i0 = i32.const 123
            i1 = x64:change-s32-to-i64 i0
            i2 = ret ^b0, i1
          }
        }
      */});
    });

    it('should reduce i64.extend_u', function() {
      fixtures.testReduction(select, function() {/*
        pipeline {
          b0 {
            i0 = i32.const 123
            i1 = i64.extend_u i0
            i2 = ret ^b0, i1
          }
        }
      */}, function() {/*
        pipeline {
          b0 {
            i0 = i32.const 123
            i1 = x64:change-u32-to-i64 i0
            i2 = ret ^b0, i1
          }
        }
      */});
    });

    it('should reduce addr.from_32', function() {
      fixtures.testReduction(select, function() {/*
        pipeline {
          b0 {
            i0 = i32.const 123
            i1 = addr.from_32 i0
            i2 = ret ^b0, i1
          }
        }
      */}, function() {/*
        pipeline {
          b0 {
            i0 = i32.const 123
            i1 = x64:change-u32-to-i64 i0
            i2 = ret ^b0, i1
          }
        }
      */});
    });
  });

  describe('binary ops', function() {
    it('should reduce iXX.add', function() {
      fixtures.testReduction(select, function() {/*
        pipeline {
          b0 {
            i0 = i64.const 123
            i1 = i64.add i0, i0
            i2 = ret ^b0, i1
          }
        }
      */}, function() {/*
        pipeline {
          b0 {
            i0 = i64.const 123
            i1 = x64:int.add i0, i0
            i2 = ret ^b0, i1
          }
        }
      */});
    });

    it('should not reduce fXX.add', function() {
      fixtures.testReduction(select, function() {/*
        pipeline {
          b0 {
            i0 = f64.const 123
            i1 = f64.add i0, i0
            i2 = ret ^b0, i1
          }
        }
      */}, function() {/*
        pipeline {
          b0 {
            i0 = f64.const 123
            i1 = f64.add i0, i0
            i2 = ret ^b0, i1
          }
        }
      */});
    });

    it('should add abs to f64.copysign', function() {
      fixtures.testReduction(select, function() {/*
        pipeline {
          b0 {
            i0 = f64.const 123
            i1 = f64.const 456
            i2 = f64.copysign i0, i1
            i3 = ret ^b0, i2
          }
        }
      */}, function() {/*
        pipeline {
          b0 {
            i0 = f64.const 123
            i1 = f64.abs i0
            i2 = f64.const 456
            i3 = f64.copysign i1, i2
            i4 = ret ^b0, i3
          }
        }
      */});
    });
  });

  describe('branching', function() {
    it('should reduce iXX.bool', function() {
      fixtures.testReduction(select, function() {/*
        pipeline {
          b0 {
            i0 = i64.const 123
            i1 = i64.bool i0
            i2 = ret ^b0, i1
          }
        }
      */}, function() {/*
        pipeline {
          b0 {
            i0 = i64.const 123
            i1 = ret ^b0, i0
          }
        }
      */});
    });

    it('should not reduce fXX.bool', function() {
      fixtures.testReduction(select, function() {/*
        pipeline {
          b0 {
            i0 = f64.const 123
            i1 = f64.bool i0
            i2 = ret ^b0, i1
          }
        }
      */}, function() {/*
        pipeline {
          b0 {
            i0 = f64.const 123
            i1 = f64.bool i0
            i2 = ret ^b0, i1
          }
        }
      */});
    });

    it('should reduce if + i64.eq', function() {
      fixtures.testReduction(select, function() {/*
        pipeline {
          b0 {
            i0 = i64.const 123
            i1 = i64.const 456
            i2 = i64.eq i0, i1
            i3 = if ^b0, i2
          }
          b0 -> b1, b2
          b1 {
            i4 = ret ^b1
          }
          b2 {
            i5 = ret ^b2
          }
        }
      */}, function() {/*
        pipeline {
          b0 {
            i0 = i64.const 123
            i1 = i64.const 456
            i2 = x64:if.i64.eq ^b0, i0, i1
          }
          b0 -> b1, b2
          b1 {
            i3 = ret ^b1
          }
          b2 {
            i4 = ret ^b2
          }
        }
      */});
    });

    it('should add changes for i32 booleans', function() {
      fixtures.testReduction(select, function() {/*
        pipeline {
          b0 {
            i0 = i32.const 123
            i1 = i32.const 456
            i2 = i32.gt_s i0, i1
            i3 = ret ^b0, i2
          }
        }
      */}, function() {/*
        pipeline {
          b0 {
            i0 = i32.const 123
            i1 = x64:change-s32-to-i64 i0
            i2 = i32.const 456
            i3 = x64:change-s32-to-i64 i2
            i4 = i64.gt_s i1, i3
            i5 = ret ^b0, i4
          }
        }
      */});
    });
  });

  describe('.ret', function() {
    it('should reduce int return', function() {
      fixtures.testReduction(select, function() {/*
        pipeline {
          b0 {
            i0 = i64.const 123
            i1 = i64.ret ^b0, i0
          }
        }
      */}, function() {/*
        pipeline {
          b0 {
            i0 = i64.const 123
            i1 = x64:int.ret ^b0, i0
          }
        }
      */});
    });

    it('should reduce float return', function() {
      fixtures.testReduction(select, function() {/*
        pipeline {
          b0 {
            i0 = f64.const 123
            i1 = f64.ret ^b0, i0
          }
        }
      */}, function() {/*
        pipeline {
          b0 {
            i0 = f64.const 123
            i1 = x64:float.ret ^b0, i0
          }
        }
      */});
    });
  });

  describe('memory access', function() {
    it('should add space input to store/load', function() {
      fixtures.testReduction(select, function() {/*
        pipeline {
          b0 {
            i0 = state
            i1 = i64.const 1
            i2 = addr.from_64 i1
            i3 = i64.store ^b0, i0, i2, i1
          }
        }
      */}, function() {/*
        pipeline {
          b0 {
            i0 = state
            i1 = x64:memory.space i0
            i2 = i64.const 1
            i3 = x64:memory.size i0
            i4 = x64:memory.bounds-check 8, i0, i2, i3
            i5 = x64:store64 ^b0, i0, i1, i4, i2
          }
        }
      */});
    });

    it('should reuse space input between store/load', function() {
      fixtures.testReduction(select, function() {/*
        pipeline {
          b0 {
            i0 = state
            i1 = i64.const 1
            i2 = addr.from_64 i1
            i3 = i64.store ^b0, i0, i2, i1
            i4 = updateState ^i3, 4, i0
            i5 = i32.load i4, i2
            i6 = ret ^b0, i5
          }
        }
      */}, function() {/*
        pipeline {
          b0 {
            i0 = state
            i1 = x64:memory.space i0
            i2 = i64.const 1
            i3 = x64:memory.size i0
            i4 = x64:memory.bounds-check 8, i0, i2, i3
            i5 = x64:store64 ^b0, i0, i1, i4, i2
            i6 = updateState ^i5, 4, i0
            i7 = x64:memory.space i6
            i8 = x64:memory.size i6
            i9 = x64:memory.bounds-check 4, i6, i2, i8
            i10 = x64:load32 i6, i7, i9
            i11 = ret ^b0, i10
          }
        }
      */});
    });

    it('should cast load outputs', function() {
      fixtures.testReduction(select, function() {/*
        pipeline {
          b0 {
            i0 = state
            i1 = i64.const 1
            i2 = addr.from_64 i1
            i3 = i64.load32_u i0, i2
            i4 = i64.load32_s i0, i2
            i5 = i64.load8_s i0, i2
            i6 = i64.add i3, i4
            i7 = i64.add i5, i6
            i8 = ret ^b0, i7
          }
        }
      */}, function() {/*
        pipeline {
          b0 {
            i0 = state
            i1 = x64:memory.space i0
            i2 = i64.const 1
            i3 = x64:memory.size i0
            i4 = x64:memory.bounds-check 1, i0, i2, i3
            i5 = x64:load8_s i0, i1, i4
            i6 = x64:memory.space i0
            i7 = x64:memory.size i0
            i8 = x64:memory.bounds-check 4, i0, i2, i7
            i9 = x64:load32_u i0, i6, i8
            i10 = x64:memory.space i0
            i11 = x64:memory.size i0
            i12 = x64:memory.bounds-check 4, i0, i2, i11
            i13 = x64:load32_s i0, i10, i12
            i14 = x64:int.add i9, i13
            i15 = x64:int.add i5, i14
            i16 = ret ^b0, i15
          }
        }
      */});
    });

    it('should cast float loads/stores', function() {
      fixtures.testReduction(select, function() {/*
        pipeline {
          b0 {
            i0 = state
            i1 = i64.const 1
            i2 = f64.const 1
            i3 = addr.from_64 i1
            i4 = f64.store ^b0, i0, i3, i2
            i5 = updateState ^i4, 4, i0
            i6 = f64.load i5, i3
            i7 = ret ^b0, i6
          }
        }
      */}, function() {/*
        pipeline {
          b0 {
            i0 = state
            i1 = x64:memory.space i0
            i2 = i64.const 1
            i3 = x64:memory.size i0
            i4 = x64:memory.bounds-check 8, i0, i2, i3
            i5 = f64.const 1
            i6 = x64:f64.store ^b0, i0, i1, i4, i5
            i7 = updateState ^i6, 4, i0
            i8 = x64:memory.space i7
            i9 = x64:memory.size i7
            i10 = x64:memory.bounds-check 8, i7, i2, i9
            i11 = x64:f64.load i7, i8, i10
            i12 = ret ^b0, i11
          }
        }
      */});
    });
  });
});
