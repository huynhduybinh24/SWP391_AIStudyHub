package com.lumiedu.prompt.service;

import com.lumiedu.prompt.dto.request.ReviewPromptVersionRequest;
import com.lumiedu.prompt.dto.response.PromptReviewHistoryResponse;
import com.lumiedu.prompt.dto.response.PromptVersionResponse;
import com.lumiedu.user.entity.User;

import java.util.List;

public interface PromptWorkflowService {
    PromptVersionResponse submitForReview(Long versionId, User currentUser);
    PromptVersionResponse approveVersion(Long versionId, ReviewPromptVersionRequest request, User currentUser);
    PromptVersionResponse rejectVersion(Long versionId, ReviewPromptVersionRequest request, User currentUser);
    PromptVersionResponse publishVersion(Long versionId, User currentUser);
    List<PromptReviewHistoryResponse> getReviewHistory(Long versionId);
}
