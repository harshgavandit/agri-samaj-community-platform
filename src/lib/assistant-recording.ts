import { HttpError } from "./http";
import { MAX_RECORDING_SECONDS, recordingFormat } from "./assistant-contract";

export function validateVoiceRecording(bytes: Buffer) {
  if (
    recordingFormat(bytes) !== "wav" ||
    bytes.readUInt32LE(4) + 8 !== bytes.length
  )
    throw new HttpError(415, "The recording is not a valid WAV file.");
  let sampleRate = 0,
    dataSize = 0,
    foundFormat = false,
    foundData = false;
  for (let offset = 12; offset + 8 <= bytes.length;) {
    const id = bytes.toString("ascii", offset, offset + 4),
      size = bytes.readUInt32LE(offset + 4),
      start = offset + 8;
    if (start + size > bytes.length)
      throw new HttpError(415, "The recording is incomplete.");
    if (id === "fmt ") {
      if (
        foundFormat ||
        size < 16 ||
        bytes.readUInt16LE(start) !== 1 ||
        bytes.readUInt16LE(start + 2) !== 1 ||
        bytes.readUInt16LE(start + 14) !== 16
      )
        throw new HttpError(415, "Use a mono PCM voice recording.");
      sampleRate = bytes.readUInt32LE(start + 4);
      foundFormat = true;
      if (
        ![16000, 24000, 48000].includes(sampleRate) ||
        bytes.readUInt32LE(start + 8) !== sampleRate * 2 ||
        bytes.readUInt16LE(start + 12) !== 2
      )
        throw new HttpError(415, "Unsupported recording format.");
    } else if (id === "data") {
      if (foundData) throw new HttpError(415, "Invalid recording data.");
      dataSize = size;
      foundData = true;
    }
    offset = start + size + (size % 2);
  }
  const seconds = dataSize / (sampleRate * 2);
  if (
    !foundFormat ||
    !foundData ||
    dataSize % 2 ||
    seconds < 0.3 ||
    seconds > MAX_RECORDING_SECONDS + 1
  )
    throw new HttpError(413, "Record a question between 1 and 30 seconds.");
  return seconds;
}
