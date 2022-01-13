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

exports.encodeInteger = encodeInteger;
