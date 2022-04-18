const bn = require("bn.js");

function encodeInteger(integer) {
  let value_hex = new bn(integer.toString(), 10).toString("hex");
  return (
    "0x" +
    (value_hex.length % 64 !== 0
      ? "0".repeat(64 - (value_hex.length % 64))
      : "") +
    value_hex
  );
}

function encodeIntegerImproper(integer) {
  let value_hex = new bn(integer.toString(), 10).toString("hex");
  return (
    "0x" +
    (value_hex.length % 64 !== 0
      ? "0".repeat(64 - (value_hex.length % 64) - 2)
      : "") +
    value_hex
  );
}

function encodeIntegerExtraPadding(integer) {
  let value_hex = new bn(integer.toString(), 10).toString("hex");
  return (
    "0x" +
    (value_hex.length % 64 !== 0
      ? "0".repeat(2 * 64 - (value_hex.length % 64))
      : "") +
    value_hex
  );
}

exports.encodeInteger = encodeInteger;
exports.encodeIntegerImproper = encodeIntegerImproper;
exports.encodeIntegerExtraPadding = encodeIntegerExtraPadding;