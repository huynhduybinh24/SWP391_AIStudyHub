package com.lumiedu.admin.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class BulkDocumentRequest {
    private List<Long> ids;
    private String reason;
}
