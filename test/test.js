var disolve;
if (typeof require !== "undefined") {
  disolve = require("../disolve.js");
} else {
  disolve = window.disolve;
}

var ok = function(a, msg) { if (!a) throw new Error(msg || "not ok"); };
var eq = function(a, b) { if (a!==b) throw new Error(a + " !== " + b); }
var neq = function(a, b) { if (a===b) throw new Error(a + " === " + b); }

var Expression = disolve.Expression;
var ExpressionFor = disolve.ExpressionFor;
var ExpressionFunction = disolve.ExpressionFunction;
var ExpressionGroup = disolve.ExpressionGroup;
var Operator = disolve.Operator;


describe('Operator', function() {
  describe('#isOperator', function() {
    it('handles operator instances', function() {
      ok(Operator.isOperator(new Operator('+')));
    });

    it('handles operator strings', function() {
      ok(Operator.isOperator('+'));
      ok(!Operator.isOperator('toString'));
    });
  });
});

describe('Expression', function() {
  describe('debug', function() {
    it('prints "2 * x"', function() {
      var e = Expression(2, '*', 'x');
      eq(e.toString(), '2 * x');
    });

    it('prints "2 + x / y"', function() {
      var e = Expression(2, '+', 'x', '/', 'y');
      eq(e.toString(), '2 + x / y');
    });

    it('prints "x / y + 2"', function() {
      var e = Expression(Expression('x', '/', 'y'), '+', 2);
      eq(e.toString(), 'x / y + 2');
    });

    it('prints "2 * x / 2 / y"', function() {
      var e = Expression(
        Expression(2, '*', 'x'), '/', Expression(2, '/', 'y')
      );

      eq(e.toString(), '2 * x / 2 / y');
    });

    it('prints "2 * x / 3 * y"', function() {
      var e = Expression(
        Expression(2, '*', 'x'), '/', Expression(3, '*', 'y')
      );

      eq(e.toString(), '2 * x / 3 * y');
    });

    it('prints "2 * x / (3 + y)"', function() {
      var e = Expression(2, '*', 'x', '/', ExpressionGroup(3, '+', 'y'));
      eq(e.toString(), '2 * x / (3 + y)');
    });

    it('allows multicharacter variables', function() {
      var e = Expression('dx1', '*', 'dx2');
      eq(e.toString(), 'dx1 * dx2')
    });
  });

  describe('basics', function() {
    it('performs basic arithmetic (add)', function() {
      var r = Expression('x', '+', 10).evaluate({ x: 10});
      eq(r, 20);
    });

    it('performs basic arithmetic (subtract)', function() {
      var r = Expression('x', '-', 1).evaluate({ x: 10});
      eq(r, 9);
    });

    it('performs basic arithmetic (multiply)', function() {
      var r = Expression('x', '*', 10).evaluate({ x: 10});
      eq(r, 100);
    });

    it('performs basic arithmetic (divide)', function() {
      var r = Expression('x', '/', 2).evaluate({ x: 10});
      eq(r, 5);
    });
  });

  describe('nested', function() {
    it('properly nests expression (right)', function() {
      var e = Expression(2, '*', Expression(5, '+', 2));
      eq(e.evaluate(), 14);
    });

    it('properly nests expression (left)', function() {
      var e = Expression(Expression(2, '+', 5), '*', 2);
      eq(e.evaluate(), 14);
    });

    it('properly nests expression (both)', function() {
      var e = Expression(Expression(2, '+', 5), '*', Expression(5, '+', 2));
      eq(e.evaluate(), 49);
    });
  });
});

describe('ExpressionFunction', function() {
  describe('debug', function() {
    it('prints "sqrt(a^2 + b^2 + c^2)"', function() {

      var e = ExpressionFunction('sqrt',
        Expression(
          Expression('a', '^', 2),
          '+',
          Expression(
            Expression('b', '^', 2),
            '+',
            Expression('c', '^', 2)
          )
        )
      );

      eq(e.toString(), 'sqrt(a^2 + b^2 + c^2)')
    });
  });

  describe('#evaluate', function() {
    it('uses Math.* to evaluate', function() {
      var e = ExpressionFunction('sqrt', Expression(90, '+', 10));
      eq(e.evaluate(), 10);
    });

    it('resolves variables (expression)', function() {
      var e = ExpressionFunction('sqrt', Expression(90, '+', 'a'));
      eq(e.evaluate({ a: 10 }), 10);
    })

    it('resolves knowns (string)', function() {
      var e = ExpressionFunction('sqrt', 'a');
      eq(e.evaluate({ a: 100 }), 10);
    });

    it('works with numbers', function() {
      var e = ExpressionFunction('sqrt', 100);
      eq(e.evaluate(), 10);
    });

  });
});


describe('ExpressionGroup', function() {
  describe('debug', function() {
    it('prints "sqrt((a^2 / 10) + c^2)"', function() {
      var e = ExpressionFunction('sqrt',
        Expression(
          ExpressionGroup(
            Expression('a', '^', 2),
            '/',
            10
          ),
          '+',
          Expression('c', '^', 2)
        )
      );

      eq(e.toString(), 'sqrt((a^2 / 10) + c^2)')
    });
  });

  describe('#clone', function() {
    it('returns a deep copy of the expression tree', function() {
      var e = Expression(ExpressionGroup('y', '+', 'm'), '/', ExpressionGroup('y', '/', 2));
      var e2 = e.clone();

      neq(e2, e);
      neq(e2.symbols[0], e.symbols[0]);
      neq(e2.symbols[1], e.symbols[1]);
      eq(e.toString(), '(y + m) / (y / 2)');
      eq(e.toString(), e2.toString())
    });
  });
});

describe('ExpresionFor', function() {
  describe('debug', function() {
    it('prints "y = m * x + b"', function() {
      var line = ExpressionFor('y',
        Expression(Expression('m', '*', 'x'), '+', 'b')
      );

      eq(line.toString(), 'y = m * x + b');
    });

    it('prints "y = m * x + b / 2"', function() {
      var line = ExpressionFor('y',
        Expression(Expression('m', '*', 'x'), '+', Expression('b', '/', 2))
      );

      eq(line.toString(), 'y = m * x + b / 2');
    });
  });

  describe('#clone', function() {
    it('returns a deep copy of the expression tree', function() {
      var e = ExpressionFor('y', Expression(2, '*', 'm'));
      var e2 = e.clone();

      neq(e2, e);
      eq(e2.toString(), e.toString());
      neq(e2.expression, e.expression);
    });
  });

  describe('resolve unknown', function() {

    it('resolves an unknown if all constraints are available', function() {
      var line = ExpressionFor('y', Expression(Expression('m', '*', 'x'), '+', 'b'));

      var knowns = {
        x : 10,
        m : 1,
        b : 0
      };

      eq(line.evaluate(knowns), 10);
      eq(knowns.y, 10);
    });
  });
});


describe('unknown calculation', function() {
  it('returns an array of unknowns (Expression)', function() {
    var e = ExpressionFunction('sqrt',
      Expression(
        Expression('a', '^', 2),
        '+',
        Expression(
          Expression('b', '^', 2),
          '+',
          Expression('c', '^', 2)
        )
      )
    );

    var knowns = {
      a: 2,
      b: 3
    };

    eq(e.unknowns(knowns).join(','), 'c');
  });
});

describe('partial evaluation', function() {

  it('returns a new expression (simple)', function() {
    var e = Expression('a','+', 'b');

    var knowns = {
      a: 2
    };

    eq(e.evaluate({ a: 2 }).toString(), '2 + b');
    eq(e.evaluate({ b: 2 }).toString(), 'a + 2');
  });

  it('returns a new expression (nested / right)', function() {
    var e = Expression('a','+', ExpressionGroup('a', '/', 'b'));

    var knowns = {
      a: 2
    };

    var e2 = e.evaluate({ a: 2 });

    eq(e2.toString(), '2 + (2 / b)');
    eq(e2.evaluate({ b: 4 }), 2.5);
  });

  it('returns a new expression (nested / left)', function() {
    var e = Expression(ExpressionGroup('a', '/', 'b'), '+', 'a');

    var knowns = {
      a: 2
    };

    eq(e.evaluate({ a: 2 }).toString(), '(2 / b) + 2');
  });

  it('returns a new expression (nested / both)', function() {
    var e = Expression(ExpressionGroup('a', '*', 'b'), '/', ExpressionGroup('a', '-', 'b'));

    var knowns = {
      a: 2
    };

    eq(e.evaluate({ a: 2 }).toString(), '(2 * b) / (2 - b)');
  });


  it('partial resolves y=mx+b', function() {
    var line = ExpressionFor('y',
      Expression(Expression('m', '*', 'x'), '+', 'b')
    );

    var yexpression = line.evaluate({ m: 1, b: 0 });

    eq(yexpression.evaluate({ x : 0 }), 0);
    eq(yexpression.evaluate({ x : 1 }), 1);
    eq(yexpression.evaluate({ x : 50 }), 50);
  });

});
