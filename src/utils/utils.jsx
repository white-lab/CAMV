
exports.cmp = function (a, b) {
  if (Array.isArray(a) && Array.isArray(b)) {
    return (
      a === b ||
      (
        a.length == b.length &&
        a.every((v, i) => exports.cmp(v, b[i]))
      )
    )
  } else {
    return a == b
  }
}
