package com.lumiedu.prompt.service;

import com.lumiedu.prompt.dto.request.CreatePromptVersionRequest;
import com.lumiedu.prompt.dto.request.UpdatePromptVersionRequest;
import com.lumiedu.prompt.dto.response.PromptVersionResponse;
import com.lumiedu.prompt.enums.ChangeType;
import com.lumiedu.user.entity.User;

import java.util.List;

public interface PromptVersionService {
    List<PromptVersionResponse> getVersionsByPromptId(Long promptId);
    PromptVersionResponse getVersionById(Long versionId);
    PromptVersionResponse createVersion(Long promptId, CreatePromptVersionRequest request, User currentUser);
    PromptVersionResponse updateDraftVersion(Long versionId, UpdatePromptVersionRequest request, User currentUser);
    String calculateNextVersion(Long promptId, ChangeType changeType);
}
