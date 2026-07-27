package com.lumiedu.prompt.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PromptDiffResponse {
    private Long fromVersionId;
    private String fromVersionNumber;
    private Long toVersionId;
    private String toVersionNumber;
    private String promptCode;
    private String promptName;
    private List<DiffLine> diffLines;
    private Integer additionsCount;
    private Integer deletionsCount;
    private Integer unchangedCount;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DiffLine {
        private String type; // "ADD", "DELETE", "UNCHANGED"
        private Integer oldLineNumber; // Null if ADD
        private Integer newLineNumber; // Null if DELETE
        private String content;
    }
}
