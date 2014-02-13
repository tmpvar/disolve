var microdom = require('microdom');
var defined = function(a) {
  return typeof a !== 'undefined';
};

function Expression(left, operator, right) {

  if (!(this instanceof Expression)) {
    return new Expression(left, operator, right);
  }

  this.left = left;
  this.right = right;
  this.operator = new Operator(operator);
}

Expression.prototype.name = 'expression';

Expression.prototype.evaluate = function(knowns) {
  var right = this.right;
  var left = this.left;

  if (knowns) {
    if (defined(knowns[this.right])) {
      right = knowns[this.right];
    }

    if (defined(knowns[this.left])) {
      left = knowns[this.left];
    }
  }

  if (right instanceof Expression) {
    right = right.evaluate(knowns);
  }

  if (left instanceof Expression) {
    left = left.evaluate(knowns);
  }

  return this.operator.perform(left, right)
};

function ExpressionFor(variable, expression) {

  if (!(this instanceof ExpressionFor)) {
    return new ExpressionFor(variable, expression);
  }

  this.variable = variable;
  this.expression = expression;
}

ExpressionFor.prototype.evaluate = function(knowns) {
  knowns[this.variable] = this.expression.evaluate(knowns)
  return knowns[this.variable];
};

function Operator(type) {
  if (!(this instanceof Operator)) {
    return new Operator(type);
  }

  this.type = type;
}

Operator.prototype.name = 'operator';

Operator.prototype['+'] = function(a, b) {
  return a+b;
};

Operator.prototype['-'] = function(a, b) {
  return a-b;
};

Operator.prototype['*'] = function(a, b) {
  return a*b;
};

Operator.prototype['/'] = function(a, b) {
  return a/b;
};

Operator.prototype.perform = function(a, b) {
  return this[this.type](a, b);
};



function Value(val) {

}


var disolve = function(val) {
  // TODO: parse incoming string into expression tree
  return new Expression(val);
};

disolve.Expression = Expression;
disolve.ExpressionFor = ExpressionFor;
disolve.Operator = Operator;


if (typeof module !== "undefined" && typeof module.exports == "object") {
  module.exports = disolve;
}

if (typeof window !== "undefined") {
  window.disolve = window.disolve || disolve;
}
