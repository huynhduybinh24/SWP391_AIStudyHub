package com.lumiedu.prompt.service;

import com.lumiedu.prompt.dto.response.PromptDiffResponse;

public interface PromptDiffService {
    PromptDiffResponse compareVersions(Long fromVersionId, Long toVersionId);
}
