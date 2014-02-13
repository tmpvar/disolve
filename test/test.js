var disolve;
if (typeof require !== "undefined") {
  disolve = require("../disolve.js");
} else {
  disolve = window.disolve;
}

var ok = function(a, msg) { if (!a) throw new Error(msg || "not ok"); };
var eq = function(a, b) { if (a!==b) throw new Error(a + " !== " + b); }

var Expression = disolve.Expression;
var ExpressionFor = disolve.ExpressionFor;
var ExpressionFunction = disolve.ExpressionFunction;
var ExpressionGroup = disolve.ExpressionGroup;
var Operator = disolve.Operator;

describe('Expression', function() {
  describe('debug', function() {
    it('prints nicely "2x"', function() {
      var e = Expression(2, '*', 'x');
      eq(e.toString(), '2x');
    });

    it('prints nicely "2 + x / y"', function() {
      var e = Expression(2, '+', Expression('x', '/', 'y'));
      eq(e.toString(), '2 + x / y');
    });

    it('prints nicely "x / y + 2"', function() {
      var e = Expression(Expression('x', '/', 'y'), '+', 2);
      eq(e.toString(), 'x / y + 2');
    });

    it('prints nicely "2x / 2 / y"', function() {
      var e = Expression(
        Expression(2, '*', 'x'), '/', Expression(2, '/', 'y')
      );

      eq(e.toString(), '2x / 2 / y');
    });

    it('prints nicely "2x / 3y"', function() {
      var e = Expression(
        Expression(2, '*', 'x'), '/', Expression(3, '*', 'y')
      );

      eq(e.toString(), '2x / 3y');
    });

    it('prints nicely "2x / (3 + y)"', function() {
      var e = Expression(
        Expression(2, '*', 'x'), '/', ExpressionGroup(3, '+', 'y')
      );

      eq(e.toString(), '2x / (3 + y)');
    });
  });

  describe('basics', function() {
    it('performs basic aritmetic (add)', function() {
      var r = Expression('x', '+', 10).evaluate({ x: 10});
      eq(r, 20);
    });

    it('performs basic aritmetic (subtract)', function() {
      var r = Expression('x', '-', 1).evaluate({ x: 10});
      eq(r, 9);
    });

    it('performs basic aritmetic (multiply)', function() {
      var r = Expression('x', '*', 10).evaluate({ x: 10});
      eq(r, 100);
    });

    it('performs basic aritmetic (divide)', function() {
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
    it('prints nicely "sqrt(a^2 + b^2 + c^2)"', function() {

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
});

describe('ExpresionFor', function() {
  describe('debug', function() {
    it('prints nicely "y = mx + b"', function() {
      var line = ExpressionFor('y',
        Expression(Expression('m', '*', 'x'), '+', 'b')
      );

      eq(line.toString(), 'y = mx + b');
    });

    it('prints nicely "y = mx + b / 2"', function() {
      var line = ExpressionFor('y',
        Expression(Expression('m', '*', 'x'), '+', Expression('b', '/', 2))
      );

      eq(line.toString(), 'y = mx + b / 2');
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

    it('reduces if not all params are known', function() {
      var line = ExpressionFor('y',
        Expression(
          Expression('m', '*', 'x'), '+', 'b'
        )
      );

      // var e =  line.evaluate({
      //   m : 1,
      //   b : 0
      // };
    });
  });
});
