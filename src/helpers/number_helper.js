export const convertNumberToCurrency = (number, locale = "ID") => {
  return new Intl.NumberFormat(locale).format(number);
};
