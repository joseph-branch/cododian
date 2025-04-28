import parse from "parse-diff";
export function analyzeDiffForReview(patch, filename) {
    const files = parse(patch);
    const ranges = [];
    if (!files || files.length === 0)
        return ranges;
    for (const file of files) {
        file.chunks.forEach((chunk, i) => {
            const addedLines = [];
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
export function sliceFileByReviewChunks(fullText, reviewChunks) {
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
