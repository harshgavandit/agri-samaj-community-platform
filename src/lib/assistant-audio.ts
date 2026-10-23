import { MAX_RECORDING_SECONDS } from "./assistant-contract";

export function encodeWav(samples: Float32Array, sampleRate = 16000) {
  const bytes = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(bytes);
  const label = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++)
      view.setUint8(offset + i, text.charCodeAt(i));
  };
  label(0, "RIFF");
  view.setUint32(4, bytes.byteLength - 8, true);
  label(8, "WAVEfmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  label(36, "data");
  view.setUint32(40, samples.length * 2, true);
  samples.forEach((sample, index) => {
    const bounded = Math.max(-1, Math.min(1, sample));
    view.setInt16(
      44 + index * 2,
      bounded < 0 ? bounded * 32768 : bounded * 32767,
      true,
    );
  });
  return new Blob([bytes], { type: "audio/wav" });
}

export async function prepareRecording(blob: Blob) {
  const context = new AudioContext();
  try {
    const decoded = await context.decodeAudioData(await blob.arrayBuffer());
    if (decoded.duration < 0.3 || decoded.duration > MAX_RECORDING_SECONDS + 1)
      throw new Error("Record a question between 1 and 30 seconds.");
    const output = new OfflineAudioContext(
      1,
      Math.ceil(decoded.duration * 16000),
      16000,
    );
    const source = output.createBufferSource();
    source.buffer = decoded;
    source.connect(output.destination);
    source.start();
    const mono = await output.startRendering();
    const samples = mono.getChannelData(0);
    if (!samples.some((sample) => Math.abs(sample) > 0.005))
      throw new Error(
        "No speech was detected. Check your microphone and try again.",
      );
    return encodeWav(samples);
  } finally {
    await context.close();
  }
}
