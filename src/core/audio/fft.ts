export function fftMagnitudes(input: Float64Array) {
  const size = input.length
  if (size < 2 || (size & (size - 1)) !== 0) {
    throw new Error('FFT 长度必须是 2 的幂')
  }

  const real = Float64Array.from(input)
  const imaginary = new Float64Array(size)

  for (let index = 1, reversed = 0; index < size; index += 1) {
    let bit = size >> 1
    while (reversed & bit) {
      reversed ^= bit
      bit >>= 1
    }
    reversed ^= bit
    if (index < reversed) {
      const value = real[index]
      real[index] = real[reversed]
      real[reversed] = value
    }
  }

  for (let length = 2; length <= size; length <<= 1) {
    const angle = (-2 * Math.PI) / length
    const stepReal = Math.cos(angle)
    const stepImaginary = Math.sin(angle)
    for (let offset = 0; offset < size; offset += length) {
      let twiddleReal = 1
      let twiddleImaginary = 0
      for (let index = 0; index < length / 2; index += 1) {
        const even = offset + index
        const odd = even + length / 2
        const oddReal = real[odd] * twiddleReal - imaginary[odd] * twiddleImaginary
        const oddImaginary = real[odd] * twiddleImaginary + imaginary[odd] * twiddleReal
        real[odd] = real[even] - oddReal
        imaginary[odd] = imaginary[even] - oddImaginary
        real[even] += oddReal
        imaginary[even] += oddImaginary
        const nextReal = twiddleReal * stepReal - twiddleImaginary * stepImaginary
        twiddleImaginary = twiddleReal * stepImaginary + twiddleImaginary * stepReal
        twiddleReal = nextReal
      }
    }
  }

  const magnitudes = new Float64Array(size / 2)
  for (let index = 0; index < magnitudes.length; index += 1) {
    magnitudes[index] = Math.hypot(real[index], imaginary[index])
  }
  return magnitudes
}
