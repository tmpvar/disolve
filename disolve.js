var defined = function(a) {
  return typeof a !== 'undefined';
};

var string = function(a) {
  return Object.prototype.toString.call(a) === '[object String]';
};

var fn = function(a) {
  return typeof a === 'function';
};

var number = function(a) {
  return Object.prototype.toString.call(a) === '[object Number]';
};

var array = function(a) {
  return Object.prototype.toString.call(a) === '[object Array]';
};

function Expression(symbols) {
  var _symbols = symbols;

  if (!array(symbols)) {
    _symbols = [];
    Array.prototype.push.apply(_symbols, arguments);
  }

  if (!(this instanceof Expression)) {
    return new Expression(_symbols);
  }

  for (var i = 0; i<_symbols.length; i++) {
    var symbol = _symbols[i];

    if (Expression.isExpression(symbol)) {
      symbol.parent = this;
    } else if (string(symbol) && Operator.isOperator(symbol)) {
      _symbols[i] = new Operator(symbol);
    }
  }

  this.symbols = _symbols;
}

Expression.isExpression = function(a) {
  return a && a.name && a.name === 'expression';
}

Expression.prototype.constructor = Expression;
Expression.prototype.parent = null
Expression.prototype.name = 'expression';

Expression.prototype.toString = function(addParens) {
  return this.symbols.join('');
};

Expression.prototype.evaluate = function(knowns) {
  knowns = knowns || {};

  var s = this.symbols.concat();
  for (var phase = 0; phase <= 1; phase++) {
    for (var i=0; i<s.length; i++) {
      if (Operator.isOperator(s[i]) && phase === Operator.ops[s[i].type]) {
        var evaluate = true;
        var p = s[i-1];
        var c = s[i];
        var n = s[i+1];

        if (defined(knowns[p])) {
          p = knowns[p];
        } else if (Expression.isExpression(p)) {
          p = p.evaluate(knowns);
        }

        if (Expression.isExpression(p) || string(p)) {
          evaluate = false;
        }

        if (defined(knowns[n])) {
          n = knowns[n];
        } else if (Expression.isExpression(n)) {
          n = n.evaluate(knowns);
        }

        if (Expression.isExpression(n) || string(n)) {
          evaluate = false;
        }

        if (evaluate) {
          s[i-1] = c.perform(p, n);
          s.splice(i,2);
          i -= 2;
        } else {
          s[i-1] = p;
          s[i+1] = n;
        }
      }
    }
  }

  return (s.length > 1) ? new (this.constructor)(s) : s[0];
};

Expression.prototype.clone = function() {
  var clone = [], symbols = this.symbols, l = symbols.length;

  for (var i = 0; i<l; i++) {
    if (fn(symbols[i].clone)) {
      clone.push(symbols[i].clone());
    } else {
      clone.push(symbols[i]);
    }
  }
  return new (this.constructor)(clone);
};

Expression.prototype.unknowns = function(knowns, unknowns) {
  unknowns = unknowns || [];

  var symbols = this.symbols, l = symbols.length;

  for (var i = 0; i<l; i++) {
    var symbol = symbols[i];
    if (Expression.isExpression(symbol)) {
      symbol.unknowns(knowns, unknowns)
    } else if (string(symbol) && !Operator.isOperator(symbol) && !defined(knowns[symbol])) {
      unknowns.push(symbol);
    }
  }

  return unknowns;
}

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

ExpressionFor.prototype.clone = function() {
  return new ExpressionFor(this.variable, this.expression.clone());
};

ExpressionFor.prototype.toString = function() {
  return this.variable + ' = ' + this.expression.toString();
};

function ExpressionGroup(symbols) {
  var _symbols = symbols;

  if (!array(symbols)) {
    _symbols = [];
    Array.prototype.push.apply(_symbols, arguments);
  }

  if (!(this instanceof ExpressionGroup)) {
    return new ExpressionGroup(_symbols);
  }

  Expression.call(this, _symbols);
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

ExpressionFunction.prototype.evaluate = function(knowns) {
  var fn = Math[this.fn] || this[this.fn];

  if (Expression.isExpression(this.expression)) {
    return fn(this.expression.evaluate(knowns));
  } else if (string(this.expression) && knowns[this.expression]) {
    return fn(knowns[this.expression]);
  } else if (number(this.expression)) {
    return fn(this.expression);
  }
};

ExpressionFunction.prototype.unknowns = function(knowns, unknowns) {
  if (Expression.isExpression(this.expression)) {
    return this.expression.unknowns(knowns, unknowns);
  }
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
Operator.prototype.constructor = Operator;

Operator.isOperator = function(a) {
  return a instanceof Operator || (defined(Operator.prototype[a]) && a.length === 1);
};

Operator.ops = {
  '^' : 0,
  '*' : 0,
  '/' : 0,
  '%' : 0,
  '+' : 1,
  '-' : 1
};

Operator.prototype.sortAgainst = function(op) {
  var ops = Operator.ops;
  return ops[this.type] >= ops[op.type];
};

Operator.prototype.clone = function() {
  return new (this.constructor)(this.type);
};

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

Operator.prototype['%'] = function(a, b) {
  return a % b;
};

Operator.prototype.perform = function(a, b) {
  return this[this.type](a, b);
};

Operator.prototype.toString = function() {
  if (this.type === '^') {
    return this.type;
  }

  return ' ' + this.type + ' ';
};

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
