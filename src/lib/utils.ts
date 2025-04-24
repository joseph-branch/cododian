import parse from "parse-diff";

type ReviewLineRange = {
  chunkIndex: number;
  file: string;
  startLine: number;
  endLine: number;
  addedLines: number[];
};

type CodeChunk = {
  chunkIndex: number;
  file: string;
  startLine: number;
  endLine: number;
  lines: string[];
  text: string;
};

export function analyzeDiffForReview(
  patch: string,
  filename: string
): ReviewLineRange[] {
  const files = parse(patch);
  const ranges: ReviewLineRange[] = [];

  if (!files || files.length === 0) return ranges;

  for (const file of files) {
    file.chunks.forEach((chunk, i) => {
      const addedLines: number[] = [];

      for (const line of chunk.changes) {
        if (line.type === "add" && typeof line.ln === "number") {
          addedLines.push(line.ln);
        }
      }

      if (addedLines.length > 0) {
        ranges.push({
          chunkIndex: i,
          file: filename,
          startLine: addedLines[0],
          endLine: addedLines[addedLines.length - 1],
          addedLines,
        });
      }
    });
  }

  return ranges;
}

export function sliceFileByReviewChunks(
  fullText: string,
  reviewChunks: ReviewLineRange[]
): CodeChunk[] {
  const allLines = fullText.split("\n");

  return reviewChunks.map((chunk) => {
    const lines = allLines.slice(chunk.startLine - 1, chunk.endLine);
    return {
      chunkIndex: chunk.chunkIndex,
      file: chunk.file,
      startLine: chunk.startLine,
      endLine: chunk.endLine,
      lines,
      text: lines.join("\n"),
    };
  });
}
