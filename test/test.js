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
var Operator = disolve.Operator;

describe('Expression', function() {
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

  describe('shared knowns', function() {
    it('bubbles knowns', function() {
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
