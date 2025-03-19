import Decimal from 'decimal.js';

export const getRandomInt = (min, max) => {
  if (min > max) {
    throw new Error('Random error:  min <= max');
  }
  min = ceil(min);
  max = floor(max);
  return add(
    floor(
      Decimal.random()
        .mul(minus(max, add(min, 0)))
        .toNumber(),
    ),
    min,
  );
};

export const getRandomFloat = (min, max, precision) => {
  min = ceil(mul(min, 10 ** precision));
  max = floor(mul(max, 10 ** precision));
  return div(getRandomInt(min, max), 10 ** precision);
};

export const add = (a: number | string, b: number | string) => {
  return new Decimal(a).plus(b).toNumber();
};

export const mul = (a: number | string, b: number | string) => {
  return new Decimal(a).mul(b).toNumber();
};

export const minus = (a: number | string, b: number | string) => {
  return new Decimal(a).minus(b).toNumber();
};

export const div = (a: number | string, b: number | string) => {
  return new Decimal(a).div(b).toNumber();
};

export const ceil = (a: number | string) => {
  return new Decimal(a).ceil().toNumber();
};

export const floor = (a: number | string) => {
  return new Decimal(a).floor().toNumber();
};

export const toNumber = (a: number | string, precision = 9) => {
  const DecimalPrecision = Decimal.clone({ precision: precision });

  return new DecimalPrecision(a)
    .toNearest(1 / 10 ** precision, Decimal.ROUND_DOWN)
    .toNumber();
};

export const getPrecision = (a: number | string) => {
  const arr = a.toString().split('.');
  return arr[1] ? arr[1].length : 0;
};

export function numberWithCommasV2(x: number) {
  if (typeof x === 'string' && Number(x) < 0.01) return x;

  if (!x && x !== 0) {
    return '...'; // Return ellipsis for non-numeric values (null, undefined, etc.)
  }

  const parsedNum = parseFloat(x.toString());
  const parts = parsedNum.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

export const formatSmartNumber = (num: number | string): string => {
  if (typeof num === 'string') {
    num = Number(num);
  }

  if (num >= 10) {
    return parseFloat(num.toFixed(1)).toString();
  } else if (num >= 1) {
    return parseFloat(num.toFixed(2)).toString();
  } else {
    let numberDecimalAfterZero = 3;

    if (Number(num) >= 0.1) {
      numberDecimalAfterZero = 4;
    }

    const strNumber = num.toFixed(13).toString();
    const arr = strNumber.split('.');
    if (arr.length === 1) {
      return num.toString();
    }
    const decimal = arr[1];
    //find first non-zero number
    let index = 0;
    while (index < decimal.length && decimal[index] === '0') {
      index++;
    }
    if (index === decimal.length) {
      return parseFloat(num.toString()).toString();
    }

    let threeDecimal = decimal.slice(index, index + numberDecimalAfterZero);

    threeDecimal = Number(threeDecimal.split('').reverse().join(''))
      .toString()
      .split('')
      .reverse()
      .join('');

    return `${arr[0]}.${decimal.slice(0, index)}${threeDecimal}`;
  }
};
