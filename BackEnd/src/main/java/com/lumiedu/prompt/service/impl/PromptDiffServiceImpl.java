package com.lumiedu.prompt.service.impl;

import com.lumiedu.prompt.dto.response.PromptDiffResponse;
import com.lumiedu.prompt.dto.response.PromptDiffResponse.DiffLine;
import com.lumiedu.prompt.entity.PromptVersion;
import com.lumiedu.prompt.repository.PromptVersionRepository;
import com.lumiedu.prompt.service.PromptDiffService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PromptDiffServiceImpl implements PromptDiffService {

    private final PromptVersionRepository promptVersionRepository;

    @Override
    public PromptDiffResponse compareVersions(Long fromVersionId, Long toVersionId) {
        PromptVersion fromVersion = promptVersionRepository.findById(fromVersionId)
                .orElseThrow(() -> new IllegalArgumentException("From version not found with id: " + fromVersionId));
        PromptVersion toVersion = promptVersionRepository.findById(toVersionId)
                .orElseThrow(() -> new IllegalArgumentException("To version not found with id: " + toVersionId));

        List<String> fromLines = Arrays.asList(fromVersion.getMarkdownContent().split("\r?\n"));
        List<String> toLines = Arrays.asList(toVersion.getMarkdownContent().split("\r?\n"));

        List<DiffLine> diffLines = computeLineDiff(fromLines, toLines);

        int additions = 0;
        int deletions = 0;
        int unchanged = 0;

        for (DiffLine line : diffLines) {
            if ("ADD".equals(line.getType())) {
                additions++;
            } else if ("DELETE".equals(line.getType())) {
                deletions++;
            } else {
                unchanged++;
            }
        }

        return PromptDiffResponse.builder()
                .fromVersionId(fromVersion.getId())
                .fromVersionNumber(fromVersion.getVersion())
                .toVersionId(toVersion.getId())
                .toVersionNumber(toVersion.getVersion())
                .promptCode(toVersion.getPrompt().getCode())
                .promptName(toVersion.getPrompt().getName())
                .diffLines(diffLines)
                .additionsCount(additions)
                .deletionsCount(deletions)
                .unchangedCount(unchanged)
                .build();
    }

    /**
     * Standard Longest Common Subsequence (LCS) based Line Diff implementation.
     */
    private List<DiffLine> computeLineDiff(List<String> oldLines, List<String> newLines) {
        int m = oldLines.size();
        int n = newLines.size();

        int[][] dp = new int[m + 1][n + 1];

        for (int i = m - 1; i >= 0; i--) {
            for (int j = n - 1; j >= 0; j--) {
                if (oldLines.get(i).equals(newLines.get(j))) {
                    dp[i][j] = dp[i + 1][j + 1] + 1;
                } else {
                    dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
                }
            }
        }

        List<DiffLine> result = new ArrayList<>();
        int i = 0, j = 0;
        int oldLineNo = 1, newLineNo = 1;

        while (i < m && j < n) {
            if (oldLines.get(i).equals(newLines.get(j))) {
                result.add(DiffLine.builder()
                        .type("UNCHANGED")
                        .oldLineNumber(oldLineNo++)
                        .newLineNumber(newLineNo++)
                        .content(oldLines.get(i))
                        .build());
                i++;
                j++;
            } else if (dp[i + 1][j] >= dp[i][j + 1]) {
                result.add(DiffLine.builder()
                        .type("DELETE")
                        .oldLineNumber(oldLineNo++)
                        .newLineNumber(null)
                        .content(oldLines.get(i))
                        .build());
                i++;
            } else {
                result.add(DiffLine.builder()
                        .type("ADD")
                        .oldLineNumber(null)
                        .newLineNumber(newLineNo++)
                        .content(newLines.get(j))
                        .build());
                j++;
            }
        }

        while (i < m) {
            result.add(DiffLine.builder()
                    .type("DELETE")
                    .oldLineNumber(oldLineNo++)
                    .newLineNumber(null)
                    .content(oldLines.get(i))
                    .build());
            i++;
        }

        while (j < n) {
            result.add(DiffLine.builder()
                    .type("ADD")
                    .oldLineNumber(null)
                    .newLineNumber(newLineNo++)
                    .content(newLines.get(j))
                    .build());
            j++;
        }

        return result;
    }
}
