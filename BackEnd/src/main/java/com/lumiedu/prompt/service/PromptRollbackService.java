package com.lumiedu.prompt.service;

import com.lumiedu.prompt.dto.request.RollbackPromptRequest;
import com.lumiedu.prompt.dto.response.PromptVersionResponse;
import com.lumiedu.user.entity.User;

public interface PromptRollbackService {
    PromptVersionResponse rollbackToVersion(Long promptId, RollbackPromptRequest request, User currentUser);
}
