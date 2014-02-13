var microdom = require('microdom');
var defined = function(a) {
  return typeof a !== 'undefined';
};

var string = function(a) {
  return Object.prototype.toString.call(a) === '[object String]';
}

function Expression(left, operator, right) {

  if (!(this instanceof Expression)) {
    return new Expression(left, operator, right);
  }

  if (left instanceof Expression) {
    left.parent = this;
  }

  if (right instanceof Expression) {
    right.parent = this;
  }

  this.left = left;
  this.right = right;
  this.operator = new Operator(operator);
}

Expression.isExpression = function(a) {
  return a && a.name && a.name === 'expression';
}


Expression.prototype.constructor = Expression;
Expression.prototype.parent = null
Expression.prototype.name = 'expression';

Expression.prototype.toString = function(addParens) {
  return [
    this.left.toString(leftp),
    this.operator.toString(),
    this.right.toString(rightp),
  ].join('');
};

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

ExpressionFor.prototype.toString = function() {
  return this.variable + ' = ' + this.expression.toString();
};

function ExpressionGroup(left, op, right) {
  if (!(this instanceof ExpressionGroup)) {
    return new ExpressionGroup(left, op, right);
  }
  Expression.call(this, left, op, right);
}

ExpressionGroup.prototype = Object.create(Expression.prototype);

ExpressionGroup.prototype.constructor = ExpressionGroup;

ExpressionGroup.prototype.toString = function() {
  return '(' + Expression.prototype.toString.call(this) + ')';
};


function ExpressionFunction(fn, expression) {
  if (!(this instanceof ExpressionFunction)) {
    return new ExpressionFunction(fn, expression);
  }

  this.fn = fn;
  this.expression = expression;
}

ExpressionFunction.prototype.evaluate = function() {

};

ExpressionFunction.prototype.toString = function() {
  return this.fn + '(' + this.expression.toString() + ')';
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

Operator.prototype['^'] = function(a, b) {
  return Math.pow(a, b);
};

Operator.prototype.needsParens = function() {
  return (this.type !== '*' && this.type !== '^');
}

Operator.prototype.perform = function(a, b) {
  return this[this.type](a, b);
};

Operator.prototype.toString = function() {
  var type = ' ' + this.type + ' ';
  if (this.type === '*') {
    type = '';
  } else if (this.type === '^') {
    type = this.type;
  }
  return type;
};



function Value(val) {

}


var disolve = function(val) {
  // TODO: parse incoming string into expression tree
  return new Expression(val);
};

disolve.Expression = Expression;
disolve.ExpressionFor = ExpressionFor;
disolve.ExpressionFunction = ExpressionFunction;
disolve.ExpressionGroup = ExpressionGroup;
disolve.Operator = Operator;


if (typeof module !== "undefined" && typeof module.exports == "object") {
  module.exports = disolve;
}

if (typeof window !== "undefined") {
  window.disolve = window.disolve || disolve;
}
