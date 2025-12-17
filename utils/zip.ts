const textEncoder = new TextEncoder()

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i += 1) {
    let crc = i
    for (let j = 0; j < 8; j += 1) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1
    }
    table[i] = crc >>> 0
  }
  return table
})()

const crc32 = (data: Uint8Array): number => {
  let crc = 0xffffffff
  for (let i = 0; i < data.length; i += 1) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

export type ZipEntry = {
  name: string
  data: Uint8Array
}

export const createZip = (entries: ZipEntry[]): Blob => {
  const localChunks: Uint8Array[] = []
  const centralChunks: Uint8Array[] = []
  let offset = 0
  let centralSize = 0

  for (const entry of entries) {
    const { name, data } = entry
    const crc = crc32(data)
    const nameBytes = textEncoder.encode(name)

    const localHeaderBuffer = new ArrayBuffer(30 + nameBytes.length)
    const localView = new DataView(localHeaderBuffer)
    localView.setUint32(0, 0x04034b50, true) // Local file header signature
    localView.setUint16(4, 20, true) // Version needed to extract
    localView.setUint16(6, 0, true) // General purpose bit flag
    localView.setUint16(8, 0, true) // Compression method (STORE)
    localView.setUint16(10, 0, true) // Last mod file time
    localView.setUint16(12, 0, true) // Last mod file date
    localView.setUint32(14, crc, true)
    localView.setUint32(18, data.length, true)
    localView.setUint32(22, data.length, true)
    localView.setUint16(26, nameBytes.length, true)
    localView.setUint16(28, 0, true)

    const localHeaderBytes = new Uint8Array(localHeaderBuffer)
    localHeaderBytes.set(nameBytes, 30)
    localChunks.push(localHeaderBytes)
    localChunks.push(data)

    const centralHeaderBuffer = new ArrayBuffer(46 + nameBytes.length)
    const centralView = new DataView(centralHeaderBuffer)
    centralView.setUint32(0, 0x02014b50, true) // Central directory signature
    centralView.setUint16(4, 20, true) // Version made by
    centralView.setUint16(6, 20, true) // Version needed to extract
    centralView.setUint16(8, 0, true) // General purpose bit flag
    centralView.setUint16(10, 0, true) // Compression method
    centralView.setUint16(12, 0, true) // Last mod file time
    centralView.setUint16(14, 0, true) // Last mod file date
    centralView.setUint32(16, crc, true)
    centralView.setUint32(20, data.length, true)
    centralView.setUint32(24, data.length, true)
    centralView.setUint16(28, nameBytes.length, true)
    centralView.setUint16(30, 0, true)
    centralView.setUint16(32, 0, true)
    centralView.setUint16(34, 0, true)
    centralView.setUint16(36, 0, true)
    centralView.setUint32(38, 0, true)
    centralView.setUint32(42, offset, true)

    const centralHeaderBytes = new Uint8Array(centralHeaderBuffer)
    centralHeaderBytes.set(nameBytes, 46)
    centralChunks.push(centralHeaderBytes)

    offset += localHeaderBytes.length + data.length
    centralSize += centralHeaderBytes.length
  }

  const endBuffer = new ArrayBuffer(22)
  const endView = new DataView(endBuffer)
  endView.setUint32(0, 0x06054b50, true) // End of central dir signature
  endView.setUint16(4, 0, true) // Number of this disk
  endView.setUint16(6, 0, true) // Disk where central directory starts
  endView.setUint16(8, entries.length, true) // Number of central directory records on this disk
  endView.setUint16(10, entries.length, true) // Total number of central directory records
  endView.setUint32(12, centralSize, true)
  endView.setUint32(16, offset, true)
  endView.setUint16(20, 0, true) // ZIP file comment length

  const parts = [...localChunks, ...centralChunks, new Uint8Array(endBuffer)]
  return new Blob(parts, { type: 'application/zip' })
}
