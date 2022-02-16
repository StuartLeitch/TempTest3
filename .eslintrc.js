module.exports = {
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "prettier",
    "prettier/@typescript-eslint"
  ],
  "root": true,
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "project": "./tsconfig.base.json"
  },
  "plugins": ["@typescript-eslint"],
  "rules": {
    /**
     * ========================================================================
     * Modified Airbnb JS Style Guide rules extending eslint:recommended
     * ========================================================================
     */
    // require the use of === and !==
    "eqeqeq": ["warn", "always", {"null": "ignore"}],
    // disallow else after a return in an if
    "no-else-return": ["warn", {"allowElseIf": false}],
    // enforce that class methods use "this"
    "class-methods-use-this": [
      "warn",
      {
        "exceptMethods": []
      }
    ],
    // disallow redundant return keywords
    "no-useless-return": "warn",
    // require let or const instead of var
    "no-var": "warn",
    // require method and property shorthand syntax for object literals
    "object-shorthand": [
      "warn",
      "always",
      {
        "ignoreConstructors": false,
        "avoidQuotes": true
      }
    ],
    // suggest using arrow functions as callbacks
    "prefer-arrow-callback": [
      "warn",
      {
        "allowNamedFunctions": false,
        "allowUnboundThis": true
      }
    ],
    // suggest using const declaration for vars never modified after declared
    "prefer-const": [
      "warn",
      {
        "destructuring": "any",
        "ignoreReadBeforeAssign": true
      }
    ],
    // Prefer destructuring from arrays and objects
    "prefer-destructuring": [
      "warn",
      {
        "VariableDeclarator": {
          "array": false,
          "object": true
        },
        "AssignmentExpression": {
          "array": true,
          "object": true
        }
      },
      {
        "enforceForRenamedProperties": false
      }
    ],
    // suggest using template literals instead of string concatenation
    "prefer-template": "warn",
    // specify the maximum length of a comment line in your program
    "max-len": ["warn", {"code": 100}],
    // disallow reassignment of function parameters
    "no-param-reassign": ["warn", {"props": false}],
    /**
     * ========================================================================
     * ESLint Plugin TypeScript rules extending @typescript-eslint/recommended
     * ========================================================================
     */
    // disallow unused variables
    "@typescript-eslint/no-unused-vars": "warn", // "warn" for production
    // disallow usage of the any type
    "@typescript-eslint/no-explicit-any": "warn", // "warn" for production
    // disallows magic numbers
    "@typescript-eslint/no-magic-numbers": [
      "warn",
      {
        "ignoreArrayIndexes": true,
        "ignore": [0, 1]
      }
    ], // "warn" for production
    // disallow the use of parameter properties in class constructors
    "@typescript-eslint/no-parameter-properties": "off",
    // warns if a type assertion does not change the type of an expression
    "@typescript-eslint/no-unnecessary-type-assertion": "warn",
    // require a consistent member declaration order
    "@typescript-eslint/member-ordering": "warn",
    // Warns for any two overloads that could be unified into one by using a union or an optional/rest parameter
    "@typescript-eslint/unified-signatures": "warn",
    // requires Promise-like values to be handled appropriately
    "@typescript-eslint/no-floating-promises": "warn",
    // requires any function or method that returns a Promise to be marked async
    "@typescript-eslint/promise-function-async": "warn",
    // disallow async functions which have no await expression
    "@typescript-eslint/require-await": "warn",
    // avoid using promises in places not designed to handle them
    "@typescript-eslint/no-misused-promises": "warn",
    // require explicit return types on functions and class methods
    "@typescript-eslint/explicit-function-return-type": [
      "warn",
      {
        "allowExpressions": true
      }
    ],
    "react/jsx-tag-spacing": [
      "error",
      {
        "beforeSelfClosing": "always"
      }
    ]
  },
  "globals": {
    "expect": true,
    "describe": true,
    "it": true,
    "fixture": true,
    "test": true,
    "jest": true,
    "document": true,
    "window": true,
    "fetch": true,
    "navigator": true,
    "assert": true
  },
  "env": {
    "browser": true,
    "node": true,
    "mocha": true
  }
}
